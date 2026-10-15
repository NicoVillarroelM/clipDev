export type ContentType = "code" | "url" | "color" | "text" | "image";

export interface ClipItem {
  id: string;
  content: string;
  type: ContentType;
  pinned: boolean;
  createdAt: number;
  imageWidth?: number;
  imageHeight?: number;
  imageSize?: string;
}

export type NoteColor = "amber" | "emerald" | "blue" | "purple" | "rose" | "zinc";

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  color?: NoteColor;
  updatedAt: number;
}

export type ActiveTab = "clipboard" | "notes";
export type FilterType = "all" | "pinned" | "code" | "url" | "color" | "image";
