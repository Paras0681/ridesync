import { useState, useEffect } from "react";
import api from "./api";
import { useActiveGroup } from "./useActiveGroup";
import GroupPicker from "./GroupPicker";

export default function InfoScreen() {
  const [group, setGroup] = useActiveGroup();
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!group.id) return;
    let cancelled = false;

    async function load() {
      try {
        const res = await api.get("/notifications/", { params: { group: group.id } });
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
  }, [group.id]);

  return (
    <div className="screen-container">
      <div className="screen-header">
        <h3 className="display" style={{ margin: 0, fontSize: 24 }}>Notifications</h3>
        <div style={{ width: 180 }}>
          <GroupPicker value={group.id} onChange={setGroup} />
        </div>
      </div>

      {error && <div className="error-text">{error}</div>}
      {!group.id && <p className="muted-text">Pick a group above to see its notifications.</p>}
      {group.id && notifications.length === 0 && !error && (
        <p className="muted-text">No notifications yet.</p>
      )}
      {notifications.map((n) => (
        <div key={n.message_id} className="list-item">
          <div className="list-item-title">{n.sender_name}</div>
          <div>{n.chat_message}</div>
          <div className="list-item-meta">{new Date(n.created_at).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}
