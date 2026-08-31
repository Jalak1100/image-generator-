import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import Image from '../models/Image.js';
import User from '../models/User.js'; // MUST IMPORT USER MODEL FOR CREDITS
import { buildStyledPrompt, mapAspectRatioToDimensions } from '../utils/imageGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Security Guard
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Access denied. Please log in." });
    }
    
    const token = authHeader.split(' ')[1];
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified; 
        next();
    } catch (err) {
        res.status(400).json({ error: "Invalid token." });
    }
};

// 1. GENERATE & SAVE IMAGE (With 24-Hour Credit System!)
router.post('/generate', async (req, res) => {
    const { prompt, style, aspectRatio } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    try {
        const authHeader = req.headers.authorization;
        let userId = null;
        let user = null;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const verified = jwt.verify(token, process.env.JWT_SECRET);
                userId = verified.userId || verified.id;
                user = await User.findById(userId);
            } catch (err) {
                console.log('Token was invalid or expired, treating as guest.');
            }
        }

        if (user) {
            const HOURS_24 = 24 * 60 * 60 * 1000;
            const creditResetDate = user.creditsResetAt || user.lastCreditReset || user.createdAt || Date.now();
            const timeSinceLastReset = Date.now() - new Date(creditResetDate).getTime();

            if (timeSinceLastReset > HOURS_24) {
                user.credits = 5;
                user.creditsResetAt = Date.now();
            }

            if (user.credits <= 0) {
                return res.status(403).json({ 
                    error: 'Your credits are finished. Credits will restore after 24 hours.' 
                });
            }
        }

        const finalPrompt = buildStyledPrompt(prompt, style);
        const { width, height } = mapAspectRatioToDimensions(aspectRatio);

        console.log('AI Prompt:', finalPrompt);
        console.log('Style:', style);
        console.log('Aspect Ratio:', aspectRatio, '=>', width, 'x', height);

        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=${width}&height=${height}&nologo=true`;

console.log("Generating image:", imageUrl);

const response = await fetch(imageUrl);

        if (!response.ok) {
    const errorText = await response.text();
    console.log("Pollinations Response:", errorText);
    throw new Error(`Pollinations API Error: ${response.status}`);
}

        const buffer = await response.arrayBuffer();
        const fileName = `art_${Date.now()}.jpg`;
        const savePath = path.join(uploadDir, fileName);
        fs.writeFileSync(savePath, Buffer.from(buffer));
        const permanentUrl = `http://localhost:5000/uploads/${fileName}`;

        // --- DATABASE SAVE & CREDIT DEDUCTION ---
        if (user) {
            // Save the image
            const newImage = new Image({
                userId: userId, 
                url: permanentUrl,
                prompt: prompt,
                style: style || 'realistic'
            });
            await newImage.save();

            // Deduct the credit and save the user's new balance
            user.credits -= 1;
            await user.save();

            // Send back the image AND their updated credit balance
            return res.json({ 
                imageUrl: permanentUrl, 
                url: permanentUrl,
                creditsRemaining: user.credits 
            });
        }

        // If they were a guest, just send the image back normally
        res.json({ imageUrl: permanentUrl, url: permanentUrl });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to generate image" });
    }
});

// 2. FETCH GALLERY (Only shows logged-in user's images)
router.get('/gallery', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const userImages = await Image.find({ userId: userId }).sort({ createdAt: -1 });
        res.json(userImages);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch gallery" });
    }
});

    // Fetch user's previous images (frontend compatibility)
router.get('/my-images', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const userImages = await Image.find({ userId }).sort({ createdAt: -1 });
        res.json(userImages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch images" });
    }
});

// ⚡ 3. NEW: FETCH CREDITS ROUTE
// This lets the Dashboard check the balance the moment the user logs in
router.get('/credits', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const user = await User.findById(userId);
        
        if (!user) return res.status(404).json({ error: "User not found" });

        // Run the 24-hour lazy reset check here too, so the UI updates instantly
        const HOURS_24 = 24 * 60 * 60 * 1000;
        const creditResetDate = user.creditsResetAt || user.lastCreditReset || user.createdAt || Date.now();
        const timeSinceLastReset = Date.now() - new Date(creditResetDate).getTime();
        
        if (timeSinceLastReset > HOURS_24) {
            user.credits = 5;
            user.creditsResetAt = Date.now();
            await user.save();
        }

        res.json({ credits: user.credits });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch credits" });
    }
});

// 4. Background Proxy Route for Downloading
router.post('/download-proxy', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });

    const response = await fetch(url);
    if (!response.ok) throw new Error('External fetch failed');

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'image/jpeg');
    res.send(buffer);
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: 'Failed to proxy image' });
  }
});

// 5. DELETE IMAGE 
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const image = await Image.findOne({ _id: req.params.id, userId: userId });
        
        if (!image) return res.status(404).json({ error: "Image not found" });

        const fileName = image.url.split('/uploads/')[1];
        const filePath = path.join(uploadDir, fileName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath); 
        }

        await image.deleteOne();
        
        res.json({ message: "Image successfully deleted" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete image" });
    }
});

export default router;