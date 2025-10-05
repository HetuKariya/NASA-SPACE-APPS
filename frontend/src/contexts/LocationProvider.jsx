import { createContext, useState, useEffect, useMemo } from 'react';

const LocationContext = createContext({
  location: null,       // { lat, lng, name }
  setLocation: () => {}, 
});

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            name: "Current Location",
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocation({ name: "Surat", lat: 21.1702, lng: 72.8311 });
        }
      );
    } else {
      setLocation({ name: "Surat", lat: 21.1702, lng: 72.8311 });
    }
  }, []);

  const value = useMemo(() => ({ location, setLocation }), [location]);

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export default LocationContext;