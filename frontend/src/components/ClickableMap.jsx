import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import useMapLocation from "../hooks/useMapLocation";
import "leaflet/dist/leaflet.css";

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

function LocationMarker({ onPositionChange }) {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng);
    },
  });
  return null;
}

export default function ClickableMap() {
  const { location, setLocation } = useMapLocation();
  const [position, setPosition] = useState(null);
  
  const MAP_ZOOM = 13;

  // Sync position with location from context
  useEffect(() => {
    if (location) {
      setPosition(location);
    }
  }, [location]);

  // Show loading state while location is being fetched
  if (!location || !position) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map location...</p>
        </div>
      </div>
    );
  }

  const updatePositionAndContext = (newPosition) => {
    const updatedPosition = {
      ...newPosition,
      name: "Selected Location"
    };
    setPosition(updatedPosition);
    setLocation(updatedPosition);
  };

  return (
    <div className="map-container">
      <MapContainer
        center={[position.lat, position.lng]}
        zoom={MAP_ZOOM}
        className="leaflet-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[position.lat, position.lng]}>
          <Popup>
            <strong>{position.name}</strong><br/>
            Latitude: {position.lat.toFixed(4)}<br/>
            Longitude: {position.lng.toFixed(4)}
          </Popup>
        </Marker>
        <ChangeView center={[position.lat, position.lng]} zoom={MAP_ZOOM} />
        <LocationMarker onPositionChange={updatePositionAndContext} />
      </MapContainer>
    </div>
  );
}