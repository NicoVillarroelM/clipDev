export type ThemeId = "amber" | "emerald" | "violet" | "blue" | "rose" | "cyan";
export type ThemeMode = "dark" | "light";
export type FontSize = "normal" | "large" | "xlarge";

export interface ThemeOption {
  id: ThemeId;
  nameKey: "amber" | "emerald" | "cyan" | "blue" | "violet" | "rose";
  color: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { id: "amber", nameKey: "amber", color: "#f59e0b" },
  { id: "emerald", nameKey: "emerald", color: "#10b981" },
  { id: "cyan", nameKey: "cyan", color: "#06b6d4" },
  { id: "blue", nameKey: "blue", color: "#3b82f6" },
  { id: "violet", nameKey: "violet", color: "#8b5cf6" },
  { id: "rose", nameKey: "rose", color: "#f43f5e" },
];
