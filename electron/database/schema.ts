export const INIT_SCHEMA_SQL = `
  PRAGMA auto_vacuum = FULL;
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA temp_store = MEMORY;

  CREATE TABLE IF NOT EXISTS clips (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    image_blob BLOB,
    mime_type TEXT,
    type TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    pinned INTEGER NOT NULL DEFAULT 0,
    image_width INTEGER,
    image_height INTEGER,
    image_size_label TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_clips_sort ON clips(sort_order ASC);

  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    color TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_notes_sort ON notes(sort_order ASC);
`;

export const SQL_QUERIES = {
  SELECT_ALL_CLIPS: `
    SELECT id, content, image_blob, mime_type, type, created_at, pinned,
           image_width, image_height, image_size_label
    FROM clips
    ORDER BY sort_order ASC
  `,
  SELECT_CLIPS_META: "SELECT id, pinned, created_at, sort_order FROM clips",
  DELETE_CLIP_BY_ID: "DELETE FROM clips WHERE id = ?",
  UPDATE_CLIP_META: "UPDATE clips SET pinned = ?, created_at = ?, sort_order = ? WHERE id = ?",
  INSERT_CLIP: `
    INSERT INTO clips (
      id, content, image_blob, mime_type, type, created_at, pinned,
      image_width, image_height, image_size_label, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,

  SELECT_ALL_NOTES: `
    SELECT id, title, content, color, updated_at
    FROM notes
    ORDER BY sort_order ASC
  `,
  SELECT_NOTES_META: "SELECT id, updated_at, sort_order FROM notes",
  DELETE_NOTE_BY_ID: "DELETE FROM notes WHERE id = ?",
  UPDATE_NOTE_FULL:
    "UPDATE notes SET title = ?, content = ?, color = ?, updated_at = ?, sort_order = ? WHERE id = ?",
  UPDATE_NOTE_ORDER: "UPDATE notes SET sort_order = ? WHERE id = ?",
  INSERT_NOTE: `
    INSERT INTO notes (id, title, content, color, updated_at, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
} as const;
