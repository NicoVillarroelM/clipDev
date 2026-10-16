import type { NoteColor } from "../types/clip";

export interface NoteColorOption {
  id: NoteColor;
  name: string;
  bg: string;
  dot: string;
  border: string;
}

export const NOTE_COLORS: readonly NoteColorOption[] = [
  { id: "amber", name: "Ámbar", bg: "bg-amber-500/10", dot: "#f59e0b", border: "border-amber-500/40" },
  { id: "emerald", name: "Esmeralda", bg: "bg-emerald-500/10", dot: "#10b981", border: "border-emerald-500/40" },
  { id: "blue", name: "Azul", bg: "bg-blue-500/10", dot: "#3b82f6", border: "border-blue-500/40" },
  { id: "purple", name: "Púrpura", bg: "bg-purple-500/10", dot: "#a855f7", border: "border-purple-500/40" },
  { id: "rose", name: "Rosa", bg: "bg-rose-500/10", dot: "#f43f5e", border: "border-rose-500/40" },
  { id: "zinc", name: "Neutro", bg: "bg-zinc-500/10", dot: "#71717a", border: "border-zinc-500/40" },
] as const;

export const IMAGE_RESIZE_PRESETS = ["25%", "50%", "75%", "100%"] as const;
export type ImageResizePreset = (typeof IMAGE_RESIZE_PRESETS)[number];

export const IMAGE_ALIGN_OPTIONS = ["left", "center", "right"] as const;
export type ImageAlignOption = (typeof IMAGE_ALIGN_OPTIONS)[number];
