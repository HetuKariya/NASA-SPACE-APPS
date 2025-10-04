import React, { useState, useEffect } from 'react';
import { Camera, CameraResultType } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Storage } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import './App.css';

function App() {
  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState(null);
  const [platform, setPlatform] = useState('');
  const [savedData, setSavedData] = useState('');

  useEffect(() => {
    // Check which platform we're running on
    setPlatform(Capacitor.getPlatform());
    
    // Load saved data
    loadSavedData();
  }, []);

  // Take a photo using device camera
  const takePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri
      });
      
      setPhoto(image.webPath);
    } catch (error) {
      console.error('Error taking photo:', error);
      alert('Camera not available on this platform');
    }
  };

  // Get device location
  const getCurrentLocation = async () => {
    try {
      const coordinates = await Geolocation.getCurrentPosition();
      setLocation({
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude
      });
    } catch (error) {
      console.error('Error getting location:', error);
      alert('Location not available');
    }
  };

  // Save data to device storage
  const saveData = async () => {
    const dataToSave = `Saved at ${new Date().toLocaleString()}`;
    await Storage.set({
      key: 'myData',
      value: dataToSave
    });
    setSavedData(dataToSave);
  };

  // Load data from device storage
  const loadSavedData = async () => {
    const { value } = await Storage.get({ key: 'myData' });
    if (value) {
      setSavedData(value);
    }
  };

  // Fetch data from your MERN backend
  const fetchFromBackend = async () => {
    try {
      const response = await fetch('https://your-backend-url.com/api/data');
      const data = await response.json();
      console.log('Backend data:', data);
    } catch (error) {
      console.error('Error fetching from backend:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>React Mobile App</h1>
        <p>Platform: {platform}</p>
        
        <div className="button-group">
          <button onClick={takePhoto} className="btn">
            📷 Take Photo
          </button>
          
          <button onClick={getCurrentLocation} className="btn">
            📍 Get Location
          </button>
          
          <button onClick={saveData} className="btn">
            💾 Save Data
          </button>
          
          <button onClick={fetchFromBackend} className="btn">
            🌐 Fetch from Backend
          </button>
        </div>

        {photo && (
          <div className="result">
            <h3>Photo:</h3>
            <img src={photo} alt="Captured" style={{ maxWidth: '300px' }} />
          </div>
        )}

        {location && (
          <div className="result">
            <h3>Location:</h3>
            <p>Lat: {location.lat}</p>
            <p>Lng: {location.lng}</p>
          </div>
        )}

        {savedData && (
          <div className="result">
            <h3>Saved Data:</h3>
            <p>{savedData}</p>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;