export interface StoredClip {
  id: string;
  content: string;
  type: string;
  createdAt: number;
  pinned: boolean;
  imageWidth?: number;
  imageHeight?: number;
  imageSizeLabel?: string;
}

export interface StoredNote {
  id: string;
  title: string;
  content: string;
  color: string;
  updatedAt: number;
}

export interface ExistingClipMeta {
  id: string;
  pinned: number;
  created_at: number;
  sort_order: number;
}

export interface ExistingNoteMeta {
  id: string;
  updated_at: number;
  sort_order: number;
}

export interface ClipRow {
  id: string;
  content: string;
  image_blob: Uint8Array | null;
  mime_type: string | null;
  type: string;
  created_at: number;
  pinned: number;
  image_width: number | null;
  image_height: number | null;
  image_size_label: string | null;
}

export interface NoteRow {
  id: string;
  title: string;
  content: string;
  color: string;
  updated_at: number;
}

export interface ClipPayload {
  content: string;
  blob: Buffer | null;
  mimeType: string | null;
}
