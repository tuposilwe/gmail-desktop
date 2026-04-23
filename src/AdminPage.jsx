import { useState, useEffect, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

const css = `
  @keyframes spin { to { transform: rotate(360deg); } }

  .adm-wrap {
    min-height: 100vh;
    background: #f0f4f9;
    font-family: 'Google Sans', Roboto, Arial, sans-serif;
    padding: 32px 16px;
    box-sizing: border-box;
  }

  .adm-card {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 1px 6px rgba(0,0,0,0.1);
    padding: 32px;
    max-width: 680px;
    margin: 0 auto;
  }

  .adm-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
    flex-wrap: wrap;
    gap: 12px;
  }

  .adm-title {
    font-size: 22px;
    font-weight: 500;
    color: #202124;
    margin: 0;
  }

  .adm-btn {
    padding: 8px 18px;
    border-radius: 4px;
    border: none;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s;
  }

  .adm-btn-primary { background: #1a73e8; color: #fff; }
  .adm-btn-primary:hover { background: #1765cc; }
  .adm-btn-primary:disabled { background: #94b8f0; cursor: default; }

  .adm-btn-danger  { background: #d93025; color: #fff; }
  .adm-btn-danger:hover  { background: #b52d22; }

  .adm-btn-ghost   { background: none; color: #1a73e8; border: 1px solid #dadce0; }
  .adm-btn-ghost:hover   { background: #f1f3f4; }

  .adm-btn-logout  { background: none; color: #5f6368; border: 1px solid #dadce0; }
  .adm-btn-logout:hover  { background: #f1f3f4; }

  .adm-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  .adm-table th { text-align: left; font-size: 12px; font-weight: 600; color: #5f6368; border-bottom: 1px solid #e8eaed; padding: 8px 12px; text-transform: uppercase; }
  .adm-table td { padding: 12px; border-bottom: 1px solid #f1f3f4; font-size: 14px; color: #202124; vertical-align: middle; }
  .adm-table tr:last-child td { border-bottom: none; }
  .adm-table tr:hover td { background: #f8f9fa; }

  .adm-badge { display: inline-block; background: #e8f0fe; color: #1a73e8; border-radius: 4px; padding: 2px 8px; font-size: 12px; font-weight: 500; }

  .adm-empty { text-align: center; color: #80868b; padding: 40px 0; font-size: 14px; }

  /* Modal */
  .adm-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.4);
    display: flex; align-items: center; justify-content: center; z-index: 999;
  }
  .adm-modal {
    background: #fff; border-radius: 12px; padding: 28px 32px;
    width: 440px; max-width: 96vw; box-shadow: 0 4px 24px rgba(0,0,0,0.18);
  }
  .adm-modal-title { font-size: 18px; font-weight: 500; color: #202124; margin: 0 0 20px; }

  .adm-field { margin-bottom: 16px; }
  .adm-label { display: block; font-size: 12px; font-weight: 600; color: #5f6368; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.4px; }
  .adm-input {
    width: 100%; box-sizing: border-box; padding: 10px 12px;
    border: 1px solid #dadce0; border-radius: 4px; font-size: 14px;
    font-family: inherit; color: #202124; outline: none;
    transition: border-color 0.15s;
  }
  .adm-input:focus { border-color: #1a73e8; border-width: 2px; }

  .adm-modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }

  .adm-error { background: #fce8e6; color: #c5221f; border-radius: 4px; padding: 10px 14px; font-size: 13px; margin-bottom: 16px; }
  .adm-success { background: #e6f4ea; color: #137333; border-radius: 4px; padding: 10px 14px; font-size: 13px; margin-bottom: 16px; }

  /* Login card */
  .adm-login-wrap {
    min-height: 100vh; background: #f0f4f9;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Google Sans', Roboto, Arial, sans-serif;
  }
  .adm-login-card {
    background: #fff; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.12);
    padding: 40px 36px; width: 360px; max-width: 94vw;
  }
`;

// ── Login form ─────────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/admin/login`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Login failed");
      else onLogin();
    } catch {
      setError("Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adm-login-wrap">
      <style>{css}</style>
      <div className="adm-login-card">
        <h1 style={{ fontSize: 22, fontWeight: 500, color: "#202124", margin: "0 0 6px" }}>Admin Panel</h1>
        <p style={{ fontSize: 14, color: "#5f6368", margin: "0 0 24px" }}>Sign in to manage IMAP servers</p>
        <form onSubmit={handleSubmit}>
          <div className="adm-field">
            <label className="adm-label">Admin Password</label>
            <input
              className="adm-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
              required
            />
          </div>
          {error && <div className="adm-error">{error}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button
              type="submit"
              className="adm-btn adm-btn-primary"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Server form modal ─────────────────────────────────────────────────────────
function ServerModal({ server, onClose, onSave }) {
  const [label, setLabel]   = useState(server?.label || "");
  const [host, setHost]     = useState(server?.host  || "");
  const [port, setPort]     = useState(server?.port  || 993);
  const [error, setError]   = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const url    = server ? `${API_URL}/admin/imap-servers/${server.id}` : `${API_URL}/admin/imap-servers`;
    const method = server ? "PUT" : "POST";
    try {
      const res  = await fetch(url, {
        method, credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, host, port: parseInt(port) || 993 }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save"); return; }
      onSave(data);
    } catch {
      setError("Could not connect to server.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="adm-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="adm-modal">
        <p className="adm-modal-title">{server ? "Edit IMAP Server" : "Add IMAP Server"}</p>
        <form onSubmit={handleSubmit}>
          <div className="adm-field">
            <label className="adm-label">Label</label>
            <input className="adm-input" value={label} onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Company Mail" required autoFocus />
          </div>
          <div className="adm-field">
            <label className="adm-label">IMAP Host</label>
            <input className="adm-input" value={host} onChange={e => setHost(e.target.value)}
              placeholder="e.g. imap.company.com" required />
          </div>
          <div className="adm-field">
            <label className="adm-label">Port</label>
            <input className="adm-input" type="number" value={port}
              onChange={e => setPort(e.target.value)} min="1" max="65535" required />
          </div>
          {error && <div className="adm-error">{error}</div>}
          <div className="adm-modal-actions">
            <button type="button" className="adm-btn adm-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="adm-btn adm-btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseUA(ua = "") {
  const browser =
    /Edg\//i.test(ua)     ? "Edge" :
    /OPR\//i.test(ua)     ? "Opera" :
    /Chrome\//i.test(ua)  ? "Chrome" :
    /Firefox\//i.test(ua) ? "Firefox" :
    /Safari\//i.test(ua)  ? "Safari" :
    /MSIE|Trident/i.test(ua) ? "IE" : "Unknown";
  const os =
    /Windows NT 1[01]/i.test(ua) ? "Windows" :
    /Mac OS X/i.test(ua)  ? "macOS" :
    /Android/i.test(ua)   ? "Android" :
    /iPhone|iPad/i.test(ua) ? "iOS" :
    /Linux/i.test(ua)     ? "Linux" : "Unknown";
  return `${browser} / ${os}`;
}

function timeAgo(iso) {
  const sec = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (sec < 60)   return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function StatusBadge({ row }) {
  if (row.blocked)  return <span style={{ background: "#fce8e6", color: "#c5221f", borderRadius: 4, padding: "2px 8px", fontSize: 12, fontWeight: 600 }}>🚫 Blocked</span>;
  if (row.success)  return <span style={{ background: "#e6f4ea", color: "#137333", borderRadius: 4, padding: "2px 8px", fontSize: 12, fontWeight: 600 }}>✓ Success</span>;
  return <span style={{ background: "#fef7e0", color: "#b06000", borderRadius: 4, padding: "2px 8px", fontSize: 12, fontWeight: 600 }}>✗ Failed</span>;
}

// ── Audits tab ────────────────────────────────────────────────────────────────
function AuditTab() {
  const [data, setData]       = useState(null);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState(null);

  const load = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/audits?page=${p}&limit=50`, { credentials: "include" });
      setData(await res.json());
    } catch { /* silent */ }
    setLoading(false);
  }, [page]);

  useEffect(() => { load(page); }, [page]);

  const unblock = async (ip) => {
    setUnblocking(ip);
    await fetch(`${API_URL}/admin/audits/rate-limits/${encodeURIComponent(ip)}`, { method: "DELETE", credentials: "include" });
    setUnblocking(null);
    load(page);
  };

  // Stats derived from current page
  const audits      = data?.audits || [];
  const total       = data?.total  || 0;
  const pages       = data?.pages  || 1;
  const rateLimited = data?.rateLimited || [];

  const successCount = audits.filter(a => a.success).length;
  const failedCount  = audits.filter(a => !a.success && !a.blocked).length;
  const blockedCount = audits.filter(a => a.blocked).length;

  return (
    <div>
      {/* Rate-limited IPs banner */}
      {rateLimited.length > 0 && (
        <div style={{ background: "#fce8e6", border: "1px solid #f5c6c6", borderRadius: 8, padding: "12px 16px", marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#c5221f", marginBottom: 8 }}>🚫 Currently blocked IPs ({rateLimited.length})</div>
          {rateLimited.map(r => (
            <div key={r.ip} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, fontSize: 13 }}>
              <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#202124" }}>{r.ip}</span>
              <span style={{ color: "#5f6368" }}>{r.failures} failures · unblocks {timeAgo(r.blockUntil)}</span>
              <button
                className="adm-btn adm-btn-ghost"
                style={{ padding: "2px 10px", fontSize: 12 }}
                onClick={() => unblock(r.ip)}
                disabled={unblocking === r.ip}
              >
                {unblocking === r.ip ? "…" : "Unblock"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Total (this page)", value: audits.length, color: "#1a73e8", bg: "#e8f0fe" },
          { label: "Successful",        value: successCount,   color: "#137333", bg: "#e6f4ea" },
          { label: "Failed",            value: failedCount,    color: "#b06000", bg: "#fef7e0" },
          { label: "Blocked",           value: blockedCount,   color: "#c5221f", bg: "#fce8e6" },
          { label: "Total records",     value: total,          color: "#5f6368", bg: "#f1f3f4" },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, borderRadius: 8, padding: "10px 16px", minWidth: 110, textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 11, color: c.color, marginTop: 2 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="adm-empty">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2"
            style={{ animation: "spin 0.8s linear infinite", display: "block", margin: "0 auto 8px" }}>
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
            <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
          </svg>
          Loading…
        </div>
      ) : audits.length === 0 ? (
        <div className="adm-empty">No login attempts recorded yet.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="adm-table" style={{ minWidth: 780 }}>
            <thead>
              <tr>
                <th>Time</th>
                <th>Email</th>
                <th>Domain</th>
                <th>IP</th>
                <th>Device</th>
                <th>IMAP Server</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {audits.map(a => (
                <tr key={a.id}>
                  <td style={{ color: "#5f6368", fontSize: 12, whiteSpace: "nowrap" }}>{timeAgo(a.createdAt)}</td>
                  <td style={{ fontSize: 13 }}>{a.email || "—"}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{a.domain || "—"}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{a.ip || "—"}</td>
                  <td style={{ fontSize: 12, color: "#5f6368" }}>{parseUA(a.userAgent)}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{a.imapServer || "—"}</td>
                  <td><StatusBadge row={a} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16 }}>
          <button className="adm-btn adm-btn-ghost" style={{ padding: "5px 14px" }} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹ Prev</button>
          <span style={{ fontSize: 13, color: "#5f6368" }}>Page {page} of {pages}</span>
          <button className="adm-btn adm-btn-ghost" style={{ padding: "5px 14px" }} disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next ›</button>
        </div>
      )}
    </div>
  );
}

// ── Main admin dashboard ──────────────────────────────────────────────────────
function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState("servers");
  const [servers, setServers]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null); // null | "add" | {server}
  const [deleteId, setDeleteId]   = useState(null);
  const [flash, setFlash]         = useState(null); // { type, msg }
  const [deleting, setDeleting]   = useState(false);

  const showFlash = (type, msg) => {
    setFlash({ type, msg });
    setTimeout(() => setFlash(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/admin/imap-servers`, { credentials: "include" });
      const data = await res.json();
      setServers(data);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = (saved) => {
    setServers(prev => {
      const exists = prev.find(s => s.id === saved.id);
      return exists ? prev.map(s => s.id === saved.id ? saved : s) : [...prev, saved];
    });
    setModal(null);
    showFlash("success", modal?.id ? "Server updated." : "Server added.");
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch(`${API_URL}/admin/imap-servers/${deleteId}`, {
        method: "DELETE", credentials: "include",
      });
      setServers(prev => prev.filter(s => s.id !== deleteId));
      showFlash("success", "Server deleted.");
    } catch {
      showFlash("error", "Failed to delete.");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const handleLogout = async () => {
    await fetch(`${API_URL}/admin/logout`, { method: "POST", credentials: "include" });
    onLogout();
  };

  return (
    <div className="adm-wrap">
      <style>{css}</style>
      <div className="adm-card" style={{ maxWidth: 900 }}>
        {/* Header */}
        <div className="adm-header">
          <h1 className="adm-title">Admin Panel</h1>
          <button className="adm-btn adm-btn-logout" onClick={handleLogout}>Logout</button>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: "1px solid #e0e0e0", marginBottom: 24 }}>
          {[{ key: "servers", label: "IMAP Servers" }, { key: "audits", label: "Audits" }].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "10px 18px", fontSize: 14, fontWeight: 500,
                color: activeTab === t.key ? "#1a73e8" : "#5f6368",
                borderBottom: activeTab === t.key ? "2px solid #1a73e8" : "2px solid transparent",
                fontFamily: "inherit", marginBottom: -1,
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {flash && <div className={flash.type === "success" ? "adm-success" : "adm-error"}>{flash.msg}</div>}

        {/* Servers tab */}
        {activeTab === "servers" && (
          <>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
              <button className="adm-btn adm-btn-primary" onClick={() => setModal("add")}>+ Add Server</button>
            </div>
            {loading ? (
              <div className="adm-empty">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2"
                  style={{ animation: "spin 0.8s linear infinite", marginBottom: 8 }}>
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                </svg>
                <div>Loading…</div>
              </div>
            ) : servers.length === 0 ? (
              <div className="adm-empty">
                No IMAP servers configured yet.<br />
                <button className="adm-btn adm-btn-ghost" style={{ marginTop: 12 }} onClick={() => setModal("add")}>
                  Add your first server
                </button>
              </div>
            ) : (
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>Host</th>
                    <th>Port</th>
                    <th style={{ width: 120 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {servers.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 500 }}>{s.label}</td>
                      <td style={{ fontFamily: "monospace", fontSize: 13 }}>{s.host}</td>
                      <td><span className="adm-badge">{s.port}</span></td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="adm-btn adm-btn-ghost" style={{ padding: "5px 12px" }} onClick={() => setModal(s)}>Edit</button>
                          <button className="adm-btn adm-btn-danger" style={{ padding: "5px 12px" }} onClick={() => setDeleteId(s.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ fontSize: 12, color: "#80868b", marginTop: 8 }}>
              These servers are tried in order when a user logs in.
            </div>
          </>
        )}

        {/* Audits tab */}
        {activeTab === "audits" && <AuditTab />}
      </div>

      {/* Add / Edit modal */}
      {modal && (
        <ServerModal
          server={modal === "add" ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {/* Delete confirm modal */}
      {deleteId !== null && (
        <div className="adm-overlay" onClick={e => { if (e.target === e.currentTarget) setDeleteId(null); }}>
          <div className="adm-modal" style={{ maxWidth: 360 }}>
            <p className="adm-modal-title">Delete IMAP Server?</p>
            <p style={{ fontSize: 14, color: "#5f6368", margin: "0 0 20px" }}>
              This cannot be undone. Existing user sessions will keep using this server until they log in again.
            </p>
            <div className="adm-modal-actions">
              <button className="adm-btn adm-btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="adm-btn adm-btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [state, setState] = useState("loading"); // loading | login | dashboard

  useEffect(() => {
    fetch(`${API_URL}/admin/me`, { credentials: "include" })
      .then(r => setState(r.ok ? "dashboard" : "login"))
      .catch(() => setState("login"));
  }, []);

  if (state === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4f9" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2"
          style={{ animation: "spin 0.8s linear infinite" }}>
          <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
          <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
        </svg>
      </div>
    );
  }

  if (state === "login") return <AdminLogin onLogin={() => setState("dashboard")} />;
  return <AdminDashboard onLogout={() => setState("login")} />;
}
