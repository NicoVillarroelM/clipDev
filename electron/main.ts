import {
  app,
  BrowserWindow,
  clipboard,
  ClipboardItem,
  globalShortcut,
  ipcMain,
  Menu,
  nativeImage,
  session,
  shell,
  Tray,
} from "electron";
import { autoUpdater } from "electron-updater";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { ClipDevDatabase } from "./database";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, "..");
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";

export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

const GITHUB_RELEASES_API = "https://api.github.com/repos/NicoVillarroelM/clipDev/releases/latest";
const AUTO_UPDATE_INTERVAL_MS = 4 * 60 * 60 * 1000;
const isHiddenLaunch = process.argv.includes("--hidden");

type UpdateStatus =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "available"; version: string }
  | { status: "downloading"; version?: string; percent: number }
  | { status: "downloaded"; version: string }
  | { status: "not-available"; currentVersion: string }
  | { status: "manual-download"; version: string; downloadUrl: string }
  | { status: "error"; message: string };

interface AppPrefs {
  autoLaunchInitialized?: boolean;
}

let win: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let lastClipboardText = "";
let lastImageHash = "";
let clipboardInterval: NodeJS.Timeout | null = null;
let updateInterval: NodeJS.Timeout | null = null;
let currentUpdateStatus: UpdateStatus = { status: "idle" };

const userDataPath = app.getPath("userData");
const prefsPath = path.join(userDataPath, "app-prefs.json");
let storageDb: ClipDevDatabase | null = null;

function getDatabase(): ClipDevDatabase {
  if (!storageDb) {
    storageDb = new ClipDevDatabase(userDataPath);
  }
  return storageDb;
}

function readAppPrefs(): AppPrefs {
  try {
    if (fs.existsSync(prefsPath)) {
      return JSON.parse(fs.readFileSync(prefsPath, "utf-8")) as AppPrefs;
    }
  } catch {
    // Ignore corrupted prefs file
  }
  return {};
}

function writeAppPrefs(next: AppPrefs): void {
  try {
    fs.mkdirSync(userDataPath, { recursive: true });
    fs.writeFileSync(prefsPath, JSON.stringify(next, null, 2), "utf-8");
  } catch (err) {
    console.warn("Failed to persist app preferences:", err);
  }
}

function resolveIconPath(): string | undefined {
  const isMac = process.platform === "darwin";
  const appRoot = process.env.APP_ROOT || process.cwd();
  const candidateIcons = [
    path.join(appRoot, "dist", isMac ? "clipDev_logo.png" : "clipDev_logo.ico"),
    path.join(appRoot, "public", isMac ? "clipDev_logo.png" : "clipDev_logo.ico"),
    path.join(appRoot, "dist", "clipDev_logo.ico"),
    path.join(appRoot, "public", "clipDev_logo.ico"),
  ];
  return candidateIcons.find((p) => fs.existsSync(p));
}

function showMainWindow(): void {
  if (!win || win.isDestroyed()) return;
  if (win.isMinimized()) {
    win.restore();
  }
  win.show();
  win.focus();
}

function toggleMainWindow(): void {
  if (!win || win.isDestroyed()) return;
  if (win.isVisible() && win.isFocused()) {
    win.hide();
  } else {
    showMainWindow();
  }
}

function getAutoLaunchEnabled(): boolean {
  if (!app.isPackaged) return false;
  try {
    if (process.platform === "win32") {
      const settings = app.getLoginItemSettings({
        path: app.getPath("exe"),
        args: ["--hidden"],
      });
      return Boolean(settings.openAtLogin);
    }
    return Boolean(app.getLoginItemSettings().openAtLogin);
  } catch {
    return false;
  }
}

function setAutoLaunch(enabled: boolean): boolean {
  if (!app.isPackaged) return false;
  try {
    if (process.platform === "win32") {
      app.setLoginItemSettings({
        openAtLogin: enabled,
        path: app.getPath("exe"),
        args: ["--hidden"],
      });
    } else if (process.platform === "darwin") {
      app.setLoginItemSettings({
        openAtLogin: enabled,
      });
    }
    const actual = getAutoLaunchEnabled();
    if (win && !win.isDestroyed()) {
      win.webContents.send("app:auto-launch-changed", actual);
    }
    updateTrayMenu();
    return actual;
  } catch (err) {
    console.warn("Failed to update auto-launch setting:", err);
    return getAutoLaunchEnabled();
  }
}

