import { useState } from "react";
import RideMap from "./RideMap";
import { useMyLocation } from "./useGroupLocations";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/backend";

export default function MapsScreen() {
  const [routeInfo, setRouteInfo] = useState(null);
  const [rideActive, setRideActive] = useState(false);
  const authToken = localStorage.getItem("access_token");

  // Pushes location every 8s normally; while riding, push faster (3s) so
  // the marker and rerouting feel live rather than laggy.
  const { position } = useMyLocation(API_BASE, authToken, rideActive ? 3000 : 8000);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: 1, position: "relative" }}>
        <RideMap
          currentLocation={position}
          riders={[]}
          onRouteInfo={setRouteInfo}
          followMe={rideActive}
        />
      </div>

      {/* Footer bar */}
      <div style={{ display: "flex", borderTop: "1px solid #ddd" }}>
        <div style={{ flex: 1, padding: 14, textAlign: "center", borderRight: "1px solid #ddd" }}>
          {routeInfo?.route ? (
            <span>Est time: {routeInfo.route.durationMin} min</span>
          ) : (
            <span style={{ color: "#999" }}>Pick a destination</span>
          )}
        </div>
        <button
          disabled={!routeInfo?.route}
          style={{
            flex: 1,
            border: "none",
            background: !routeInfo?.route ? "#ccc" : rideActive ? "#dc2626" : "#2563eb",
            color: "white",
            fontWeight: 600,
          }}
          onClick={() => setRideActive((prev) => !prev)}
        >
          {rideActive ? "Stop Ride" : "Start Ride"}
        </button>
      </div>
    </div>
  );
}
