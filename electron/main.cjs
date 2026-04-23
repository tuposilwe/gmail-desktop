const { app, BrowserWindow, shell, session } = require("electron");
const path = require("path");

const isDev = process.env.NODE_ENV === "development";
const BACKEND = "https://test2.yana.dev";
const BACKEND_WSS = "wss://test2.yana.dev";

// Persist cookies from Set-Cookie headers into Electron's on-disk cookie store.
// On Windows the store lives in %APPDATA%/<app>/Cookies, encrypted via DPAPI.
async function applySetCookieHeaders(ses, setCookieHeaders) {
  for (const header of setCookieHeaders) {
    const parts = header.split(";").map(s => s.trim());
    const eqIdx = parts[0].indexOf("=");
    if (eqIdx < 0) continue;
    const name  = parts[0].slice(0, eqIdx).trim();
    const value = parts[0].slice(eqIdx + 1).trim();

    // Parse attributes (path, expires, httpOnly, secure, …)
    const attrs = {};
    for (const part of parts.slice(1)) {
      const sep = part.indexOf("=");
      const k = (sep < 0 ? part : part.slice(0, sep)).trim().toLowerCase();
      const v = sep < 0 ? true : part.slice(sep + 1).trim();
      attrs[k] = v;
    }

    const isExpired = attrs.expires && new Date(attrs.expires) <= new Date(0);
    if (value === "" || isExpired) {
      await ses.cookies.remove(BACKEND, name).catch(() => {});
      continue;
    }

    const entry = {
      url:      BACKEND,
      name,
      value,
      domain:   "test2.yana.dev",
      path:     attrs.path || "/",
      httpOnly: "httponly" in attrs,
      secure:   "secure"   in attrs,
    };
    if (attrs.expires) {
      entry.expirationDate = Math.floor(new Date(attrs.expires).getTime() / 1000);
    }
    await ses.cookies.set(entry).catch(err =>
      console.error("[cookies] set failed:", name, err.message)
    );
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      // file:// pages can't send cookies cross-origin under normal CORS rules.
      // webSecurity: false bypasses CORS so our cookie injection (below) works.
      webSecurity: isDev,
    },
    icon: path.join(__dirname, "../public/google.png"),
    title: "Gmail Client",
    show: false,
  });

  win.setMenu(null);

  // win.webContents.openDevTools();

  if (isDev) {
    win.loadURL("http://localhost:3000");
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  win.once("ready-to-show", () => win.show());

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  if (!isDev) {
    const ses = session.defaultSession;

    // Capture Set-Cookie headers from backend responses and persist them to disk.
    ses.webRequest.onHeadersReceived(
      { urls: [`${BACKEND}/*`] },
      (details, callback) => {
        const raw =
          details.responseHeaders["set-cookie"] ||
          details.responseHeaders["Set-Cookie"] ||
          [];
        if (raw.length) applySetCookieHeaders(ses, raw).catch(console.error);
        callback({ responseHeaders: details.responseHeaders });
      }
    );

    // On every request to the backend, read cookies from the persistent store
    // and inject them — this survives app restarts because the store is on disk.
    ses.webRequest.onBeforeSendHeaders(
      { urls: [`${BACKEND}/*`, `${BACKEND_WSS}/*`] },
      async (details, callback) => {
        try {
          const cookies = await ses.cookies.get({ domain: "test2.yana.dev" });
          const jar = cookies.map(c => `${c.name}=${c.value}`).join("; ");
          if (jar) details.requestHeaders["Cookie"] = jar;
        } catch (err) {
          console.error("[cookies] get failed:", err.message);
        }
        callback({ requestHeaders: details.requestHeaders });
      }
    );
  }

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
