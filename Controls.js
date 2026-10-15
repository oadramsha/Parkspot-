import React, { useState } from 'react';
import './Controls.css';

function Controls({ onAddSpot, userLocation, mapClickMode, setMapClickMode }) {
  const [isLeaving, setIsLeaving] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleLeavingSpot = () => {
    if (userLocation) {
      setShowPhotoUpload(true);
    } else {
      alert('Unable to get your location. Please enable location services.');
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedPhoto(file);
    }
  };

  const handlePhotoSubmit = async () => {
    if (!selectedPhoto) {
      alert('Please select a photo first');
      return;
    }

    setUploading(true);

    try {
      // Upload and verify photo
      const formData = new FormData();
      formData.append('photo', selectedPhoto);

      const response = await fetch('http://localhost:8000/api/verify-photo', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Check AI verification
      if (data.verification && !data.verification.isValid) {
        alert('⚠️ AI detected this might not be a parking spot. Please try another photo.');
        setUploading(false);
        return;
      }

      // Add spot with photo
      onAddSpot(userLocation, data.photoUrl);
      
      setIsLeaving(true);
      setShowPhotoUpload(false);
      setSelectedPhoto(null);
      setTimeout(() => setIsLeaving(false), 2000);
    } catch (err) {
      alert('Photo upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSkipPhoto = () => {
    onAddSpot(userLocation, null);
    setIsLeaving(true);
    setShowPhotoUpload(false);
    setTimeout(() => setIsLeaving(false), 2000);
  };

  return (
    <div className="controls">
      <button 
        className="btn btn-leave" 
        onClick={handleLeavingSpot}
        disabled={isLeaving}
      >
        {isLeaving ? '✓ Spot Added!' : '↖ I\'m Leaving'}
      </button>
      
      <button 
        className={`btn btn-mode ${mapClickMode ? 'active' : ''}`}
        onClick={() => setMapClickMode(!mapClickMode)}
      >
        {mapClickMode ? '✓ Click Mode ON' : '▶ Click to Add'}
      </button>

      {showPhotoUpload && (
        <div className="photo-upload-modal">
          <div className="photo-upload-content">
            <h3>Add Photo (Optional)</h3>
            <p>Upload a photo to verify the parking spot.</p>
            
            <input 
              type="file" 
              accept="image/*" 
              onChange={handlePhotoSelect}
              className="photo-input"
            />
            
            {selectedPhoto && (
              <div className="photo-preview">
                <img 
                  src={URL.createObjectURL(selectedPhoto)} 
                  alt="Preview" 
                />
              </div>
            )}
            
            <div className="photo-actions">
              <button 
                onClick={handlePhotoSubmit}
                disabled={uploading || !selectedPhoto}
                className="btn-upload"
              >
                {uploading ? 'Verifying...' : 'Upload & Verify'}
              </button>
              <button 
                onClick={handleSkipPhoto}
                disabled={uploading}
                className="btn-skip"
              >
                Skip Photo
              </button>
              <button 
                onClick={() => setShowPhotoUpload(false)}
                disabled={uploading}
                className="btn-cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Controls;
