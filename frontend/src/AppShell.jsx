import { useState, useEffect } from "react";
import api, { logout } from "./api";
import MapsScreen from "./MapsScreen";
import ChatScreen from "./ChatScreen";
import InfoScreen from "./InfoScreen";
import AccountScreen from "./AccountScreen";

const TABS = [
  { key: "maps", label: "Maps" },
  { key: "chat", label: "Chat" },
  { key: "info", label: "Info" },
  { key: "acc", label: "Acc" },
];

export default function AppShell() {
  const [activeTab, setActiveTab] = useState("maps");
  const [displayName, setDisplayName] = useState("Rider");
  const riderId = localStorage.getItem("rider_id");
  useEffect(() => {
    api
      .get(`/riders/${riderId}/`)
      .then((res) => setDisplayName(res.data.first_name))
      .catch(() => {}); // header just keeps the "Rider" placeholder on failure
  }, []);

  const renderTab = () => {
    switch (activeTab) {
      case "maps":
        return <MapsScreen />;
      case "chat":
        return <ChatScreen />;
      case "info":
        return <InfoScreen />;
      case "acc":
        return <AccountScreen />;
      default:
        return null;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 16px",
          borderBottom: "1px solid #ddd",
        }}
      >
        <span style={{ fontWeight: 600 }}>{displayName}</span>
        <button onClick={logout}>Log out</button>
      </div>

      <div style={{ flex: 1, overflow: "hidden" }}>{renderTab()}</div>

      <div style={{ display: "flex", borderTop: "1px solid #ddd" }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              padding: 12,
              border: "none",
              background: activeTab === tab.key ? "#eef2ff" : "white",
              fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? "#2563eb" : "#333",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