function ensureInitialAutoLaunch(): void {
  if (!app.isPackaged) return;
  const prefs = readAppPrefs();
  if (!prefs.autoLaunchInitialized) {
    setAutoLaunch(true);
    writeAppPrefs({ ...prefs, autoLaunchInitialized: true });
  }
}

function emitUpdateStatus(next: UpdateStatus): void {
  currentUpdateStatus = next;
  if (win && !win.isDestroyed()) {
    win.webContents.send("update:status", next);
  }
  updateTrayMenu();
}

function hasNativeAutoUpdater(): boolean {
  if (!app.isPackaged) return false;
  const updateConfigPath = path.join(process.resourcesPath, "app-update.yml");
  return fs.existsSync(updateConfigPath);
}

function isNewerVersion(remoteVersion: string, localVersion: string): boolean {
  const clean = (v: string) =>
    v
      .replace(/^v/i, "")
      .split("-")[0]
      .split(".")
      .map((n) => parseInt(n, 10) || 0);
  const remote = clean(remoteVersion);
  const local = clean(localVersion);
  const len = Math.max(remote.length, local.length);
  for (let i = 0; i < len; i++) {
    const r = remote[i] ?? 0;
    const l = local[i] ?? 0;
    if (r > l) return true;
    if (r < l) return false;
  }
  return false;
}

