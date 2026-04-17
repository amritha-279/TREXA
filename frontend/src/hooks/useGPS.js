import { useState } from "react";

export function useGPS() {
  const [location, setLocation] = useState(null);
  const [error,    setError]    = useState(null);
  const [loading,  setLoading]  = useState(false);

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = "Geolocation not supported by this browser";
        setError(err);
        reject(err);
        return;
      }

      setLoading(true);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(coords);
          setLoading(false);
          resolve(coords);
        },
        (err) => {
          const msg = err.message || "Location access denied";
          setError(msg);
          setLoading(false);
          reject(msg);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    });
  };

  return { location, error, loading, getLocation };
}
