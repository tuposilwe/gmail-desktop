import { useState, useEffect } from "react";
import GmailUI from "./Gmail";
import LoginPage from "./LoginPage";
import AdminPage from "./AdminPage";

const API_URL = import.meta.env.VITE_API_URL || "";

function App() {
  if (window.location.pathname === "/admin") return <AdminPage />;

  const [authState, setAuthState] = useState("loading"); // "loading" | "authenticated" | "unauthenticated"
  const [userEmail, setUserEmail] = useState(null);

  // Check existing session on mount
  useEffect(() => {
    fetch(`${API_URL}/auth/me`)
      .then(r => {
        if (r.ok) return r.json();
        throw new Error("unauthenticated");
      })
      .then(data => {
        setUserEmail(data.email);
        setAuthState("authenticated");
      })
      .catch(() => {
        setAuthState("unauthenticated");
      });
  }, []);

  const handleLogin = (email) => {
    setUserEmail(email);
    setAuthState("authenticated");
  };

  const handleLogout = async () => {
    await fetch(`${API_URL}/auth/logout`, { method: "POST" });
    setUserEmail(null);
    setAuthState("unauthenticated");
  };

  if (authState === "loading") {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f6f8fc",
        fontFamily: "Arial, sans-serif",
      }}>
        <div style={{ textAlign: "center" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2"
            style={{ animation: "spin 0.8s linear infinite" }}>
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
            <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
          </svg>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (authState === "unauthenticated") {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <GmailUI userEmail={userEmail} onLogout={handleLogout} />;
}

export default App;
