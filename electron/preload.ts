import { contextBridge, ipcRenderer, webFrame } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  writeClipboard: (data: string | { text: string; html?: string }) =>
    ipcRenderer.send("clipboard:write", data),
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
  getAppVersion: () => ipcRenderer.invoke("app:get-version"),
  getAutoLaunch: () => ipcRenderer.invoke("app:get-auto-launch"),
  setAutoLaunch: (enabled: boolean) => ipcRenderer.invoke("app:set-auto-launch", enabled),
  onAutoLaunchChanged: (callback: (enabled: boolean) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, enabled: boolean) => callback(enabled);
    ipcRenderer.on("app:auto-launch-changed", handler);
    return () => ipcRenderer.removeListener("app:auto-launch-changed", handler);
  },
  getUpdateStatus: () => ipcRenderer.invoke("update:get-status"),
  checkForUpdates: () => ipcRenderer.invoke("update:check"),
  onUpdateStatus: (callback: (status: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, status: unknown) => callback(status);
    ipcRenderer.on("update:status", handler);
    return () => ipcRenderer.removeListener("update:status", handler);
  },
  restartAndInstallUpdate: () => ipcRenderer.send("app:restart-and-install"),
  openExternal: (url: string) => ipcRenderer.send("app:open-external", url),
  writeClipboardImage: (dataUrl: string) => ipcRenderer.send("clipboard:write-image", dataUrl),
  getCurrentClipboardImage: () => ipcRenderer.invoke("clipboard:get-current-image"),
  onClipboardImageUpdate: (
    callback: (data: { content: string; width: number; height: number; sizeLabel: string }) => void
  ) => {
    const handler = (_event: Electron.IpcRendererEvent, value: any) => callback(value);
    ipcRenderer.on("clipboard:updated-image", handler);
    return () => ipcRenderer.removeListener("clipboard:updated-image", handler);
  },
});
