export interface ClipboardWritePayload {
  text: string;
  html?: string;
}

export type UpdateStatus =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "available"; version: string }
  | { status: "downloading"; version?: string; percent: number }
  | { status: "downloaded"; version: string }
  | { status: "not-available"; currentVersion: string }
  | { status: "manual-download"; version: string; downloadUrl: string }
  | { status: "error"; message: string };

export interface AutoLaunchState {
  enabled: boolean;
  supported: boolean;
}

export interface ElectronAPI {
  platform?: string;
  writeClipboard: (data: string | ClipboardWritePayload) => void;
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
  getAppVersion?: () => Promise<string>;
  getAutoLaunch?: () => Promise<AutoLaunchState>;
  setAutoLaunch?: (enabled: boolean) => Promise<AutoLaunchState>;
  onAutoLaunchChanged?: (callback: (enabled: boolean) => void) => () => void;
  getUpdateStatus?: () => Promise<UpdateStatus>;
  checkForUpdates?: () => Promise<UpdateStatus>;
  onUpdateStatus?: (callback: (status: UpdateStatus) => void) => () => void;
  restartAndInstallUpdate?: () => void;
  openExternal?: (url: string) => void;
  writeClipboardImage?: (dataUrl: string) => void;
  getCurrentClipboardImage?: () => Promise<{
    content: string;
    width: number;
    height: number;
    sizeLabel: string;
  } | null>;
  onClipboardImageUpdate?: (
    callback: (data: {
      content: string;
      width: number;
      height: number;
      sizeLabel: string;
    }) => void
  ) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
