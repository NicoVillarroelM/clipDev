import { app, BrowserWindow, clipboard, globalShortcut, ipcMain, shell, session, nativeImage } from "electron";
import { autoUpdater } from "electron-updater";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, "..");
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";

export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null = null;
let lastClipboardText = "";
let lastImageHash = "";
let clipboardInterval: NodeJS.Timeout | null = null;

async function createWindow() {
  const isMac = process.platform === "darwin";
  const preloadPath = path.join(__dirname, "preload.cjs");
  const candidateIcons = [
    path.join(process.env.APP_ROOT, "dist", isMac ? "clipDev_logo.png" : "clipDev_logo.ico"),
    path.join(process.env.APP_ROOT, "public", isMac ? "clipDev_logo.png" : "clipDev_logo.ico"),
    path.join(process.env.APP_ROOT, "dist", "clipDev_logo.ico"),
    path.join(process.env.APP_ROOT, "public", "clipDev_logo.ico"),
  ];
  const iconPath = candidateIcons.find((p) => fs.existsSync(p));

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

  // Impedir popups o ventanas no autorizadas: abrir enlaces externos en el navegador del usuario de forma segura
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:") || url.startsWith("http:")) {
      void shell.openExternal(url);
    }
    return { action: "deny" };
  });

  // Impedir navegación dentro de la app hacia URLs remotas
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

  win.once("ready-to-show", () => {
    win?.show();
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

function readClipboardImage(): {
  content: string;
  width: number;
  height: number;
  sizeLabel: string;
} | null {
  try {
    const img = clipboard.readImage();
    if (img.isEmpty()) return null;

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
    return {
      content: finalImg.toDataURL(),
      width: finalSize.width,
      height: finalSize.height,
      sizeLabel: `${size.width} × ${size.height} px`,
    };
  } catch {
    return null;
  }
}

async function checkClipboard() {
  try {
    const rawText = clipboard.readText();
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

    const formats = clipboard.availableFormats();
    const hasImageFormat = formats.some((f) =>
      f.includes("image") || f.includes("PNG") || f.includes("DIB") || f.includes("Bitmap")
    );
    if (!hasImageFormat) {
      return;
    }

    const img = clipboard.readImage();
    if (img.isEmpty()) {
      return;
    }

    const bitmap = img.getBitmap();
    const hash = crypto.createHash("md5").update(bitmap).digest("hex");

    if (hash === lastImageHash) {
      return;
    }

    lastImageHash = hash;
    lastClipboardText = "";

    const imgData = readClipboardImage();
    if (imgData && win && !win.isDestroyed()) {
      win.webContents.send("clipboard:updated-image", imgData);
    }
  } catch (err) {
    console.error("Error reading clipboard:", err);
  }
}

async function startClipboardWatcher() {
  try {
    const rawInit = clipboard.readText();
    lastClipboardText = typeof rawInit === "string" ? rawInit : "";
    if (!lastClipboardText) {
      const initImg = clipboard.readImage();
      if (!initImg.isEmpty()) {
        lastImageHash = crypto.createHash("md5").update(initImg.getBitmap()).digest("hex");
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

async function initializeApp() {
  await app.whenReady();

  // Denegar permisos innecesarios (cámara, micrófono, geolocalización)
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  await createWindow();
  await startClipboardWatcher();

  if (app.isPackaged) {
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify().catch((err) => {
        console.warn("Auto-update check failed:", err);
      });
    }, 4000);
  }

  // Atajo global para abrir/cerrar la ventana desde cualquier lugar
  globalShortcut.register("CommandOrControl+Shift+V", () => {
    if (!win) return;
    if (win.isVisible() && win.isFocused()) {
      win.hide();
    } else {
      win.show();
      win.focus();
    }
  });

  app.on("activate", () => {
    if (win) {
      win.show();
      win.focus();
    } else if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
    }
  });
}

void initializeApp().catch((err) => {
  console.error("Failed to initialize app:", err);
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
  if (clipboardInterval) clearInterval(clipboardInterval);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle("clipboard:get-current", async () => {
  try {
    return await clipboard.readText();
  } catch {
    return "";
  }
});

ipcMain.on("clipboard:write", (_event, text: string) => {
  lastClipboardText = text; // Evita loop en el watcher
  lastImageHash = "";
  void clipboard.writeText(text);
});

ipcMain.handle("clipboard:get-current-image", () => {
  return readClipboardImage();
});

ipcMain.on("clipboard:write-image", (_event, dataUrl: string) => {
  try {
    const img = nativeImage.createFromDataURL(dataUrl);
    if (!img.isEmpty()) {
      lastImageHash = crypto.createHash("md5").update(img.getBitmap()).digest("hex");
      lastClipboardText = "";
      clipboard.writeImage(img);
    }
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

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

autoUpdater.on("update-downloaded", (info) => {
  if (win && !win.isDestroyed()) {
    win.webContents.send("update:downloaded", info.version);
  }
});

ipcMain.on("app:restart-and-install", () => {
  autoUpdater.quitAndInstall();
});

// Persistencia física en archivos JSON en el disco local del usuario (100% privado, offline y permanente)
const userDataPath = app.getPath("userData");
const clipsFilePath = path.join(userDataPath, "clips.json");
const notesFilePath = path.join(userDataPath, "notes.json");

let pendingClipsJson: string | null = null;
let pendingNotesJson: string | null = null;

let saveClipsPromise: Promise<void> = Promise.resolve();
let saveNotesPromise: Promise<void> = Promise.resolve();

async function atomicWriteFile(filePath: string, content: string): Promise<void> {
  const tempPath = `${filePath}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
  try {
    await fs.promises.writeFile(tempPath, content, "utf-8");
    await fs.promises.rename(tempPath, filePath);
  } catch (err) {
    try {
      if (fs.existsSync(tempPath)) {
        await fs.promises.unlink(tempPath);
      }
    } catch {}
    throw err;
  }
}

ipcMain.handle("storage:load-disk", async () => {
  try {
    await saveClipsPromise;
    await saveNotesPromise;

    let clips = null;
    let notes = null;

    if (fs.existsSync(clipsFilePath)) {
      try {
        const raw = await fs.promises.readFile(clipsFilePath, "utf-8");
        if (raw && raw.trim().length > 0) {
          clips = JSON.parse(raw);
        }
      } catch (err) {
        console.warn("clips.json vacío o corrupto, se usará memoria local:", err);
      }
    }

    if (fs.existsSync(notesFilePath)) {
      try {
        const raw = await fs.promises.readFile(notesFilePath, "utf-8");
        if (raw && raw.trim().length > 0) {
          notes = JSON.parse(raw);
        }
      } catch (err) {
        console.warn("notes.json vacío o corrupto, se usará memoria local:", err);
      }
    }

    return { clips, notes, storagePath: userDataPath };
  } catch (err) {
    console.error("Error al cargar datos desde el disco:", err);
    return { clips: null, notes: null, storagePath: userDataPath };
  }
});

ipcMain.on("storage:save-clips", (_event, clipsJson: string) => {
  pendingClipsJson = clipsJson;
  saveClipsPromise = saveClipsPromise
    .then(async () => {
      if (pendingClipsJson === null) return;
      const content = pendingClipsJson;
      pendingClipsJson = null;
      await atomicWriteFile(clipsFilePath, content);
    })
    .catch((err) => {
      console.error("Error al guardar clips en disco:", err);
    });
});

ipcMain.on("storage:save-notes", (_event, notesJson: string) => {
  pendingNotesJson = notesJson;
  saveNotesPromise = saveNotesPromise
    .then(async () => {
      if (pendingNotesJson === null) return;
      const content = pendingNotesJson;
      pendingNotesJson = null;
      await atomicWriteFile(notesFilePath, content);
    })
    .catch((err) => {
      console.error("Error al guardar notas en disco:", err);
    });
});
