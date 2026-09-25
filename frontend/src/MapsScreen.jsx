import { useState } from "react";
import RideMap from "./RideMap";
import { useMyLocation } from "./useGroupLocations";
import { useActiveGroup } from "./useActiveGroup";
import api from "./api";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/backend";

export default function MapsScreen() {
  const [routeInfo, setRouteInfo] = useState(null);
  const [rideActive, setRideActive] = useState(false);
  const [group] = useActiveGroup();
  const authToken = localStorage.getItem("access_token");
  const { position } = useMyLocation(API_BASE, authToken, rideActive ? 3000 : 8000);

  const sendNotification = async () => {
    if (!group.id) {
      alert("Set your group first — open the Chat or Info tab and pick one.");
      return;
    }
    const text = window.prompt("Notification message:");
    if (!text) return;
    try {
      await api.post("/messages/", {
        group: group.name,
        chat_message: text,
        message_type: "NOTIFICATION",
      });
    } catch (err) {
      alert("Couldn't send: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{flex:1,minHeight:0,position:"relative"}}>
        <RideMap currentLocation={position} riders={[]} onRouteInfo={setRouteInfo} followMe={rideActive} />
      </div>
      <div className="map-footer">
        <button className="btn btn-notify btn-block" onClick={sendNotification}>Send Notification</button>
        <button
          disabled={!routeInfo?.route}
          className={`btn btn-block btn-ride ${rideActive ? "btn-danger" : ""}`}
          onClick={() => setRideActive((prev) => !prev)}
        >
          {rideActive ? "Stop Ride" : "Start Ride"}
        </button>
      </div>
    </div>
  );
}
