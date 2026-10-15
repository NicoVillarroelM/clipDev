import { contextBridge, ipcRenderer, webFrame } from "electron";

// APIs seguras expuestas al Renderer (React)
contextBridge.exposeInMainWorld("electronAPI", {
  writeClipboard: (text: string) => ipcRenderer.send("clipboard:write", text),
  getCurrentClipboard: () => ipcRenderer.invoke("clipboard:get-current"),
  onClipboardUpdate: (callback: (text: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, value: string) => callback(value);
    ipcRenderer.on("clipboard:updated", handler);
    return () => ipcRenderer.removeListener("clipboard:updated", handler);
  },
  minimizeWindow: () => ipcRenderer.send("window:minimize"),
  closeWindow: () => ipcRenderer.send("window:close"),
  setZoomFactor: (factor: number) => webFrame.setZoomFactor(factor),
  setBackgroundMaterial: (material: "none" | "acrylic" | "mica") =>
    ipcRenderer.send("window:set-background-material", material),
  saveClipsToDisk: (json: string) => ipcRenderer.send("storage:save-clips", json),
  saveNotesToDisk: (json: string) => ipcRenderer.send("storage:save-notes", json),
  loadStorageFromDisk: () => ipcRenderer.invoke("storage:load-disk"),
});
