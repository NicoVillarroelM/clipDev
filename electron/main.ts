import { app, BrowserWindow, clipboard, globalShortcut, ipcMain, shell, session } from "electron";
import { autoUpdater } from "electron-updater";
import path from "node:path";
import fs from "node:fs";
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
let clipboardInterval: NodeJS.Timeout | null = null;

function createWindow() {
  const preloadPath = path.join(__dirname, "preload.cjs");
  const candidateIcons = [
    path.join(process.env.APP_ROOT, "dist", "clipDev_logo.ico"),
    path.join(process.env.APP_ROOT, "public", "clipDev_logo.ico"),
  ];
  const iconPath = candidateIcons.find((p) => fs.existsSync(p));

  win = new BrowserWindow({
    width: 820,
    height: 580,
    minWidth: 550,
    frame: false,
    backgroundMaterial: "acrylic",
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
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  // Impedir navegación dentro de la app hacia URLs remotas
  win.webContents.on("will-navigate", (event, url) => {
    const currentUrl = win?.webContents.getURL();
    if (currentUrl && url !== currentUrl) {
      event.preventDefault();
      if (url.startsWith("https:") || url.startsWith("http:")) {
        shell.openExternal(url);
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
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

// Iniciar monitoreo del portapapeles
async function startClipboardWatcher() {
  try {
    lastClipboardText = await clipboard.readText();
  } catch {
    lastClipboardText = "";
  }

  clipboardInterval = setInterval(async () => {
    try {
      const currentText = await clipboard.readText();
      if (currentText && currentText.trim() !== "" && currentText !== lastClipboardText) {
        lastClipboardText = currentText;
        if (win && !win.isDestroyed()) {
          win.webContents.send("clipboard:updated", currentText);
        }
      }
    } catch (err) {
      console.error("Error reading clipboard:", err);
    }
  }, 750);
}

app.whenReady().then(() => {
  // Denegar permisos innecesarios (cámara, micrófono, geolocalización)
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  createWindow();
  startClipboardWatcher();

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
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
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

ipcMain.on("clipboard:write", async (_event, text: string) => {
  lastClipboardText = text; // Evita loop en el watcher
  await clipboard.writeText(text);
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

ipcMain.handle("storage:load-disk", async () => {
  try {
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

ipcMain.on("storage:save-clips", async (_event, clipsJson: string) => {
  try {
    await fs.promises.writeFile(clipsFilePath, clipsJson, "utf-8");
  } catch (err) {
    console.error("Error al guardar clips en disco:", err);
  }
});

ipcMain.on("storage:save-notes", async (_event, notesJson: string) => {
  try {
    await fs.promises.writeFile(notesFilePath, notesJson, "utf-8");
  } catch (err) {
    console.error("Error al guardar notas en disco:", err);
  }
});
