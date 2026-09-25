import { useState, useEffect, useRef } from "react";
import api from "./api";
import { useActiveGroup } from "./useActiveGroup";
import GroupPicker from "./GroupPicker";

export default function ChatScreen() {
  const [group, setGroup] = useActiveGroup();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const myRiderId = localStorage.getItem("rider_id");

  useEffect(() => {
    if (!group.id) return;
    let cancelled = false;

    async function poll() {
      try {
        const res = await api.get("/messages/", { params: { group: group.name } });
        if (!cancelled) {
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
  }, [group.id, group.name]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    try {
      await api.post("/messages/", { group: group.name, chat_message: text, message_type: "MESSAGE" });
      setText("");
      const res = await api.get("/messages/", { params: { group: group.name } });
      setMessages([...res.data.results].reverse());
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    }
  };

  if (!group.id) {
    return (
      <div className="screen-container">
        <h3 className="display" style={{fontSize:24,marginTop:0}}>Which group's chat?</h3>
        <div style={{ maxWidth: 260 }}>
          <GroupPicker value={group.id} onChange={setGroup} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="screen-header" style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", margin:0 }}>
        <h3 style={{ margin: 0 }}>{group.name}</h3>
        <div style={{ width: 180 }}>
          <GroupPicker value={group.id} onChange={setGroup} />
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((m) => {
          const mine = m.sender_id === myRiderId;
          return (
            <div key={m.message_id} className={`msg-row ${mine ? "mine" : "theirs"}`}>
              <div>
                {!mine && <div className="msg-sender">{m.sender_name}</div>}
                <div className={`msg-bubble ${mine ? "mine" : "theirs"}`}>{m.chat_message}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && <div className="error-text" style={{ padding: "0 16px" }}>{error}</div>}

      <div className="chat-input-bar">
        <input
          className="input-modern"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message…"
        />
        <button className="send-round" onClick={sendMessage} aria-label="Send message">➤</button>
      </div>
    </div>
  );
}
