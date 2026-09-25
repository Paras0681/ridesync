import { useState, useEffect } from "react";

export function useMyLocation(
  apiBaseUrl,
  authToken,
  pushIntervalMs = 8000
) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);

  // Get user's GPS position
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation not supported in this browser");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setError(null);
      },
      (err) => {
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Push location to backend
  useEffect(() => {
    if (!position) return;

    const pushLocation = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/location/me`, {
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
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail ||
            data.error ||
            JSON.stringify(data)
          );
        }

        console.log("Location updated:", data);
        setError(null);
      } catch (err) {
        console.error("Location update failed:", err);
        setError(err.message);
      }
    };

    // Send immediately
    pushLocation();

    // Then send every N seconds
    const timer = setInterval(pushLocation, pushIntervalMs);

    return () => clearInterval(timer);
  }, [position, apiBaseUrl, authToken, pushIntervalMs]);

  return {
    position,
    error,
  };
}