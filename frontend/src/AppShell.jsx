import { useState, useEffect } from "react";
import api, { logout } from "./api";
import MapsScreen from "./MapsScreen";
import ChatScreen from "./ChatScreen";
import InfoScreen from "./InfoScreen";
import AccountScreen from "./AccountScreen";

const TABS = [
  { key: "maps", label: "Maps", icon: "🗺️" },
  { key: "chat", label: "Chat", icon: "💬" },
  { key: "info", label: "Info", icon: "🔔" },
  { key: "acc", label: "Account", icon: "👤" },
];

export default function AppShell() {
  const [activeTab, setActiveTab] = useState("maps");
  const [displayName, setDisplayName] = useState("Rider");

  useEffect(() => {
    const riderId = localStorage.getItem("rider_id");
    if (!riderId) return;
    api.get(`/riders/${riderId}/`)
      .then((res) => setDisplayName(res.data.first_name || "Rider"))
      .catch(() => {});
  }, []);

  const renderTab = () => {
    switch (activeTab) {
      case "maps": return <MapsScreen />;
      case "chat": return <ChatScreen />;
      case "info": return <InfoScreen />;
      case "acc": return <AccountScreen />;
      default: return null;
    }
  };

  return (
    <div className="app-shell">
      <header className="header-bar">
        <div className="app-brand">
          <span className="app-brand-mark">🪖</span>
          <span className="app-brand-name">RideSync</span>
          <span className="app-brand-rider">— {displayName}</span>
        </div>
        <button className="btn btn-ghost" onClick={logout}>Log out</button>
      </header>

      <main className="app-main">{renderTab()}</main>

      <nav className="bottom-nav">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={activeTab === tab.key ? "active" : ""}
          >
            <span className="nav-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
