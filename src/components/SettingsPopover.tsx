import { useState, useRef, useEffect } from "react";
import {
  Settings2,
  Sparkles,
  Layers,
  Sun,
  Moon,
  Check,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { THEME_OPTIONS, type ThemeId, type ThemeMode, type FontSize, type AppFinish } from "../types/theme";
import { translations, type Language } from "../locales/translations";

interface SettingsPopoverProps {
  currentTheme: ThemeId;
  onSelectTheme: (theme: ThemeId) => void;
  mode: ThemeMode;
  onToggleMode: () => void;
  finish: AppFinish;
  onToggleFinish: () => void;
  fontSize: FontSize;
  onSelectFontSize: (size: FontSize) => void;
  lang: Language;
  onSelectLang: (lang: Language) => void;
}

export const SettingsPopover = ({
  currentTheme,
  onSelectTheme,
  mode,
  onToggleMode,
  finish,
  onToggleFinish,
  fontSize,
  onSelectFontSize,
  lang,
  onSelectLang,
}: SettingsPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [downloadedVersion, setDownloadedVersion] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const t = translations[lang];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (window.electronAPI?.onUpdateDownloaded) {
      const cleanup = window.electronAPI.onUpdateDownloaded((version) => {
        setDownloadedVersion(version);
      });
      return () => cleanup();
    }
  }, []);

  const currentOption =
    THEME_OPTIONS.find((t) => t.id === currentTheme) || THEME_OPTIONS[0];

  return (
    <div className="relative titlebar-no-drag z-50" ref={containerRef}>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all shadow-sm ${
          isOpen
            ? "theme-accent-subtle theme-accent-text theme-accent-border border"
            : "theme-bg-panel hover:theme-accent-subtle theme-border-app theme-text-app"
        }`}
        title={t.controls.settings}
        aria-label={t.controls.settings}
      >
        <div className="relative">
          <Settings2 className="w-3.5 h-3.5 theme-accent-text" />
          {downloadedVersion && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-2 ring-black" />
          )}
        </div>
        <span
          className="w-2 h-2 rounded-full ring-1 ring-black/20 dark:ring-white/20"
          style={{ backgroundColor: currentOption.color }}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 z-50 w-72 p-3.5 rounded-2xl settings-popover-panel theme-border-app border shadow-2xl backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b theme-border-app">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 theme-accent-text" />
                <span className="text-xs font-bold tracking-tight theme-text-app">
                  {t.controls.settings}
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md theme-text-muted hover:theme-text-app hover:bg-zinc-500/10 transition-colors"
                aria-label={t.controls.close}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {downloadedVersion && (
              <div className="p-2 mb-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2">
                <span className="text-[11px] text-emerald-400 font-semibold truncate">
                  {t.controls.updateReady} (v{downloadedVersion})
                </span>
                <button
                  onClick={() => window.electronAPI?.restartAndInstallUpdate?.()}
                  className="shrink-0 px-2 py-1 rounded-md bg-emerald-500 text-zinc-950 font-bold text-[10px] hover:bg-emerald-400 transition-colors shadow-sm"
                >
                  {t.controls.restartToUpdate}
                </button>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold theme-text-muted block mb-1.5">
                  {t.controls.finish}
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl theme-bg-app border theme-border-app">
                  <button
                    onClick={() => {
                      if (finish !== "solid") onToggleFinish();
                    }}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                      finish === "solid"
                        ? "theme-bg-panel theme-text-app shadow-sm border theme-border-app"
                        : "theme-text-muted hover:theme-text-app"
                    }`}
                  >
                    <Layers className="w-3 h-3 theme-accent-text" />
                    <span>{t.controls.finishSolidShort}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (finish !== "glass") onToggleFinish();
                    }}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                      finish === "glass"
                        ? "theme-accent-subtle theme-accent-text theme-accent-border border shadow-sm"
                        : "theme-text-muted hover:theme-text-app"
                    }`}
                  >
                    <Sparkles className="w-3 h-3 theme-accent-text" />
                    <span>{t.controls.finishGlassShort}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold theme-text-muted block mb-1.5">
                  {t.controls.themeMode}
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl theme-bg-app border theme-border-app">
                  <button
                    onClick={() => {
                      if (mode !== "dark") onToggleMode();
                    }}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                      mode === "dark"
                        ? "theme-bg-panel theme-text-app shadow-sm border theme-border-app"
                        : "theme-text-muted hover:theme-text-app"
                    }`}
                  >
                    <Moon className="w-3 h-3 text-blue-400" />
                    <span>{t.controls.darkMode}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (mode !== "light") onToggleMode();
                    }}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                      mode === "light"
                        ? "theme-bg-panel theme-text-app shadow-sm border theme-border-app"
                        : "theme-text-muted hover:theme-text-app"
                    }`}
                  >
                    <Sun className="w-3 h-3 text-amber-400" />
                    <span>{t.controls.lightMode}</span>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-semibold theme-text-muted">
                    {t.controls.accentColor}
                  </label>
                  <span className="text-[10px] font-mono theme-accent-text font-bold">
                    {t.themes[currentOption.nameKey]}
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-1.5 p-1.5 rounded-xl theme-bg-app border theme-border-app">
                  {THEME_OPTIONS.map((theme) => {
                    const isActive = theme.id === currentTheme;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => onSelectTheme(theme.id)}
                        className={`h-7 rounded-lg flex items-center justify-center transition-transform hover:scale-110 relative ${
                          isActive ? "ring-2 ring-white/60 dark:ring-white/80" : ""
                        }`}
                        style={{ backgroundColor: theme.color }}
                        title={t.themes[theme.nameKey]}
                        aria-label={t.themes[theme.nameKey]}
                      >
                        {isActive && (
                          <Check className="w-3.5 h-3.5 text-white drop-shadow-md stroke-[3]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold theme-text-muted block mb-1.5">
                  {t.controls.fontSize}
                </label>
                <div className="grid grid-cols-3 gap-1 p-1 rounded-xl theme-bg-app border theme-border-app text-xs font-mono">
                  {(["normal", "large", "xlarge"] as FontSize[]).map((size) => {
                    const isActive = fontSize === size;
                    const label = size === "normal" ? "100%" : size === "large" ? "112%" : "125%";
                    return (
                      <button
                        key={size}
                        onClick={() => onSelectFontSize(size)}
                        className={`py-1 rounded-lg text-center font-bold transition-all ${
                          isActive
                            ? "theme-accent-subtle theme-accent-text theme-accent-border border shadow-sm"
                            : "theme-text-muted hover:theme-text-app"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold theme-text-muted block mb-1.5">
                  {t.controls.language}
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl theme-bg-app border theme-border-app">
                  <button
                    onClick={() => onSelectLang("es")}
                    className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-xs font-semibold transition-all ${
                      lang === "es"
                        ? "theme-accent-subtle theme-accent-text theme-accent-border border shadow-sm"
                        : "theme-text-muted hover:theme-text-app"
                    }`}
                  >
                    <span>🇪🇸</span>
                    <span>Español</span>
                  </button>

                  <button
                    onClick={() => onSelectLang("en")}
                    className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-xs font-semibold transition-all ${
                      lang === "en"
                        ? "theme-accent-subtle theme-accent-text theme-accent-border border shadow-sm"
                        : "theme-text-muted hover:theme-text-app"
                    }`}
                  >
                    <span>🇺🇸</span>
                    <span>English</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2.5 mt-2.5 border-t theme-border-app flex items-center justify-between text-[10px] theme-text-muted font-mono">
              <span>ClipDev v1.0.2</span>
              <span className="theme-accent-text font-semibold">{t.app.shortcutHint}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
