import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Leaflet's default marker icons don't load correctly with bundlers (Vite/Webpack)
// unless you point them at the CDN explicitly. This is a well-known Leaflet quirk,
// not a bug in this code.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const helmetIcon = L.divIcon({
  html: '<div style="font-size:26px; line-height:34px; text-align:center;">🪖</div>',
  className: "", // avoid Leaflet's default icon box/shadow styling
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

const riderIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [20, 33],
  className: "rider-marker",
});

const destinationIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [30, 49],
  className: "destination-marker",
});

// ---- India-only viewport ----
const INDIA_BOUNDS = L.latLngBounds([6.5, 68.1], [37.6, 97.4]);
const INDIA_CENTER = [22.9734, 78.6569];
const INDIA_VIEWBOX = "68.1,37.6,97.4,6.5"; // left,top,right,bottom for Nominatim

// ---- Geocoding (search box) via OSM Nominatim, restricted to India ----
let searchAbortController = null;

async function searchPlaces(query) {
  if (!query || query.length < 3) return [];

  if (searchAbortController) searchAbortController.abort();
  searchAbortController = new AbortController();

  const params = new URLSearchParams({
    format: "json",
    q: query,
    limit: "5",
    countrycodes: "in",
    viewbox: INDIA_VIEWBOX,
    bounded: "1",
  });

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      signal: searchAbortController.signal,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((item) => ({
      label: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
  } catch (err) {
    if (err.name === "AbortError") return [];
    return [];
  }
}

// ---- Routing via OSRM public demo server ----
async function fetchRoute(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Routing request failed");
  const data = await res.json();
  if (!data.routes || data.routes.length === 0) throw new Error("No route found");
  const route = data.routes[0];

  return {
    coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    steps: route.legs[0].steps,
  };
}

// ---- Turn-by-turn text helpers ----
const MANEUVER_TEXT = {
  merge: "Merge",
  "on ramp": "Take the ramp",
  "off ramp": "Take the exit",
  fork: "Keep",
  "end of road": "At the end of the road, turn",
  turn: "Turn",
  continue: "Continue",
  roundabout: "Enter the roundabout",
  rotary: "Enter the roundabout",
  "roundabout turn": "At the roundabout, turn",
  "exit rotary": "Exit the roundabout",
  "exit roundabout": "Exit the roundabout",
};

const MODIFIER_TEXT = {
  uturn: "and make a U-turn",
  "sharp right": "sharp right",
  right: "right",
  "slight right": "slightly right",
  straight: "straight",
  "slight left": "slightly left",
  left: "left",
  "sharp left": "sharp left",
};

function describeManeuver(step) {
  const { type, modifier } = step.maneuver;
  if (type === "depart") return "Head out";
  if (type === "arrive") return "Arrive at your destination";
  const base = MANEUVER_TEXT[type] || "Continue";
  if (modifier && MODIFIER_TEXT[modifier] && ["turn", "end of road", "roundabout turn", "fork"].includes(type)) {
    return `${base} ${MODIFIER_TEXT[modifier]}`;
  }
  return base;
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

// Recenters the map once, the first time a location fix comes in — so
// logging in shows "you, zoomed in" rather than the whole India view.
// Doesn't fire again after that (FollowMe, below, handles continuous
// recentering during an active ride).
function InitialCenter({ position }) {
  const map = useMap();
  const hasCentered = useRef(false);
  useEffect(() => {
    if (position && !hasCentered.current) {
      map.setView([position.lat, position.lng], 15);
      hasCentered.current = true;
    }
  }, [position, map]);
  return null;
}

// While a ride is active, keep the map centered on the rider's live position.
function FollowMe({ position, enabled }) {
  const map = useMap();
  useEffect(() => {
    if (enabled && position) {
      map.setView([position.lat, position.lng]);
    }
  }, [position, enabled, map]);
  return null;
}

// Bottom-right "locate me" button — jumps back to the rider's current
// position at a close zoom, e.g. after they've panned away.
function LocateButton({ position }) {
  const map = useMap();
  return (
    <button
      onClick={() => position && map.setView([position.lat, position.lng], 15)}
      disabled={!position}
      title="Center on my location"
      style={{
        position: "absolute",
        bottom: 20,
        right: 10,
        zIndex: 1000,
        width: 44,
        height: 44,
        borderRadius: "50%",
        border: "1px solid #ccc",
        background: "white",
        fontSize: 20,
        cursor: position ? "pointer" : "default",
        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
      }}
    >
      📍
    </button>
  );
}

/**
 * RideMap
 *
 * Props:
 * - currentLocation: { lat, lng }
 * - riders: [{ rider_id, rider_name, latitude, longitude }]
 * - onRouteInfo: ({ route, error }) => void
 * - followMe: boolean — auto-recenter on the rider while true (during a ride)
 *
 * Destination can only be set via the search box — there is no
 * click/tap-to-drop-pin behavior.
 */
export default function RideMap({ currentLocation, riders = [], onRouteInfo, followMe = false }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [destination, setDestination] = useState(null);
  const [route, setRoute] = useState(null);
  const [error, setError] = useState(null);
  const [turnIndex, setTurnIndex] = useState(0);
  const debounceRef = useRef(null);

  const handleQueryChange = (value) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const results = await searchPlaces(value);
      setSuggestions(results);
    }, 250);
  };

  const selectDestination = useCallback((place) => {
    setDestination(place);
    setSuggestions([]);
    setQuery(place.label);
  }, []);

  useEffect(() => {
    if (!destination || !currentLocation) return;
    setError(null);
    fetchRoute(currentLocation, destination)
      .then((r) => {
        setRoute(r);
        setTurnIndex(r.steps.length > 1 ? 1 : 0); // land on the first real turn, not "depart"
        onRouteInfo?.({ route: r, error: null });
      })
      .catch((err) => {
        setError(err.message);
        onRouteInfo?.({ route: null, error: err.message });
      });
  }, [destination, currentLocation]);

  const steps = route?.steps || [];

  // Distance from the rider's current position to the START of each step,
  // i.e. how far until that step's maneuver happens.
  const cumulativeDistances = useMemo(() => {
    const arr = [0];
    let sum = 0;
    for (let i = 0; i < steps.length - 1; i++) {
      sum += steps[i].distance;
      arr.push(sum);
    }
    return arr;
  }, [steps]);

  const turnText = useMemo(() => {
    if (steps.length === 0) return null;
    const step = steps[turnIndex];
    if (step.maneuver.type === "depart") return describeManeuver(step);
    return `In ${formatDistance(cumulativeDistances[turnIndex])}, ${describeManeuver(step).toLowerCase()}`;
  }, [steps, turnIndex, cumulativeDistances]);

  const mapCenter = currentLocation ? [currentLocation.lat, currentLocation.lng] : INDIA_CENTER;
  const initialZoom = currentLocation ? 15 : 5;

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      {/* Search box — the only way to set a destination */}
      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 1000, width: 280 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search a destination in India…"
          style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc" }}
        />
        {suggestions.length > 0 && (
          <ul style={{ background: "white", border: "1px solid #ccc", borderRadius: 6, marginTop: 4, listStyle: "none", padding: 0 }}>
            {suggestions.map((s, i) => (
              <li
                key={i}
                onClick={() => selectDestination(s)}
                style={{ padding: "6px 10px", cursor: "pointer", borderBottom: "1px solid #eee" }}
              >
                {s.label}
              </li>
            ))}
          </ul>
        )}
        {error && (
          <div style={{ background: "#fee", color: "#900", marginTop: 6, padding: "6px 10px", borderRadius: 6, fontSize: 13 }}>
            {error}
          </div>
        )}
      </div>

      {/* Turn-by-turn banner with prev/next to browse the whole route */}
      {turnText && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#1a73e8",
            color: "white",
            padding: "8px 12px",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
            maxWidth: "78%",
          }}
        >
          <button
            onClick={() => setTurnIndex((i) => Math.max(0, i - 1))}
            disabled={turnIndex === 0}
            style={{ background: "none", border: "none", color: "white", fontSize: 18, cursor: turnIndex === 0 ? "default" : "pointer", opacity: turnIndex === 0 ? 0.4 : 1 }}
          >
            ‹
          </button>
          <span style={{ textAlign: "center" }}>{turnText}</span>
          <button
            onClick={() => setTurnIndex((i) => Math.min(steps.length - 1, i + 1))}
            disabled={turnIndex === steps.length - 1}
            style={{ background: "none", border: "none", color: "white", fontSize: 18, cursor: turnIndex === steps.length - 1 ? "default" : "pointer", opacity: turnIndex === steps.length - 1 ? 0.4 : 1 }}
          >
            ›
          </button>
        </div>
      )}

      <MapContainer
        center={mapCenter}
        zoom={initialZoom}
        minZoom={5}
        maxZoom={18}
        maxBounds={INDIA_BOUNDS}
        maxBoundsViscosity={1.0}
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <ZoomControl position="bottomleft" />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <InitialCenter position={currentLocation} />
        <FollowMe position={currentLocation} enabled={followMe} />
        <LocateButton position={currentLocation} />

        {currentLocation && (
          <Marker position={[currentLocation.lat, currentLocation.lng]} icon={helmetIcon}>
            <Popup>You</Popup>
          </Marker>
        )}

        {riders.map((r) => (
          <Marker key={r.rider_id} position={[r.latitude, r.longitude]} icon={riderIcon}>
            <Popup>{r.rider_name}</Popup>
          </Marker>
        ))}

        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
            <Popup>{destination.label}</Popup>
          </Marker>
        )}

        {route && <Polyline positions={route.coordinates} color="#1a73e8" weight={5} />}
      </MapContainer>
    </div>
  );
}
