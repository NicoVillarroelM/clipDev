export interface ElectronAPI {
  writeClipboard: (text: string) => void;
  getCurrentClipboard: () => Promise<string>;
  onClipboardUpdate: (callback: (text: string) => void) => () => void;
  minimizeWindow: () => void;
  closeWindow: () => void;
  setZoomFactor?: (factor: number) => void;
  setBackgroundMaterial?: (material: "none" | "acrylic" | "mica") => void;
  saveClipsToDisk?: (json: string) => void;
  saveNotesToDisk?: (json: string) => void;
  loadStorageFromDisk?: () => Promise<{
    clips: any[] | null;
    notes: any[] | null;
    storagePath: string;
  }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
