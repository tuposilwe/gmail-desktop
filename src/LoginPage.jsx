import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

const css = `
  @keyframes spin { to { transform: rotate(360deg); } }

  .lp-wrap {
    min-height: 100vh;
    background: #f6f8fc;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: 'Google Sans', Roboto, Arial, sans-serif;
  }

  .lp-card {
    background: #fff;
    border-radius: 28px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.12);
    padding: 48px 40px 36px;
    width: 400px;
    max-width: 94vw;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  /* ── Field ── */
  .lp-field {
    position: relative;
    width: 100%;
    margin-bottom: 20px;
  }

  .lp-input {
    width: 100%;
    box-sizing: border-box;
    padding: 22px 14px 8px 14px;
    border: 1px solid #747775;
    border-radius: 4px;
    font-size: 16px;
    font-family: inherit;
    color: #202124;
    outline: none;
    background: #fff;
    transition: border-color 0.15s, border-width 0.15s;
    /* Kill autofill yellow/blue */
    -webkit-box-shadow: 0 0 0 1000px #fff inset !important;
    box-shadow: 0 0 0 1000px #fff inset !important;
    -webkit-text-fill-color: #202124 !important;
  }

  .lp-input-pass { padding-right: 44px; }

  .lp-input:focus {
    border-color: #1a73e8;
    border-width: 2px;
  }

  /* Autofill — keep white background */
  .lp-input:-webkit-autofill,
  .lp-input:-webkit-autofill:hover,
  .lp-input:-webkit-autofill:focus,
  .lp-input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 1000px #fff inset !important;
    -webkit-text-fill-color: #202124 !important;
    transition: background-color 9999s ease-in-out 0s;
  }

  /* ── Floating label ── */
  .lp-label {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 16px;
    color: #747775;
    pointer-events: none;
    transition: top 0.15s, transform 0.15s, font-size 0.15s, color 0.15s;
    font-family: inherit;
    background: transparent;
  }

  /* Float up when filled (React state drives class) or autofilled */
  .lp-field--filled .lp-label,
  .lp-input:-webkit-autofill ~ .lp-label {
    top: 10px;
    transform: none;
    font-size: 11px;
    color: #5f6368;
  }

  /* Blue when focused */
  .lp-input:focus ~ .lp-label {
    top: 10px;
    transform: none;
    font-size: 11px;
    color: #1a73e8;
  }
`;

export default function LoginPage({ onLogin }) {
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Login failed");
      else onLogin(data.email);
    } catch {
      setError("Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp-wrap">
      <style>{css}</style>

      <div className="lp-card">
        {/* Logo */}
        <img src={`${import.meta.env.BASE_URL}google.png`} alt="Google" style={{ height: 24, marginBottom: 8 }} />

        <h1 style={{ fontSize: 24, fontWeight: 400, color: "#202124", margin: "16px 0 8px" }}>Sign in</h1>
        <p style={{ fontSize: 14, color: "#5f6368", margin: "0 0 28px" }}>to continue to Mail</p>

        <form onSubmit={handleSubmit} style={{ width: "100%" }}>

          {/* Email */}
          <div className={`lp-field${email ? " lp-field--filled" : ""}`}>
            <input
              className="lp-input"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(""); }}
              required
              autoFocus
              autoComplete="email"
            />
            <label className="lp-label">Email</label>
          </div>

          {/* Password */}
          <div className={`lp-field${password ? " lp-field--filled" : ""}`}>
            <input
              className="lp-input lp-input-pass"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
              required
              autoComplete="current-password"
            />
            <label className="lp-label">Password</label>
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              tabIndex={-1}
              style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: "#5f6368", padding: 4, display: "flex",
              }}
            >
              {showPw ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: "#fce8e6", color: "#c5221f", borderRadius: 4,
              padding: "10px 14px", fontSize: 14, marginBottom: 16,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              {error}
            </div>
          )}

          {/* Submit */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 28 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? "#94b8f0" : "#1a73e8",
                color: "#fff", border: "none", borderRadius: 4,
                padding: "10px 24px", fontSize: 14, fontWeight: 500,
                cursor: loading ? "default" : "pointer",
                fontFamily: "inherit", minWidth: 88,
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#1765cc"; }}
              onMouseLeave={e => { e.currentTarget.style.background = loading ? "#94b8f0" : "#1a73e8"; }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                    style={{ animation: "spin 0.8s linear infinite" }}>
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                    <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                  </svg>
                  Signing in…
                </span>
              ) : "Next"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
