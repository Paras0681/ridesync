import { useState, useEffect, useRef } from "react";
import api from "./api";
import { useActiveGroup } from "./useActiveGroup";

export default function ChatScreen() {
  const [groupId, setGroupId] = useActiveGroup();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!groupId) return;
    let cancelled = false;

    async function poll() {
      try {
        const res = await api.get("/messages/", { params: { group: groupId } });
        if (!cancelled) {
          // API returns newest-first; reverse for normal chat reading order
          setMessages([...res.data.results].reverse());
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.detail || err.message);
      }
    }

    poll();
    const timer = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [groupId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    try {
      await api.post("/messages/", { group: groupId, chat_message: text, message_type: "MESSAGE" });
      setText("");
      // Refresh immediately rather than waiting for the next poll tick
      const res = await api.get("/messages/", { params: { group: groupId } });
      setMessages([...res.data.results].reverse());
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    }
  };

  if (!groupId) {
    return (
      <div style={{ padding: 24 }}>
        <h3>Which group's chat?</h3>
        <p style={{ fontSize: 13, color: "#666" }}>
          (Temporary — becomes a real picker once a "my groups" endpoint exists.)
        </p>
        <input
          placeholder="Group ID"
          onKeyDown={(e) => e.key === "Enter" && setGroupId(e.target.value)}
          style={{ padding: 8, width: 240 }}
        />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
        {messages.map((m) => (
          <div key={m.message_id} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: "#666" }}>{m.sender_name}</div>
            <div style={{ background: "#f1f1f1", padding: "6px 10px", borderRadius: 8, display: "inline-block" }}>
              {m.chat_message}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {error && <div style={{ color: "red", fontSize: 13, padding: "0 12px" }}>{error}</div>}
      <div style={{ display: "flex", borderTop: "1px solid #ddd", padding: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message…"
          style={{ flex: 1, padding: 8, marginRight: 8 }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
