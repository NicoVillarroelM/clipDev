import type { FontSize } from "../types/theme";
import type { Language } from "../locales/translations";

export interface FontSizeOption {
  id: FontSize;
  label: string;
  factor: number;
}

export const FONT_SIZE_OPTIONS: readonly FontSizeOption[] = [
  { id: "normal", label: "100%", factor: 1.0 },
  { id: "large", label: "112%", factor: 1.12 },
  { id: "xlarge", label: "125%", factor: 1.25 },
] as const;

export interface LanguageOption {
  id: Language;
  flag: string;
  label: string;
}

export const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  { id: "es", flag: "🇪🇸", label: "Español" },
  { id: "en", flag: "🇺🇸", label: "English" },
] as const;
