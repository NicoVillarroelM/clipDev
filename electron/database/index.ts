import { DatabaseSync, type StatementSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import type {
  ClipRow,
  ExistingClipMeta,
  ExistingNoteMeta,
  NoteRow,
  StoredClip,
  StoredNote,
} from "./types";
import { INIT_SCHEMA_SQL, SQL_QUERIES } from "./schema";
import {
  mapClipRowToStoredClip,
  mapNoteRowToStoredNote,
  resolveClipPayload,
} from "./mappers";
import { migrateLegacyJsonFiles } from "./migrator";

export type { StoredClip, StoredNote } from "./types";

export class ClipDevDatabase {
  private db: DatabaseSync;
  public readonly dbPath: string;

  constructor(userDataPath: string) {
    this.dbPath = path.join(userDataPath, "clipdev.db");
    fs.mkdirSync(userDataPath, { recursive: true });

    this.db = new DatabaseSync(this.dbPath);
    this.db.exec(INIT_SCHEMA_SQL);

    migrateLegacyJsonFiles(this.db, userDataPath, {
      saveClips: (items) => this.saveClips(items),
      saveNotes: (items) => this.saveNotes(items),
    });
  }

  private runInTransaction(work: () => void): void {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      work();
      this.db.exec("COMMIT");
    } catch (err) {
      this.db.exec("ROLLBACK");
      throw err;
    }
  }

  private deleteRemovedIds(
    deleteStmt: StatementSync,
    existingIds: Iterable<string>,
    incomingIds: Set<string>
  ): void {
    for (const id of existingIds) {
      if (!incomingIds.has(id)) {
        deleteStmt.run(id);
      }
    }
  }

  public loadAll(): { clips: StoredClip[] | null; notes: StoredNote[] | null } {
    return {
      clips: this.loadClips(),
      notes: this.loadNotes(),
    };
  }

  private loadClips(): StoredClip[] | null {
    const rows = this.db
      .prepare(SQL_QUERIES.SELECT_ALL_CLIPS)
      .all() as unknown as ClipRow[];

    return rows.length > 0 ? rows.map(mapClipRowToStoredClip) : null;
  }

  private loadNotes(): StoredNote[] | null {
    const rows = this.db
      .prepare(SQL_QUERIES.SELECT_ALL_NOTES)
      .all() as unknown as NoteRow[];

    return rows.length > 0 ? rows.map(mapNoteRowToStoredNote) : null;
  }

  public saveClips(clips: StoredClip[]): void {
    const existingRows = this.db
      .prepare(SQL_QUERIES.SELECT_CLIPS_META)
      .all() as unknown as ExistingClipMeta[];

    const existingMap = new Map(existingRows.map((r) => [r.id, r]));
    const incomingIds = new Set(clips.map((c) => c.id));

    const deleteStmt = this.db.prepare(SQL_QUERIES.DELETE_CLIP_BY_ID);
    const updateMetaStmt = this.db.prepare(SQL_QUERIES.UPDATE_CLIP_META);
    const insertStmt = this.db.prepare(SQL_QUERIES.INSERT_CLIP);

    this.runInTransaction(() => {
      this.deleteRemovedIds(deleteStmt, existingMap.keys(), incomingIds);
      for (let i = 0; i < clips.length; i++) {
        this.upsertClip(
          clips[i],
          i,
          existingMap.get(clips[i].id),
          updateMetaStmt,
          insertStmt
        );
      }
    });
  }

  private upsertClip(
    clip: StoredClip,
    sortOrder: number,
    existing: ExistingClipMeta | undefined,
    updateMetaStmt: StatementSync,
    insertStmt: StatementSync
  ): void {
    const pinnedInt = clip.pinned ? 1 : 0;

    if (existing) {
      const hasMetaChanged =
        existing.pinned !== pinnedInt ||
        existing.created_at !== clip.createdAt ||
        existing.sort_order !== sortOrder;

      if (hasMetaChanged) {
        updateMetaStmt.run(pinnedInt, clip.createdAt, sortOrder, clip.id);
      }
      return;
    }

    const payload = resolveClipPayload(clip);
    insertStmt.run(
      clip.id,
      payload.content,
      payload.blob,
      payload.mimeType,
      clip.type,
      clip.createdAt,
      pinnedInt,
      clip.imageWidth ?? null,
      clip.imageHeight ?? null,
      clip.imageSizeLabel ?? null,
      sortOrder
    );
  }

  public saveNotes(notes: StoredNote[]): void {
    const existingRows = this.db
      .prepare(SQL_QUERIES.SELECT_NOTES_META)
      .all() as unknown as ExistingNoteMeta[];

    const existingMap = new Map(existingRows.map((r) => [r.id, r]));
    const incomingIds = new Set(notes.map((n) => n.id));

    const deleteStmt = this.db.prepare(SQL_QUERIES.DELETE_NOTE_BY_ID);
    const updateFullStmt = this.db.prepare(SQL_QUERIES.UPDATE_NOTE_FULL);
    const updateOrderStmt = this.db.prepare(SQL_QUERIES.UPDATE_NOTE_ORDER);
    const insertStmt = this.db.prepare(SQL_QUERIES.INSERT_NOTE);

    this.runInTransaction(() => {
      this.deleteRemovedIds(deleteStmt, existingMap.keys(), incomingIds);
      for (let i = 0; i < notes.length; i++) {
        this.upsertNote(
          notes[i],
          i,
          existingMap.get(notes[i].id),
          updateFullStmt,
          updateOrderStmt,
          insertStmt
        );
      }
    });
  }

  private upsertNote(
    note: StoredNote,
    sortOrder: number,
    existing: ExistingNoteMeta | undefined,
    updateFullStmt: StatementSync,
    updateOrderStmt: StatementSync,
    insertStmt: StatementSync
  ): void {
    if (!existing) {
      insertStmt.run(
        note.id,
        note.title,
        note.content,
        note.color,
        note.updatedAt,
        sortOrder
      );
      return;
    }

    if (existing.updated_at !== note.updatedAt) {
      updateFullStmt.run(
        note.title,
        note.content,
        note.color,
        note.updatedAt,
        sortOrder,
        note.id
      );
    } else if (existing.sort_order !== sortOrder) {
      updateOrderStmt.run(sortOrder, note.id);
    }
  }

  public close(): void {
    try {
      this.db.exec("PRAGMA wal_checkpoint(TRUNCATE);");
      this.db.close();
    } catch {}
  }
}
