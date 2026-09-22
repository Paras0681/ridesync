import { useState, useEffect, useRef, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  ZoomControl,
  useMapEvents,
  useMap,
} from "react-leaflet";
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
// Roughly covers mainland India + islands. Used both to lock map panning
// and to scope search results so Nominatim doesn't waste time matching
// place names outside the country.
const INDIA_BOUNDS = L.latLngBounds([6.5, 68.1], [37.6, 97.4]);
const INDIA_CENTER = [22.9734, 78.6569];
const INDIA_VIEWBOX = "68.1,37.6,97.4,6.5"; // left,top,right,bottom for Nominatim

// ---- Geocoding (search box) via OSM Nominatim ----
// Free, no API key. Usage policy: max ~1 request/sec, must set a
// descriptive User-Agent/Referer in production. Restricting to India
// (countrycodes + viewbox/bounded) both matches the "India only" ask and
// trims irrelevant matches, which is most of what was making it feel slow.
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
    if (err.name === "AbortError") return []; // a newer keystroke superseded this request
    return [];
  }
}

// ---- Routing via OSRM public demo server ----
// steps=true gives us the turn-by-turn maneuver list, not just the line.
async function fetchRoute(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Routing request failed");
  const data = await res.json();
  if (!data.routes || data.routes.length === 0) throw new Error("No route found");
  const route = data.routes[0];
  const steps = route.legs[0].steps;

  return {
    coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distanceKm: (route.distance / 1000).toFixed(1),
    durationMin: Math.round(route.duration / 60),
    instruction: buildInstruction(steps),
  };
}

// ---- Turn-by-turn instruction text ----
// OSRM's first step is always "depart"; its maneuver is at the START of
// the step, and its .distance is how far you travel before the NEXT
// maneuver (steps[1]) happens. So "next instruction" = describe(steps[1]),
// "distance until then" = steps[0].distance. Since the whole route is
// recalculated fresh every time the rider's position updates, this stays
// accurate without any separate "how far along the route am I" tracking.
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

function buildInstruction(steps) {
  if (!steps || steps.length === 0) return null;
  if (steps.length === 1) return describeManeuver(steps[0]);

  const current = steps[0];
  const next = steps[1];

  if (current.distance < 30) {
    return describeManeuver(next);
  }
  return `In ${formatDistance(current.distance)}, ${describeManeuver(next).toLowerCase()}`;
}

// While a ride is active, keep the map centered on the rider's live
// position instead of requiring them to manually pan/scroll while driving.
function FollowMe({ position, enabled }) {
  const map = useMap();
  useEffect(() => {
    if (enabled && position) {
      map.setView([position.lat, position.lng]);
    }
  }, [position, enabled, map]);
  return null;
}

// Lets the user click directly on the map to drop a destination pin,
// as an alternative to typing in the search box.
function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect({ lat: e.latlng.lat, lng: e.latlng.lng, label: "Dropped pin" });
    },
  });
  return null;
}

/**
 * RideMap
 *
 * Props:
 * - currentLocation: { lat, lng } — the logged-in rider's own position
 * - riders: [{ rider_id, rider_name, latitude, longitude }] — other riders'
 *   latest locations.
 * - onRouteInfo: ({ route, error }) => void — called whenever the route
 *   changes; route includes distanceKm, durationMin, and instruction.
 * - followMe: boolean — auto-recenter the map on the rider while true.
 */
export default function RideMap({ currentLocation, riders = [], onRouteInfo, followMe = false }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [destination, setDestination] = useState(null);
  const [route, setRoute] = useState(null);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  const handleQueryChange = (value) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    // 250ms instead of 400ms — the remaining latency is Nominatim's own
    // response time, which this can't fix, but every bit of local delay
    // we remove helps it feel more responsive.
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
        onRouteInfo?.({ route: r, error: null });
      })
      .catch((err) => {
        setError(err.message);
        onRouteInfo?.({ route: null, error: err.message });
      });
  }, [destination, currentLocation]);

  const mapCenter = currentLocation ? [currentLocation.lat, currentLocation.lng] : INDIA_CENTER;
  const initialZoom = currentLocation ? 13 : 5;

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      {/* Search box */}
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

      {/* Turn-by-turn banner, Google-Maps-nav style */}
      {route?.instruction && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            background: "#1a73e8",
            color: "white",
            padding: "10px 20px",
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 600,
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
            maxWidth: "70%",
            textAlign: "center",
          }}
        >
          {route.instruction}
        </div>
      )}

      {!currentLocation && (
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            background: "white",
            padding: "6px 14px",
            borderRadius: 6,
            fontSize: 13,
            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          }}
        >
          Waiting for your location…
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
        {/* Zoom control moved to bottom-left per request */}
        <ZoomControl position="bottomleft" />

        {/* Standard OpenStreetMap tiles — free, no API key. As noted
            earlier, raster tiles like this always render the full
            cartography (buildings, parks, labels) since they're
            pre-rendered images; a true "roads only" look needs vector
            tiles + a custom style (e.g. MapLibre) as a separate project. */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onSelect={selectDestination} />
        <FollowMe position={currentLocation} enabled={followMe} />

        {currentLocation && (
          <Marker position={[currentLocation.lat, currentLocation.lng]}>
            <Popup>Me</Popup>
          </Marker>
        )}

        {/* Other riders in the group */}
        {riders.map((r) => (
          <Marker key={r.rider_id} position={[r.latitude, r.longitude]} icon={riderIcon}>
            <Popup>{r.rider_name}</Popup>
          </Marker>
        ))}

        {/* Destination pin */}
        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
            <Popup>{destination.label}</Popup>
          </Marker>
        )}

        {/* Route line */}
        {route && <Polyline positions={route.coordinates} color="#1a73e8" weight={5} />}
      </MapContainer>
    </div>
  );
}
