const { contextBridge } = require("electron");

// Expose safe APIs to the renderer process here if needed
contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
});
