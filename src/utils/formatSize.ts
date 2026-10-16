import type { ClipItem, NoteItem } from "../types/clip";

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function getClipByteSize(clip: ClipItem): number {
  if (clip.type === "image") {
    const commaIndex = clip.content.indexOf(",");
    const base64 = commaIndex !== -1 ? clip.content.slice(commaIndex + 1) : clip.content;
    return Math.round((base64.length * 3) / 4);
  }
  return new TextEncoder().encode(clip.content || "").length;
}

export function getNoteByteSize(note: NoteItem): number {
  const fullContent = (note.title || "") + (note.content || "");
  return new TextEncoder().encode(fullContent).length;
}
