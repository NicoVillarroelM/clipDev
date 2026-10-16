export interface ElectronAPI {
  platform?: string;
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
  onUpdateDownloaded?: (callback: (version: string) => void) => () => void;
  restartAndInstallUpdate?: () => void;
  writeClipboardImage?: (dataUrl: string) => void;
  getCurrentClipboardImage?: () => Promise<{ content: string; width: number; height: number; sizeLabel: string } | null>;
  onClipboardImageUpdate?: (callback: (data: { content: string; width: number; height: number; sizeLabel: string }) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
