import { useState, useEffect, useRef } from "react";
import type { ThemeId, ThemeMode, FontSize, AppFinish } from "../types/theme";
import { translations, type Language } from "../locales/translations";
import {
  STORAGE_KEYS,
  SCALE_TOAST_TIMEOUT_MS,
  FONT_SIZE_OPTIONS,
} from "../constants";

export function useAppearance() {
  const isInitialMount = useRef(true);
  const [showScaleToast, setShowScaleToast] = useState(false);

  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LANG);
      return (saved as Language) || "es";
    } catch {
      return "es";
    }
  });

  const [mode, setMode] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MODE);
      return (saved as ThemeMode) || "dark";
    } catch {
      return "dark";
    }
  });

  const [finish, setFinish] = useState<AppFinish>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FINISH);
      return (saved as AppFinish) || "solid";
    } catch {
      return "solid";
    }
  });

  const [fontSize, setFontSize] = useState<FontSize>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FONT_SIZE);
      return (saved as FontSize) || "normal";
    } catch {
      return "normal";
    }
  });

  const [currentTheme, setCurrentTheme] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      return (saved as ThemeId) || "amber";
    } catch {
      return "amber";
    }
  });

  const t = translations[lang];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LANG, lang);
  }, [lang]);

  useEffect(() => {
    document.documentElement.setAttribute("data-mode", mode);
    localStorage.setItem(STORAGE_KEYS.MODE, mode);
  }, [mode]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", currentTheme);
    localStorage.setItem(STORAGE_KEYS.THEME, currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-finish", finish);
    localStorage.setItem(STORAGE_KEYS.FINISH, finish);
  }, [finish]);

  useEffect(() => {
    const option = FONT_SIZE_OPTIONS.find((o) => o.id === fontSize);
    const factor = option?.factor ?? 1.0;

    if (window.electronAPI?.setZoomFactor) {
      window.electronAPI.setZoomFactor(factor);
    } else {
      (document.documentElement.style as unknown as { zoom: string | number }).zoom = factor;
    }
    document.documentElement.setAttribute("data-font-size", fontSize);
    localStorage.setItem(STORAGE_KEYS.FONT_SIZE, fontSize);
  }, [fontSize]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setShowScaleToast(true);
    const timer = setTimeout(() => {
      setShowScaleToast(false);
    }, SCALE_TOAST_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [fontSize]);

  const handleToggleMode = () => {
    setMode((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleToggleFinish = () => {
    setFinish((prev) => (prev === "solid" ? "glass" : "solid"));
  };

  return {
    lang,
    setLang,
    mode,
    setMode,
    handleToggleMode,
    finish,
    setFinish,
    handleToggleFinish,
    fontSize,
    setFontSize,
    currentTheme,
    setCurrentTheme,
    showScaleToast,
    t,
  };
}
