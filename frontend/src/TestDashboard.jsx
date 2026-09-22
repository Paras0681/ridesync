import { useState } from "react";
import api, { logout } from "./api";

/**
 * TestDashboard
 *
 * Not a real UI — a debug harness. One button per endpoint, response shown
 * as raw JSON below. Use this to confirm the backend works end-to-end
 * (auth, pagination, each view) before we build the actual Ride/map page.
 */
export default function TestDashboard() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [label, setLabel] = useState(null);

  // --- inputs for endpoints that need an id/body ---
  const [riderId, setRiderId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [messageGroupId, setMessageGroupId] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  const run = async (name, fn) => {
    setLabel(name);
    setError(null);
    setResult(null);
    try {
      const res = await fn();
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data || err.message);
    }
  };

  const buttonStyle = { padding: "6px 12px", marginRight: 8, marginBottom: 8 };
  const sectionStyle = { marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid #ddd" };

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>RideSync API Test Dashboard</h2>
        <button onClick={logout}>Log out</button>
      </div>

      <div style={sectionStyle}>
        <h3>Riders</h3>
        <button style={buttonStyle} onClick={() => run("GET /riders/", () => api.get("/riders/"))}>
          List riders
        </button>
        <div>
          <input
            placeholder="rider_id (uuid)"
            value={riderId}
            onChange={(e) => setRiderId(e.target.value)}
            style={{ marginRight: 8 }}
          />
          <button
            style={buttonStyle}
            onClick={() => run(`GET /riders/${riderId}/`, () => api.get(`/riders/${riderId}/`))}
          >
            Get rider detail
          </button>
        </div>
      </div>

      <div style={sectionStyle}>
        <h3>Bikes</h3>
        <button style={buttonStyle} onClick={() => run("GET /bikes/", () => api.get("/bikes/"))}>
          List bikes
        </button>
      </div>

      <div style={sectionStyle}>
        <h3>Messages</h3>
        <button style={buttonStyle} onClick={() => run("GET /messages/", () => api.get("/messages/"))}>
          List messages
        </button>
        <div>
          <input
            placeholder="group id"
            value={messageGroupId}
            onChange={(e) => setMessageGroupId(e.target.value)}
            style={{ marginRight: 8 }}
          />
          <input
            placeholder="message text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            style={{ marginRight: 8 }}
          />
          <button
            style={buttonStyle}
            onClick={() =>
              run("POST /messages/", () =>
                api.post("/messages/", { group: messageGroupId, chat_message: chatMessage })
              )
            }
          >
            Send message
          </button>
        </div>
        <button
          style={buttonStyle}
          onClick={() => run("GET /notifications/", () => api.get("/notifications/"))}
        >
          List notifications
        </button>
      </div>

      <div style={sectionStyle}>
        <h3>Location</h3>
        <div>
          <input placeholder="latitude" value={lat} onChange={(e) => setLat(e.target.value)} style={{ marginRight: 8 }} />
          <input placeholder="longitude" value={lng} onChange={(e) => setLng(e.target.value)} style={{ marginRight: 8 }} />
          <button
            style={buttonStyle}
            onClick={() =>
              run("POST /location/me/", () =>
                api.post("/location/me/", { latitude: lat, longitude: lng, status: "ONROAD" })
              )
            }
          >
            Push my location
          </button>
        </div>
        <div>
          <input
            placeholder="rider_id (uuid)"
            value={riderId}
            onChange={(e) => setRiderId(e.target.value)}
            style={{ marginRight: 8 }}
          />
          <button
            style={buttonStyle}
            onClick={() =>
              run(`GET /locations/${riderId}/`, () => api.get(`/locations/${riderId}/`))
            }
          >
            Get rider's location
          </button>
        </div>
        <div>
          <input
            placeholder="group id"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            style={{ marginRight: 8 }}
          />
          <button
            style={buttonStyle}
            onClick={() =>
              run(`GET /groups/${groupId}/locations/`, () =>
                api.get(`/groups/${groupId}/locations/`)
              )
            }
          >
            Get group locations
          </button>
        </div>
      </div>

      {label && (
        <div>
          <h4>{label}</h4>
          {error && (
            <pre style={{ background: "#fee", color: "#900", padding: 12, borderRadius: 6, overflow: "auto" }}>
              {JSON.stringify(error, null, 2)}
            </pre>
          )}
          {result && (
            <pre style={{ background: "#f4f4f4", padding: 12, borderRadius: 6, overflow: "auto" }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
