import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  passwordHash: { 
    type: String, 
    required: true 
  },
  // ==========================================
  // ⚡ CREDIT SYSTEM FIELDS
  // ==========================================
  credits: {
    type: Number,
    default: 5 // Logged-in users start with 5 credits
  },
  creditsResetAt: {
    type: Date,
    default: Date.now // Reset timer begins when the user is created
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);