async function checkUpdatesViaGitHubApi(): Promise<void> {
  emitUpdateStatus({ status: "checking" });
  try {
    const response = await fetch(GITHUB_RELEASES_API, {
      headers: {
        "User-Agent": "ClipDev-App",
        Accept: "application/vnd.github+json",
      },
    });
    if (!response.ok) {
      throw new Error(`GitHub API (${response.status})`);
    }
    const data = (await response.json()) as {
      tag_name?: string;
      html_url?: string;
    };
    const latestTag = (data.tag_name || "").replace(/^v/i, "");
    const currentVersion = app.getVersion();
    if (latestTag && isNewerVersion(latestTag, currentVersion)) {
      emitUpdateStatus({
        status: "manual-download",
        version: latestTag,
        downloadUrl: data.html_url || "https://github.com/NicoVillarroelM/clipDev/releases/latest",
      });
    } else {
      emitUpdateStatus({ status: "not-available", currentVersion });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    emitUpdateStatus({ status: "error", message });
  }
}

async function checkForUpdates(silent = false): Promise<void> {
  if (
    currentUpdateStatus.status === "checking" ||
    currentUpdateStatus.status === "downloading" ||
    currentUpdateStatus.status === "downloaded"
  ) {
    return;
  }

  if (hasNativeAutoUpdater()) {
    try {
      emitUpdateStatus({ status: "checking" });
      await autoUpdater.checkForUpdates();
    } catch (err) {
      if (silent) {
        emitUpdateStatus({ status: "idle" });
      } else {
        const message = err instanceof Error ? err.message : "Update check failed";
        emitUpdateStatus({ status: "error", message });
      }
    }
  } else if (!silent) {
    await checkUpdatesViaGitHubApi();
  }
}

function restartAndInstall(): void {
  isQuitting = true;
  if (tray && !tray.isDestroyed()) {
    tray.destroy();
    tray = null;
  }
  autoUpdater.quitAndInstall(false, true);
}

function updateTrayMenu(): void {
  if (!tray || tray.isDestroyed()) return;

  const updateItem: Electron.MenuItemConstructorOptions =
    currentUpdateStatus.status === "downloaded"
      ? {
          label: `Reiniciar y actualizar (v${currentUpdateStatus.version})`,
          click: () => restartAndInstall(),
        }
      : currentUpdateStatus.status === "manual-download"
        ? {
            label: `Descargar nueva versión (v${currentUpdateStatus.version})`,
            click: () => {
              if (currentUpdateStatus.status === "manual-download") {
                void shell.openExternal(currentUpdateStatus.downloadUrl);
              }
            },
          }
        : {
            label:
              currentUpdateStatus.status === "checking"
                ? "Buscando actualizaciones..."
                : currentUpdateStatus.status === "downloading"
                  ? `Descargando actualización (${currentUpdateStatus.percent}%)`
                  : "Buscar actualizaciones",
            enabled:
              currentUpdateStatus.status !== "checking" &&
              currentUpdateStatus.status !== "downloading",
            click: () => {
              showMainWindow();
              void checkForUpdates(false);
            },
          };

  const menuTemplate: Electron.MenuItemConstructorOptions[] = [
    {
      label: "Abrir ClipDev (Ctrl+Shift+V)",
      click: () => showMainWindow(),
    },
    { type: "separator" },
    {
      label: "Iniciar con Windows",
      type: "checkbox",
      checked: getAutoLaunchEnabled(),
      enabled: app.isPackaged,
      click: (item) => {
        setAutoLaunch(item.checked);
      },
    },
    updateItem,
    { type: "separator" },
    {
      label: "Salir de ClipDev",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ];

  tray.setContextMenu(Menu.buildFromTemplate(menuTemplate));
}

function createTray(): void {
  const iconPath = resolveIconPath();
  if (!iconPath) return;

  const icon = nativeImage.createFromPath(iconPath);
  const trayIcon =
    process.platform === "darwin" ? icon.resize({ width: 16, height: 16 }) : icon;

  tray = new Tray(trayIcon);
  tray.setToolTip(`ClipDev v${app.getVersion()}`);
  tray.on("click", () => {
    toggleMainWindow();
  });
  updateTrayMenu();
}

async function createWindow() {
  const isMac = process.platform === "darwin";
  const preloadPath = path.join(__dirname, "preload.cjs");
  const iconPath = resolveIconPath();

  win = new BrowserWindow({
    width: 820,
    height: 580,
    minWidth: 550,
    frame: false,
    titleBarStyle: isMac ? "hiddenInset" : undefined,
    trafficLightPosition: isMac ? { x: 14, y: 14 } : undefined,
    backgroundMaterial: isMac ? undefined : "acrylic",
    vibrancy: isMac ? "under-window" : undefined,
    backgroundColor: "#00000000",
    icon: iconPath,
    show: false,
    webPreferences: {
      preload: preloadPath,
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:") || url.startsWith("http:")) {
      void shell.openExternal(url);
    }
    return { action: "deny" };
  });

  win.webContents.on("will-navigate", (event, url) => {
    const currentUrl = win?.webContents.getURL();
    if (currentUrl && url !== currentUrl) {
      event.preventDefault();
      if (url.startsWith("https:") || url.startsWith("http:")) {
        void shell.openExternal(url);
      }
    }
  });

  win.webContents.on("console-message", (event) => {
    console.log(`[Renderer L${event.level}] ${event.message}`);
  });

  win.webContents.on("did-fail-load", (_e, code, desc, validatedURL) => {
    console.error("Page failed to load:", code, desc, validatedURL);
  });

  win.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      win?.hide();
    }
  });

  win.once("ready-to-show", () => {
    if (!isHiddenLaunch) {
      win?.show();
    }
    if (VITE_DEV_SERVER_URL) {
      win?.webContents.openDevTools({ mode: "detach" });
    }
  });

  if (VITE_DEV_SERVER_URL) {
    await win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    await win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

function hasTransparency(bitmap: Buffer): boolean {
  for (let i = 3; i < bitmap.length; i += 4) {
    if (bitmap[i] < 250) return true;
  }
  return false;
}

function processImageBuffer(buffer: Buffer): {
  content: string;
  width: number;
  height: number;
  sizeLabel: string;
} | null {
  const img = nativeImage.createFromBuffer(buffer);
  const size = img.getSize();
  if (size.width === 0 || size.height === 0) return null;

  const MAX_DIMENSION = 1280;
  let finalImg = img;
  if (size.width > MAX_DIMENSION || size.height > MAX_DIMENSION) {
    const scale = Math.min(MAX_DIMENSION / size.width, MAX_DIMENSION / size.height);
    finalImg = img.resize({
      width: Math.round(size.width * scale),
      height: Math.round(size.height * scale),
      quality: "better",
    });
  }

  const finalSize = finalImg.getSize();
  const isTransparent = hasTransparency(finalImg.toBitmap());
  const content = isTransparent
    ? finalImg.toDataURL()
    : `data:image/jpeg;base64,${finalImg.toJPEG(85).toString("base64")}`;

  return {
    content,
    width: finalSize.width,
    height: finalSize.height,
    sizeLabel: `${size.width} × ${size.height} px`,
  };
}

async function readClipboardImage(): Promise<{
  content: string;
  width: number;
  height: number;
  sizeLabel: string;
} | null> {
  try {
    const hasImage = (await clipboard.has("image/png")) || (await clipboard.has("image/jpeg"));
    if (!hasImage) return null;

    const items = await clipboard.read();
    for (const item of items) {
      const imgType = item.types.find((t) => t.startsWith("image/"));
      if (imgType) {
        const blob = await item.getType(imgType);
        if (blob instanceof Blob) {
          const buffer = Buffer.from(await blob.arrayBuffer());
          return processImageBuffer(buffer);
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function checkClipboard() {
  try {
    const rawText = await clipboard.readText();
    const currentText = typeof rawText === "string" ? rawText : "";
    if (currentText.trim() !== "" && currentText !== lastClipboardText) {
      lastClipboardText = currentText;
      lastImageHash = "";
      if (win && !win.isDestroyed()) {
        win.webContents.send("clipboard:updated", currentText);
      }
      return;
    }

    if (currentText.trim() !== "") {
      return;
    }

    const hasImage = (await clipboard.has("image/png")) || (await clipboard.has("image/jpeg"));
    if (!hasImage) {
      return;
    }

    const items = await clipboard.read();
    for (const item of items) {
      const imgType = item.types.find((t) => t.startsWith("image/"));
      if (imgType) {
        const blob = await item.getType(imgType);
        if (blob instanceof Blob) {
          const buffer = Buffer.from(await blob.arrayBuffer());
          const hash = crypto.createHash("md5").update(buffer).digest("hex");

          if (hash === lastImageHash) {
            return;
          }

          lastImageHash = hash;
          lastClipboardText = "";

          const imgData = processImageBuffer(buffer);
          if (imgData && win && !win.isDestroyed()) {
            win.webContents.send("clipboard:updated-image", imgData);
          }
          return;
        }
      }
    }
  } catch (err) {
    console.error("Error reading clipboard:", err);
  }
}

async function startClipboardWatcher() {
  try {
    const rawInit = await clipboard.readText();
    lastClipboardText = typeof rawInit === "string" ? rawInit : "";
    if (!lastClipboardText) {
      const hasImage = (await clipboard.has("image/png")) || (await clipboard.has("image/jpeg"));
      if (hasImage) {
        const items = await clipboard.read();
        for (const item of items) {
          const imgType = item.types.find((t) => t.startsWith("image/"));
          if (imgType) {
            const blob = await item.getType(imgType);
            if (blob instanceof Blob) {
              const buffer = Buffer.from(await blob.arrayBuffer());
              lastImageHash = crypto.createHash("md5").update(buffer).digest("hex");
              break;
            }
          }
        }
      }
    }
  } catch {
    lastClipboardText = "";
    lastImageHash = "";
  }

  if (clipboardInterval) clearInterval(clipboardInterval);
  clipboardInterval = setInterval(() => {
    void checkClipboard();
  }, 750);
}

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

autoUpdater.on("checking-for-update", () => {
  emitUpdateStatus({ status: "checking" });
});

autoUpdater.on("update-available", (info) => {
  emitUpdateStatus({ status: "available", version: info.version });
});

autoUpdater.on("download-progress", (progress) => {
  const version =
    currentUpdateStatus.status === "available" || currentUpdateStatus.status === "downloading"
      ? currentUpdateStatus.version
      : undefined;
  emitUpdateStatus({
    status: "downloading",
    version,
    percent: Math.round(progress.percent),
  });
});

autoUpdater.on("update-downloaded", (info) => {
  emitUpdateStatus({ status: "downloaded", version: info.version });
});

autoUpdater.on("update-not-available", () => {
  emitUpdateStatus({ status: "not-available", currentVersion: app.getVersion() });
});

autoUpdater.on("error", (err) => {
  console.warn("Auto-updater error:", err);
  emitUpdateStatus({
    status: "error",
    message: err?.message || "Update check failed",
  });
});

async function initializeApp() {
  await app.whenReady();

  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  ensureInitialAutoLaunch();
  createTray();
  await createWindow();
  await startClipboardWatcher();

  if (app.isPackaged) {
    setTimeout(() => {
      void checkForUpdates(true);
    }, 4000);

    updateInterval = setInterval(() => {
      void checkForUpdates(true);
    }, AUTO_UPDATE_INTERVAL_MS);
  }

  globalShortcut.register("CommandOrControl+Shift+V", () => {
    toggleMainWindow();
  });

  app.on("activate", () => {
    if (win) {
      showMainWindow();
    } else if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
    }
  });
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    showMainWindow();
  });

  void initializeApp().catch((err) => {
    console.error("Failed to initialize app:", err);
  });
}

app.on("before-quit", () => {
  isQuitting = true;
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
  if (clipboardInterval) clearInterval(clipboardInterval);
  if (updateInterval) clearInterval(updateInterval);
  if (tray && !tray.isDestroyed()) {
    tray.destroy();
    tray = null;
  }
  storageDb?.close();
  storageDb = null;
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin" && isQuitting) {
    app.quit();
  }
});

ipcMain.handle("clipboard:get-current", async () => {
  try {
    return await clipboard.readText();
  } catch {
    return "";
  }
});

ipcMain.on("clipboard:write", async (_event, payload: string | { text: string; html?: string }) => {
  const text = typeof payload === "string" ? payload : payload.text;
  const html = typeof payload === "object" && payload.html ? payload.html : undefined;

  lastClipboardText = text;
  lastImageHash = "";

  if (html) {
    try {
      const item = new ClipboardItem({
        "text/plain": new Blob([text], { type: "text/plain" }),
        "text/html": new Blob([html], { type: "text/html" }),
      });
      await clipboard.write([item]);
    } catch {
      await clipboard.writeText(text);
    }
  } else {
    await clipboard.writeText(text);
  }
});

ipcMain.handle("clipboard:get-current-image", async () => {
  return await readClipboardImage();
});

ipcMain.on("clipboard:write-image", async (_event, dataUrl: string) => {
  try {
    const img = nativeImage.createFromDataURL(dataUrl);
    const buffer = img.toPNG();
    lastImageHash = crypto.createHash("md5").update(buffer).digest("hex");
    lastClipboardText = "";
    const blob = new Blob([new Uint8Array(buffer)], { type: "image/png" });
    const item = new ClipboardItem({ "image/png": blob });
    await clipboard.write([item]);
  } catch (err) {
    console.error("Error writing image to clipboard:", err);
  }
});

ipcMain.on("window:minimize", () => {
  win?.minimize();
});

ipcMain.on("window:close", () => {
  win?.hide();
});

ipcMain.on("window:set-background-material", (_event, material: "none" | "acrylic" | "mica") => {
  if (win && typeof win.setBackgroundMaterial === "function") {
    try {
      win.setBackgroundMaterial(material);
    } catch (err) {
      console.warn("setBackgroundMaterial not supported:", err);
    }
  }
});

ipcMain.handle("app:get-version", () => app.getVersion());

ipcMain.handle("app:get-auto-launch", () => ({
  enabled: getAutoLaunchEnabled(),
  supported: app.isPackaged && (process.platform === "win32" || process.platform === "darwin"),
}));

ipcMain.handle("app:set-auto-launch", (_event, enabled: boolean) => {
  const actual = setAutoLaunch(Boolean(enabled));
  return {
    enabled: actual,
    supported: app.isPackaged && (process.platform === "win32" || process.platform === "darwin"),
  };
});

ipcMain.handle("update:get-status", () => currentUpdateStatus);

ipcMain.handle("update:check", async () => {
  await checkForUpdates(false);
  return currentUpdateStatus;
});

ipcMain.on("app:restart-and-install", () => {
  restartAndInstall();
});

ipcMain.on("app:open-external", (_event, url: string) => {
  if (typeof url === "string" && (url.startsWith("https://") || url.startsWith("http://"))) {
    void shell.openExternal(url);
  }
});

ipcMain.handle("storage:load-disk", () => {
  try {
    const db = getDatabase();
    const { clips, notes } = db.loadAll();
    return { clips, notes, storagePath: db.dbPath };
  } catch (err) {
    console.error("Error al cargar datos desde SQLite:", err);
    return { clips: null, notes: null, storagePath: userDataPath };
  }
});

ipcMain.on("storage:save-clips", (_event, clipsJson: string) => {
  try {
    const clips = JSON.parse(clipsJson);
    if (Array.isArray(clips)) {
      getDatabase().saveClips(clips);
    }
  } catch (err) {
    console.error("Error al guardar clips en SQLite:", err);
  }
});

ipcMain.on("storage:save-notes", (_event, notesJson: string) => {
  try {
    const notes = JSON.parse(notesJson);
    if (Array.isArray(notes)) {
      getDatabase().saveNotes(notes);
    }
  } catch (err) {
    console.error("Error al guardar notas en SQLite:", err);
  }
});
