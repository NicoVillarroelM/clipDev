import type { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import type { StoredClip, StoredNote } from "./types";

interface MigrationHandlers {
  saveClips: (clips: StoredClip[]) => void;
  saveNotes: (notes: StoredNote[]) => void;
}

export function migrateLegacyJsonFiles(
  db: DatabaseSync,
  userDataPath: string,
  handlers: MigrationHandlers
): void {
  migrateJsonFile<StoredClip>(
    db,
    path.join(userDataPath, "clips.json"),
    "clips",
    handlers.saveClips
  );
  migrateJsonFile<StoredNote>(
    db,
    path.join(userDataPath, "notes.json"),
    "notes",
    handlers.saveNotes
  );
  cleanupLegacyTempFiles(userDataPath);
}

function migrateJsonFile<T>(
  db: DatabaseSync,
  filePath: string,
  table: "clips" | "notes",
  onSave: (items: T[]) => void
): void {
  if (!fs.existsSync(filePath)) return;

  try {
    const countRow = db
      .prepare(`SELECT COUNT(*) as count FROM ${table}`)
      .get() as { count: number };

    if (countRow.count === 0) {
      const raw = fs.readFileSync(filePath, "utf-8").trim();
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length > 0) {
        onSave(parsed);
      }
    }
    fs.unlinkSync(filePath);
  } catch (err) {
    console.warn(`No se pudo migrar ${path.basename(filePath)} a SQLite:`, err);
  }
}

function cleanupLegacyTempFiles(userDataPath: string): void {
  try {
    for (const file of fs.readdirSync(userDataPath)) {
      const isLegacyTmp =
        (file.startsWith("clips.json.") || file.startsWith("notes.json.")) &&
        file.endsWith(".tmp");
      if (isLegacyTmp) {
        fs.unlinkSync(path.join(userDataPath, file));
      }
    }
  } catch {}
}
