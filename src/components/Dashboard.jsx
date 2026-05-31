import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { imageAPI } from '../api/client'
import Sidebar from './Sidebar'
import ImageGenerator from './ImageGenerator'
import MyGallery from './MyGallery'
import './Dashboard.css'

export default function Dashboard() {
  const { logout } = useAuth()
  const [activeTab, setActiveTab] = useState('generate')
  const [images, setImages] = useState([])
  const [isLoadingGallery, setIsLoadingGallery] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  
  // ⚡ NEW: Master Credit State for the whole Dashboard
  const [credits, setCredits] = useState(null)

  // Fetch initial credits when dashboard loads
  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const response = await fetch('https://image-generator-bzub.onrender.com/api/images/credits', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        if (response.ok) setCredits(data.credits);
      } catch (err) {
        console.error("Failed to load credits");
      }
    };
    fetchCredits();
  }, []);

  const loadMyImages = async () => {
    setIsLoadingGallery(true)
    try {
      const response = await imageAPI.getMyImages()
      setImages(response.data.images || [])
    } catch (err) {
      console.error('Error loading images:', err)
    } finally {
      setIsLoadingGallery(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'gallery') {
      loadMyImages()
    }
  }, [activeTab])

  const handleImageGenerated = (newImage) => {
    setImages([newImage, ...images])
    setActiveTab('gallery')
  }

  const handleImageDeleted = (imageId) => {
    setImages(images.filter(img => img.id !== imageId))
  }

  // 2. THE FORCEFUL DOWNLOAD FUNCTION (Using the robust POST proxy method)
  const handleDownload = async (imageUrl, promptText) => {
    try {
      const response = await fetch('https://image-generator-bzub.onrender.com/api/images/download-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ url: imageUrl })
      });

      if (!response.ok) throw new Error('Backend proxy failed');

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      const safeName = promptText ? promptText.substring(0, 15).replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'art';
      link.download = `AIGallery_${safeName}.jpg`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

    } catch (err) {
      console.error("Download Error:", err);
      // Fallback: open in new tab if everything else fails
      window.open(imageUrl, '_blank'); 
    }
  };

  return (
    <div className="dashboard">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={logout}
        credits={credits} // ⚡ Pass credits to Sidebar to display!
      />
      <main className="dashboard-content">
        {activeTab === 'generate' && (
          <ImageGenerator 
            onImageGenerated={handleImageGenerated} 
            credits={credits} // ⚡ Pass current credits down
            setCredits={setCredits} // ⚡ Let generator update the master balance
            onGoToGallery={() => setActiveTab('gallery')} // ⚡ ADDED: Let generator switch to gallery tab when out of credits!
          />
        )}
        {activeTab === 'gallery' && (
          <MyGallery
            images={images}
            isLoading={isLoadingGallery}
            onImageDeleted={handleImageDeleted}
            // 3. PASS THE NEW FUNCTIONS TO YOUR GALLERY COMPONENT
            onImageClick={(image) => setSelectedImage(image)} 
            onDownload={(e, imageUrl, prompt) => {
              if (e) e.stopPropagation();
              handleDownload(imageUrl, prompt);
            }} 
          />
        )}
      </main>

      {/* ================= FULL SCREEN MODAL ================= */}
      {selectedImage && (
        <div className="image-modal-overlay" onClick={() => setSelectedImage(null)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setSelectedImage(null)}>✕</button>
            <img 
              src={selectedImage.url || selectedImage.imageUrl} 
              alt={selectedImage.prompt} 
              className="full-size-image" 
            />
            <div className="modal-info">
              <p>{selectedImage.prompt}</p>
              <button 
                className="btn-primary"
                onClick={() => handleDownload(selectedImage.url || selectedImage.imageUrl, selectedImage.prompt)}
              >
                Download High-Res
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}