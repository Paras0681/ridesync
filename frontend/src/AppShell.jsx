import { useState } from "react";
import { logout } from "./api";
import MapsScreen from "./MapsScreen";

const TABS = [
  { key: "maps", label: "Maps" },
  { key: "chat", label: "Chat" },
  { key: "info", label: "Info" },
  { key: "acc", label: "Acc" },
];

function StubScreen({ name }) {
  return (
    <div style={{ padding: 24, color: "#666" }}>
      <p>{name} — coming later.</p>
    </div>
  );
}

export default function AppShell() {
  const [activeTab, setActiveTab] = useState("maps");

  // NOTE: there's no "/riders/me/" endpoint yet, so we can't show the
  // rider's real name here without decoding the JWT (which only carries
  // the Django user id, not the name) or an extra API call. Placeholder
  // for now — worth adding a small "my profile" endpoint next.
  const displayName = "Rider";

  const renderTab = () => {
    switch (activeTab) {
      case "maps":
        return <MapsScreen />;
      case "chat":
        return <StubScreen name="Chat" />;
      case "info":
        return <StubScreen name="Info" />;
      case "acc":
        return <StubScreen name="Account" />;
      default:
        return null;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Header */}
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

      {/* Active tab content */}
      <div style={{ flex: 1, overflow: "hidden" }}>{renderTab()}</div>

      {/* Bottom tab bar */}
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
