const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  focusWindow: () => ipcRenderer.invoke("focus-window"),
});
