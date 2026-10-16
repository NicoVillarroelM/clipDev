import { app, BrowserWindow, clipboard, ClipboardItem, globalShortcut, ipcMain, shell, session, nativeImage } from "electron";
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
  const isTransparent = hasTransparency(finalImg.getBitmap());
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
        const buffer = Buffer.from(await blob.arrayBuffer());
        return processImageBuffer(buffer);
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
            const buffer = Buffer.from(await blob.arrayBuffer());
            lastImageHash = crypto.createHash("md5").update(buffer).digest("hex");
            break;
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

const userDataPath = app.getPath("userData");
let storageDb: ClipDevDatabase | null = null;

function getDatabase(): ClipDevDatabase {
  if (!storageDb) {
    storageDb = new ClipDevDatabase(userDataPath);
  }
  return storageDb;
}

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
  if (clipboardInterval) clearInterval(clipboardInterval);
  storageDb?.close();
  storageDb = null;
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
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
    const blob = new Blob([buffer], { type: "image/png" });
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
