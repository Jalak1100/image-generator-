import React, { useState } from 'react'
import { Wand2, Zap } from 'lucide-react' // Added Zap icon for the credits
import './ImageGenerator.css'

// ⚡ Accept credits and setCredits from Dashboard
export default function ImageGenerator({ onImageGenerated, credits, setCredits }) {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('Realistic')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [generatedImage, setGeneratedImage] = useState(null)

  const styles = [
    { id: 'Realistic', label: 'Realistic', description: 'Photorealistic images' },
    { id: 'Cartoon', label: 'Cartoon', description: 'Colorful cartoon style' },
    { id: 'Anime', label: 'Anime', description: 'Japanese anime style' },
    { id: '3D', label: '3D', description: '3D rendered images' },
  ]

  const aspectRatios = [
    { id: '1:1', label: '1:1 (Square)', ratio: '1:1' },
    { id: '4:3', label: '4:3 (Standard)', ratio: '4:3' },
    { id: '3:4', label: '3:4 (Portrait)', ratio: '3:4' },
    { id: '16:9', label: '16:9 (Widescreen)', ratio: '16:9' },
    { id: '9:16', label: '9:16 (Mobile)', ratio: '9:16' },
  ]

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError('');

    // ⚡ 1. Frontend Credit Check
    if (credits !== null && credits !== undefined && credits <= 0) {
      setError('Your credits are finished. Credits will restore after 24 hours.');
      return;
    }

    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ prompt, style, aspectRatio })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image from server');
      }

      // ⚡ 2. Update the master credit balance on the Dashboard
      if (data.creditsRemaining !== undefined && setCredits) {
        setCredits(data.creditsRemaining);
      }
      
      // 'data' already contains the perfect { url, prompt, style } from your backend
      setGeneratedImage(data);
      
      if (onImageGenerated) {
        onImageGenerated(data);
      }

    } catch (err) {
      setError(err.message || 'Failed to generate image');
      console.error('Generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="generator-container">
      <div className="generator-header">
        <h1>Create Your Masterpiece</h1>
        <p>Describe what you imagine, and let AI bring it to life</p>
        
        {/* ⚡ CREDIT BADGE */}
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '6px',
          background: credits > 0 ? 'rgba(79, 70, 229, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
          color: credits > 0 ? '#4f46e5' : '#ef4444',
          padding: '6px 14px', 
          borderRadius: '20px', 
          fontWeight: '600',
          marginTop: '12px',
          fontSize: '14px'
        }}>
          <Zap size={16} fill="currentColor" />
          {credits !== null && credits !== undefined ? (credits > 0 ? `${credits} Credits Available` : 'Out of Credits') : 'Loading credits...'}
        </div>
      </div>

      <div className="generator-wrapper">
        <div className="generator-form-section">
          <form onSubmit={handleGenerate} className="generator-form">
            <div className="form-section">
              <label htmlFor="prompt" className="section-title">Your Prompt</label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A serene mountain landscape with a crystal-clear lake at sunset..."
                className="prompt-input"
                rows="4"
                disabled={isLoading || (credits !== null && credits !== undefined && credits <= 0)} // Disable if out of credits
              />
              <p className="input-hint">Be descriptive for best results</p>
            </div>

            <div className="form-row">
              <div className="form-section">
                <label className="section-title">Art Style</label>
                <select
                  value={style}
                  onChange={(e) => { setStyle(e.target.value); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                  className="dropdown-select"
                  disabled={isLoading || (credits !== null && credits !== undefined && credits <= 0)}
                >
                  {styles.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-section">
                <label className="section-title">Aspect Ratio</label>
                <select
                  value={aspectRatio}
                  onChange={(e) => { setAspectRatio(e.target.value); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                  className="dropdown-select"
                  disabled={isLoading || (credits !== null && credits !== undefined && credits <= 0)}
                >
                  {aspectRatios.map(ar => (
                    <option key={ar.id} value={ar.id}>
                      {ar.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              type="submit"
              className="generate-button"
              disabled={isLoading || (credits !== null && credits !== undefined && credits <= 0)}
              style={{
                opacity: (isLoading || (credits !== null && credits !== undefined && credits <= 0)) ? 0.7 : 1,
                cursor: (isLoading || (credits !== null && credits !== undefined && credits <= 0)) ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 size={20} />
                  Generate Image (1 Credit)
                </>
              )}
            </button>
          </form>
        </div>

        <div className="generator-preview-section">
          <div className="preview-box glass">
            {generatedImage ? (
              <div className="preview-image-container">
                <img src={generatedImage.url} alt="Generated" className="preview-image" />
                <div className="preview-info">
                  <p className="preview-prompt">{generatedImage.prompt}</p>
                  <p className="preview-style">{generatedImage.style}</p>
                </div>
              </div>
            ) : (
              <div className="preview-placeholder">
                <div className="placeholder-icon">🎨</div>
                <p>Your generated image will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}