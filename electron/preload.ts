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
  onUpdateDownloaded: (callback: (version: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, version: string) => callback(version);
    ipcRenderer.on("update:downloaded", handler);
    return () => ipcRenderer.removeListener("update:downloaded", handler);
  },
  restartAndInstallUpdate: () => ipcRenderer.send("app:restart-and-install"),
  writeClipboardImage: (dataUrl: string) => ipcRenderer.send("clipboard:write-image", dataUrl),
  getCurrentClipboardImage: () => ipcRenderer.invoke("clipboard:get-current-image"),
  onClipboardImageUpdate: (callback: (data: { content: string; width: number; height: number; sizeLabel: string }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, value: any) => callback(value);
    ipcRenderer.on("clipboard:updated-image", handler);
    return () => ipcRenderer.removeListener("clipboard:updated-image", handler);
  },
});
