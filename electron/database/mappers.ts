import type {
  ClipPayload,
  ClipRow,
  NoteRow,
  StoredClip,
  StoredNote,
} from "./types";

const DATA_URL_PREFIX_REGEX = /^data:(image\/[a-zA-Z0-9.+-]+);base64,/;

export function resolveClipPayload(clip: StoredClip): ClipPayload {
  if (clip.type === "image") {
    const match = DATA_URL_PREFIX_REGEX.exec(clip.content);
    if (match) {
      return {
        content: "",
        blob: Buffer.from(clip.content.slice(match[0].length), "base64"),
        mimeType: match[1],
      };
    }
  }
  return { content: clip.content, blob: null, mimeType: null };
}

export function reconstructDataUrl(mimeType: string, blob: Uint8Array): string {
  const buf = Buffer.from(blob.buffer, blob.byteOffset, blob.byteLength);
  return `data:${mimeType};base64,${buf.toString("base64")}`;
}

export function mapClipRowToStoredClip(row: ClipRow): StoredClip {
  const content =
    row.image_blob && row.mime_type
      ? reconstructDataUrl(row.mime_type, row.image_blob)
      : row.content;

  const item: StoredClip = {
    id: row.id,
    content,
    type: row.type,
    createdAt: row.created_at,
    pinned: Boolean(row.pinned),
  };

  if (row.image_width !== null) item.imageWidth = row.image_width;
  if (row.image_height !== null) item.imageHeight = row.image_height;
  if (row.image_size_label !== null) item.imageSizeLabel = row.image_size_label;
  return item;
}

export function mapNoteRowToStoredNote(row: NoteRow): StoredNote {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    color: row.color,
    updatedAt: row.updated_at,
  };
}
