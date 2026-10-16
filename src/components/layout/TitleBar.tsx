import { Minus, X, Clipboard, StickyNote } from "lucide-react";
import { motion } from "framer-motion";
import { SettingsPopover } from "../settings/SettingsPopover";
import type { ActiveTab } from "../../types/clip";
import type { ThemeId, ThemeMode, FontSize, AppFinish } from "../../types/theme";
import { translations, type Language } from "../../locales/translations";
import clipLogo from "../../assets/clipDev_logo.png";
import { APP_VERSION } from "../../constants";

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
  onSelectLang: (lang: Language) => void;
  fontSize: FontSize;
  onSelectFontSize: (size: FontSize) => void;
  finish: AppFinish;
  onToggleFinish: () => void;
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
  onSelectLang,
  fontSize,
  onSelectFontSize,
  finish,
  onToggleFinish,
}: TitleBarProps) => {
  const t = translations[lang];
  const isMac = window.electronAPI?.platform === "darwin" || (typeof navigator !== "undefined" && navigator.userAgent.includes("Mac"));

  const handleMinimize = () => {
    window.electronAPI?.minimizeWindow();
  };

  const handleClose = () => {
    window.electronAPI?.closeWindow();
  };

  return (
    <header className={`titlebar-drag relative z-50 h-12 theme-bg-header border-b theme-border-app flex items-center justify-between select-none transition-colors duration-200 ${isMac ? "pl-20 pr-3" : "px-3"}`}>
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
              v{APP_VERSION}
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

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1 text-[11px] theme-text-muted font-mono theme-bg-app px-2.5 py-1 rounded-md border theme-border-app">
          <span>{t.app.shortcutHint}</span>
        </div>

        <SettingsPopover
          currentTheme={currentTheme}
          onSelectTheme={onSelectTheme}
          mode={mode}
          onToggleMode={onToggleMode}
          finish={finish}
          onToggleFinish={onToggleFinish}
          fontSize={fontSize}
          onSelectFontSize={onSelectFontSize}
          lang={lang}
          onSelectLang={onSelectLang}
        />

        {!isMac && (
          <div className="titlebar-no-drag flex items-center gap-0.5 ml-1">
            <button
              onClick={handleMinimize}
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-500/10 theme-text-muted hover:theme-text-app transition-colors"
              title={t.controls.minimize}
              aria-label={t.controls.minimize}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleClose}
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-500/20 hover:text-red-500 theme-text-muted transition-colors"
              title={t.controls.close}
              aria-label={t.controls.close}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
