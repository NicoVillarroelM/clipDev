import type { ComponentType } from "react";
import { Layers, Pin, Code2, Link, Palette, Image as ImageIcon } from "lucide-react";
import type { FilterType } from "../types/clip";

export interface FilterOption {
  id: FilterType;
  labelKey: "all" | "pinned" | "code" | "url" | "color" | "image";
  icon: ComponentType<{ className?: string }>;
  iconColorClass?: string;
}

export const CLIP_FILTERS: readonly FilterOption[] = [
  { id: "all", labelKey: "all", icon: Layers, iconColorClass: "theme-accent-text" },
  { id: "pinned", labelKey: "pinned", icon: Pin, iconColorClass: "theme-accent-text" },
  { id: "code", labelKey: "code", icon: Code2, iconColorClass: "text-emerald-500" },
  { id: "url", labelKey: "url", icon: Link, iconColorClass: "text-blue-500" },
  { id: "color", labelKey: "color", icon: Palette, iconColorClass: "text-purple-500" },
  { id: "image", labelKey: "image", icon: ImageIcon, iconColorClass: "text-emerald-500" },
] as const;
