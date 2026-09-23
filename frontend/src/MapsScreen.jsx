import { useState } from "react";
import RideMap from "./RideMap";
import { useMyLocation } from "./useGroupLocations";
import { useActiveGroup } from "./useActiveGroup";
import api from "./api";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/backend";

export default function MapsScreen() {
  const [routeInfo, setRouteInfo] = useState(null);
  const [rideActive, setRideActive] = useState(false);
  const [groupId] = useActiveGroup();
  const authToken = localStorage.getItem("access_token");

  const { position } = useMyLocation(API_BASE, authToken, rideActive ? 3000 : 8000);

  const sendNotification = async () => {
    if (!groupId) {
      alert("Set your group first — open the Chat or Info tab and enter a group ID once.");
      return;
    }
    // Simple prompt for now; can be swapped for a proper modal later.
    const text = window.prompt("Notification message:");
    if (!text) return;
    try {
      await api.post("/messages/", { group: groupId, chat_message: text, message_type: "NOTIFICATION" });
    } catch (err) {
      alert("Couldn't send: " + (err.response?.data?.detail || err.message));
    }
  };

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

      {/* Footer: Send Notification replaces the old Est-time slot */}
      <div style={{ display: "flex", borderTop: "1px solid #ddd" }}>
        <button
          style={{ flex: 1, border: "none", padding: 16, background: "#f59e0b", color: "white", fontWeight: 600 }}
          onClick={sendNotification}
        >
          Send Notification
        </button>
        <button
          disabled={!routeInfo?.route}
          style={{
            flex: 1,
            border: "none",
            padding: 16,
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
