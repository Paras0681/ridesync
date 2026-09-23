import { useState, useEffect } from "react";
import api from "./api";

export default function InfoScreen() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await api.get("/notifications/");
        if (!cancelled) {
          setNotifications(res.data.results);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.detail || err.message);
      }
    }

    load();
    const timer = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return (
    <div style={{ padding: 12, overflowY: "auto", height: "100%" }}>
      <h3>Notifications</h3>
      {error && <div style={{ color: "red", fontSize: 13 }}>{error}</div>}
      {notifications.length === 0 && !error && (
        <p style={{ color: "#666" }}>No notifications yet.</p>
      )}
      {notifications.map((n) => (
        <div key={n.message_id} style={{ padding: "10px 0", borderBottom: "1px solid #eee" }}>
          <div style={{ fontWeight: 600 }}>{n.sender_name}</div>
          <div>{n.chat_message}</div>
          <div style={{ fontSize: 11, color: "#999" }}>{new Date(n.created_at).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}
