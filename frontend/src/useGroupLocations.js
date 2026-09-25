import { useState, useEffect } from "react";


export function useMyLocation(apiBaseUrl, authToken, pushIntervalMs = 8000) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation not supported in this browser");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    if (!position) return;
    const timer = setInterval(() => {
      fetch(`${apiBaseUrl}/location/me/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          latitude: position.lat,
          longitude: position.lng,
          status: "ONROAD",
        }),
      }).catch((err) => setError(err.message));
    }, pushIntervalMs);

    return () => clearInterval(timer);
  }, [position, apiBaseUrl, authToken, pushIntervalMs]);

  return { position, error };
}
