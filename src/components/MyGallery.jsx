import React, { useState, useEffect } from 'react';
import { Trash2, Download, Image as ImageIcon, X } from 'lucide-react';
import './MyGallery.css'; 

const API_BASE = 'https://image-generator-bzub.onrender.com';

export default function MyGallery() { 
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State to track which image is currently open in the popup
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchMyGallery();
  }, []);

  const fetchMyGallery = async () => {
    try {
      const response = await fetch('https://image-generator-bzub.onrender.com/api/images/gallery', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        }
      });
      
      if (!response.ok) throw new Error('Failed to load gallery');
      
      const data = await response.json();
      setImages(data);
    } catch (err) {
      setError('Could not load your images.');
    } finally {
      setIsLoading(false);
    }
  };

  // THE FINAL FIX: Route the download through our backend proxy
  const handleDownload = (e, imageUrl, prompt) => {
    if (e) e.stopPropagation(); // Stops the popup from opening when clicking download

    // Create a safe, clean filename based on the prompt
    const safeName = prompt 
        ? prompt.substring(0, 20).replace(/[^a-z0-9]/gi, '_').toLowerCase() 
        : 'art';
    const fileName = `AI_Gallery_${safeName}.jpg`;

    // Construct the URL to our new backend route
    // We encode the URL and filename to ensure they are passed safely in the query string
    const downloadUrl = `${API_BASE}/api/images/download?url=${encodeURIComponent(imageUrl)}&filename=${encodeURIComponent(fileName)}`;

    // Create an invisible link and click it to trigger the download
    const link = document.createElement('a');
    link.href = downloadUrl;
    
    // We don't need target="_blank" because the backend sends the "attachment" header,
    // which forces the browser to download it directly without opening a new tab.
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // DELETES THE IMAGE PERMANENTLY
  const handleDelete = async (e, imageId) => {
    if (e) e.stopPropagation(); 

    if (!window.confirm("Are you sure you want to delete this masterpiece?")) return;

    try {
      const response = await fetch(`${API_BASE}/api/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete image');

      setImages(images.filter(img => img._id !== imageId));
      
      // If they deleted the image while looking at it in the popup, close the popup
      if (selectedImage && selectedImage._id === imageId) {
        setSelectedImage(null);
      }
    } catch (err) {
      alert('Failed to delete image');
    }
  };

  if (isLoading) return (
    <div className="loading-state">
      <div className="loading-spinner"></div>
      <p>Loading your collection...</p>
    </div>
  );

  return (
    <div className="gallery-container">
      <div className="gallery-header">
        <h1>Your Gallery</h1>
        <p>View and manage all your generated images</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {images.length === 0 ? (
        <div className="empty-state">
          <ImageIcon className="empty-icon" size={64} />
          <h2>No images yet</h2>
          <p>Generate your first image to see it here</p>
        </div>
      ) : (
        <div className="gallery-grid">
          {images.map((img) => (
            <div key={img._id} className="gallery-item">
              
              <div className="gallery-image-wrapper">
                <img 
                  src={img.url?.startsWith('http') ? img.url : `${API_BASE}${img.url}`}
                  alt={img.prompt} 
                  className="gallery-image" 
                  onClick={() => setSelectedImage(img)}
                  style={{ cursor: 'zoom-in' }}
                />
                <div className="image-overlay"></div>
              </div>
              
              <div className="image-footer">
                <p className="image-prompt">{img.prompt}</p>
                
                <div className="image-actions">
                  <button 
                    onClick={(e) => handleDownload(e, img.url, img.prompt)}
                    className="action-button"
                    title="Download"
                  >
                    <Download size={18} /> Download
                  </button>
                  
                  <button 
                    onClick={(e) => handleDelete(e, img._id)}
                    className="action-button delete"
                    title="Delete"
                  >
                    <Trash2 size={18} /> Delete
                  </button>
                </div>
              </div>
              
            </div>
          ))}
        </div>
      )}

      {/* ================= FULL SCREEN IMAGE POPUP (MODAL) ================= */}
      {selectedImage && (
        <div className="image-modal-overlay" onClick={() => setSelectedImage(null)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            
            <button className="close-modal-btn" onClick={() => setSelectedImage(null)}>
              <X size={24} />
            </button>
            
            <div className="modal-image-container">
              <img 
                src={selectedImage.url?.startsWith('http') ? selectedImage.url : `${API_BASE}${selectedImage.url}`}
                alt={selectedImage.prompt} 
                className="full-size-image" 
              />
            </div>
            
            <div className="modal-info">
              <p>{selectedImage.prompt}</p>
              <button 
                className="btn-primary modal-download-btn"
                onClick={(e) => handleDownload(e, selectedImage.url, selectedImage.prompt)}
              >
                <Download size={18} /> Download High-Res
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}