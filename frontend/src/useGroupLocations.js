import { useState, useEffect, useRef } from "react";

/**
 * useGroupLocations
 *
 * Polls GET /groups/<group_id>/locations/ every `intervalMs` and keeps the
 * result in state. This is the stand-in for real-time updates until the
 * Channels + Redis WebSocket layer is built — swap the polling loop below
 * for a WebSocket subscription later without changing how RideMap consumes
 * the data (it just wants an array of {rider_id, rider_name, latitude,
 * longitude}).
 */
export function useGroupLocations(groupId, apiBaseUrl, authToken, intervalMs = 5000) {
  const [riders, setRiders] = useState([]);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!groupId) return;

    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`${apiBaseUrl}/groups/${groupId}/locations/`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setRiders(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    poll(); // fetch immediately, then on an interval
    timerRef.current = setInterval(poll, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(timerRef.current);
    };
  }, [groupId, apiBaseUrl, authToken, intervalMs]);

  return { riders, error };
}

/**
 * useMyLocation
 *
 * Watches the browser's own geolocation and periodically POSTs it to
 * /locations/me/ so other riders in the group can see it. Only works while
 * this tab/page is open and in the foreground — this is the browser-only
 * ceiling discussed earlier; true background tracking needs the native
 * (Capacitor/React Native) app.
 */
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

/**
 * Example usage in a page component:
 *
 * import RideMap from "./RideMap";
 * import { useGroupLocations, useMyLocation } from "./useGroupLocations";
 *
 * function GroupRidePage({ groupId, authToken }) {
 *   const API_BASE = "https://your-django-backend.com/api";
 *   const { position } = useMyLocation(API_BASE, authToken);
 *   const { riders } = useGroupLocations(groupId, API_BASE, authToken);
 *
 *   return <RideMap currentLocation={position} riders={riders} />;
 * }
 */
