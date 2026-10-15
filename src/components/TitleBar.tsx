import { Minus, X, Clipboard, StickyNote, Sun, Moon, Languages, Type } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeSelector } from "./ThemeSelector";
import type { ActiveTab } from "../types/clip";
import type { ThemeId, ThemeMode, FontSize } from "../types/theme";
import { translations, type Language } from "../locales/translations";
import clipLogo from "../assets/clipDev_logo.png";

interface TitleBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  clipsCount: number;
  notesCount: number;
  currentTheme: ThemeId;
  onSelectTheme: (theme: ThemeId) => void;
  mode: ThemeMode;
  onToggleMode: () => void;
  lang: Language;
  onToggleLang: () => void;
  fontSize: FontSize;
  onCycleFontSize: () => void;
}

export const TitleBar = ({
  activeTab,
  onTabChange,
  clipsCount,
  notesCount,
  currentTheme,
  onSelectTheme,
  mode,
  onToggleMode,
  lang,
  onToggleLang,
  fontSize,
  onCycleFontSize,
}: TitleBarProps) => {
  const t = translations[lang];

  const handleMinimize = () => {
    window.electronAPI?.minimizeWindow();
  };

  const handleClose = () => {
    window.electronAPI?.closeWindow();
  };

  const getFontSizeLabel = () => {
    switch (fontSize) {
      case "xlarge":
        return "A++";
      case "large":
        return "A+";
      default:
        return "A";
    }
  };

  const getFontSizeTooltip = () => {
    switch (fontSize) {
      case "xlarge":
        return `${t.controls.fontSize}: ${t.controls.fontXLarge}`;
      case "large":
        return `${t.controls.fontSize}: ${t.controls.fontLarge}`;
      default:
        return `${t.controls.fontSize}: ${t.controls.fontNormal}`;
    }
  };

  return (
    <header className="titlebar-drag h-12 theme-bg-header border-b theme-border-app flex items-center justify-between px-3 select-none transition-colors duration-200">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5 group cursor-default">
          <div className="w-7 h-7 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
            <img
              src={clipLogo}
              alt="ClipDev Logo"
              className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-transform duration-200 group-hover:rotate-6"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm tracking-tight theme-text-app flex items-center font-sans">
              <span>Clip</span>
              <span className="theme-accent-text font-black ml-0.5">Dev</span>
            </span>
            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded-full theme-accent-subtle theme-accent-text border theme-accent-border/40 tracking-wider">
              v1.0.1
            </span>
          </div>
        </div>

        <div className="titlebar-no-drag flex items-center theme-bg-app p-0.5 rounded-lg border theme-border-app relative">
          <button
            onClick={() => onTabChange("clipboard")}
            className={`relative flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors z-10 ${
              activeTab === "clipboard" ? "theme-text-app" : "theme-text-muted hover:theme-text-app"
            }`}
          >
            {activeTab === "clipboard" && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute inset-0 theme-bg-panel rounded-md -z-10 shadow-sm border theme-border-app"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
              />
            )}
            <Clipboard className="w-3.5 h-3.5 theme-accent-text" />
            <span>{t.app.clipboardTab}</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full theme-bg-panel theme-text-muted border theme-border-app">
              {clipsCount}
            </span>
          </button>

          <button
            onClick={() => onTabChange("notes")}
            className={`relative flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors z-10 ${
              activeTab === "notes" ? "theme-text-app" : "theme-text-muted hover:theme-text-app"
            }`}
          >
            {activeTab === "notes" && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute inset-0 theme-bg-panel rounded-md -z-10 shadow-sm border theme-border-app"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
              />
            )}
            <StickyNote className="w-3.5 h-3.5 theme-accent-text" />
            <span>{t.app.notesTab}</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full theme-bg-panel theme-text-muted border theme-border-app">
              {notesCount}
            </span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <ThemeSelector
          currentTheme={currentTheme}
          onSelectTheme={onSelectTheme}
          lang={lang}
        />

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onCycleFontSize}
          className="titlebar-no-drag flex items-center gap-1.5 px-2 py-1 rounded-md theme-bg-panel hover:theme-accent-subtle border theme-border-app theme-text-app text-xs font-semibold transition-colors shadow-sm"
          title={getFontSizeTooltip()}
        >
          <motion.div
            key={`icon-${fontSize}`}
            initial={{ scale: 0.8, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 450, damping: 16 }}
          >
            <Type className="w-3.5 h-3.5 theme-accent-text" />
          </motion.div>
          <div className="overflow-hidden h-3.5 w-6 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={fontSize}
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 8, opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="text-[10px] font-mono tracking-tight font-bold"
              >
                {getFontSizeLabel()}
              </motion.span>
            </AnimatePresence>
          </div>
        </motion.button>

        <button
          onClick={onToggleMode}
          className="titlebar-no-drag p-1.5 rounded-md theme-bg-panel hover:theme-accent-subtle border theme-border-app theme-text-app text-xs transition-colors shadow-sm"
          title={mode === "dark" ? t.controls.lightMode : t.controls.darkMode}
        >
          {mode === "dark" ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-blue-500" />
          )}
        </button>

        <button
          onClick={onToggleLang}
          className="titlebar-no-drag flex items-center gap-1 px-2 py-1 rounded-md theme-bg-panel hover:theme-accent-subtle border theme-border-app theme-text-app text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
          title={t.controls.language}
        >
          <Languages className="w-3.5 h-3.5 theme-accent-text" />
          <span>{lang}</span>
        </button>

        <div className="hidden md:flex items-center gap-1 text-[11px] theme-text-muted font-mono theme-bg-app px-2 py-0.5 rounded border theme-border-app">
          <span>{t.app.shortcutHint}</span>
        </div>

        <div className="titlebar-no-drag flex items-center gap-0.5 ml-1">
          <button
            onClick={handleMinimize}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-500/10 theme-text-muted hover:theme-text-app transition-colors"
            title={t.controls.minimize}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleClose}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-500/20 hover:text-red-500 theme-text-muted transition-colors"
            title={t.controls.close}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
