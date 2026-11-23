import { useState, useRef, useEffect } from "react";
import {
  Settings2,
  Sparkles,
  Layers,
  Sun,
  Moon,
  Check,
  X,
  Power,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  THEME_OPTIONS,
  type ThemeId,
  type ThemeMode,
  type FontSize,
  type AppFinish,
} from "../../types/theme";
import type { UpdateStatus } from "../../types/electron";
import { translations, type Language } from "../../locales/translations";
import { APP_NAME, FONT_SIZE_OPTIONS, LANGUAGE_OPTIONS } from "../../constants";

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
  appVersion: string;
  autoLaunch: boolean;
  autoLaunchSupported: boolean;
  onToggleAutoLaunch: () => void;
  updateStatus: UpdateStatus;
  onCheckForUpdates: () => void;
  onRestartAndInstall: () => void;
  onOpenExternal: (url: string) => void;
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
  appVersion,
  autoLaunch,
  autoLaunchSupported,
  onToggleAutoLaunch,
  updateStatus,
  onCheckForUpdates,
  onRestartAndInstall,
  onOpenExternal,
}: SettingsPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);
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

  const currentOption =
    THEME_OPTIONS.find((opt) => opt.id === currentTheme) || THEME_OPTIONS[0];

  const hasUpdateBadge =
    updateStatus.status === "downloaded" ||
    updateStatus.status === "manual-download";

  const isCheckingOrDownloading =
    updateStatus.status === "checking" ||
    updateStatus.status === "available" ||
    updateStatus.status === "downloading";

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
          {hasUpdateBadge && (
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
            className="absolute right-0 top-full mt-2 z-50 w-76 max-h-[calc(100vh-64px)] overflow-y-auto p-3.5 rounded-2xl settings-popover-panel theme-border-app border shadow-2xl backdrop-blur-2xl"
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

            {updateStatus.status === "downloaded" && (
              <div className="p-2.5 mb-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2">
                <span className="text-[11px] text-emerald-400 font-semibold truncate">
                  {t.controls.updateReady} (v{updateStatus.version})
                </span>
                <button
                  onClick={onRestartAndInstall}
                  className="shrink-0 px-2.5 py-1 rounded-md bg-emerald-500 text-zinc-950 font-bold text-[10px] hover:bg-emerald-400 transition-colors shadow-sm"
                >
                  {t.controls.restartToUpdate}
                </button>
              </div>
            )}

            {updateStatus.status === "manual-download" && (
              <div className="p-2.5 mb-3 rounded-xl theme-accent-subtle border theme-accent-border flex items-center justify-between gap-2">
                <span className="text-[11px] theme-accent-text font-semibold truncate">
                  {t.controls.updateAvailable} (v{updateStatus.version})
                </span>
                <button
                  onClick={() => onOpenExternal(updateStatus.downloadUrl)}
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500 text-zinc-950 font-bold text-[10px] hover:bg-emerald-400 transition-colors shadow-sm"
                >
                  <Download className="w-3 h-3" />
                  <span>{t.controls.downloadUpdate}</span>
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
                  {FONT_SIZE_OPTIONS.map(({ id: size, label }) => {
                    const isActive = fontSize === size;
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
                  {LANGUAGE_OPTIONS.map((opt) => {
                    const isActive = lang === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => onSelectLang(opt.id)}
                        className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-xs font-semibold transition-all ${
                          isActive
                            ? "theme-accent-subtle theme-accent-text theme-accent-border border shadow-sm"
                            : "theme-text-muted hover:theme-text-app"
                        }`}
                      >
                        <span>{opt.flag}</span>
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2.5 border-t theme-border-app space-y-2">
                <label className="text-[10px] uppercase tracking-wider font-semibold theme-text-muted block">
                  {t.controls.system}
                </label>

                <button
                  type="button"
                  onClick={onToggleAutoLaunch}
                  disabled={!autoLaunchSupported}
                  className={`w-full flex items-center justify-between gap-2.5 p-2 rounded-xl theme-bg-app border theme-border-app text-left transition-all ${
                    autoLaunchSupported
                      ? "hover:theme-accent-border cursor-pointer"
                      : "opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <Power className="w-3.5 h-3.5 theme-accent-text mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold theme-text-app leading-tight">
                        {t.controls.autoLaunch}
                      </div>
                      <div className="text-[10px] theme-text-muted leading-snug mt-0.5">
                        {autoLaunchSupported
                          ? t.controls.autoLaunchDesc
                          : t.controls.autoLaunchDevOnly}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`w-8 h-4.5 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
                      autoLaunch
                        ? "bg-emerald-500 justify-end"
                        : "bg-zinc-600/50 justify-start"
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-white shadow-sm block" />
                  </div>
                </button>

                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={
                      updateStatus.status === "downloaded"
                        ? onRestartAndInstall
                        : updateStatus.status === "manual-download"
                          ? () => onOpenExternal(updateStatus.downloadUrl)
                          : onCheckForUpdates
                    }
                    disabled={isCheckingOrDownloading}
                    className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      updateStatus.status === "downloaded"
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25"
                        : "theme-bg-app theme-border-app theme-text-app hover:theme-accent-subtle hover:theme-accent-border disabled:opacity-70"
                    }`}
                  >
                    {updateStatus.status === "manual-download" ? (
                      <Download className="w-3.5 h-3.5 theme-accent-text" />
                    ) : (
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${
                          updateStatus.status === "downloaded"
                            ? "text-emerald-400"
                            : "theme-accent-text"
                        } ${isCheckingOrDownloading ? "animate-spin" : ""}`}
                      />
                    )}
                    <span>
                      {updateStatus.status === "checking"
                        ? t.controls.checkingUpdates
                        : updateStatus.status === "available"
                          ? `${t.controls.downloadingUpdate} v${updateStatus.version}...`
                          : updateStatus.status === "downloading"
                            ? `${t.controls.downloadingUpdate}${
                                updateStatus.version
                                  ? ` v${updateStatus.version}`
                                  : ""
                              } (${updateStatus.percent}%)`
                            : updateStatus.status === "downloaded"
                              ? `${t.controls.restartToUpdate} (v${updateStatus.version})`
                              : updateStatus.status === "manual-download"
                                ? `${t.controls.downloadUpdate} v${updateStatus.version}`
                                : t.controls.checkForUpdates}
                    </span>
                  </button>

                  {updateStatus.status === "downloading" && (
                    <div className="w-full h-1.5 rounded-full theme-bg-app border theme-border-app overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-200"
                        style={{ width: `${Math.min(100, Math.max(4, updateStatus.percent))}%` }}
                      />
                    </div>
                  )}

                  {updateStatus.status === "not-available" && (
                    <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      <span>
                        {t.controls.upToDate} (v{updateStatus.currentVersion})
                      </span>
                    </div>
                  )}

                  {updateStatus.status === "error" && (
                    <div
                      className="flex items-center justify-center gap-1 text-[10px] text-amber-400 font-medium truncate"
                      title={updateStatus.message}
                    >
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span className="truncate">{t.controls.updateError}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2.5 mt-2.5 border-t theme-border-app flex items-center justify-between text-[10px] theme-text-muted font-mono">
              <span>
                {APP_NAME} v{appVersion}
              </span>
              <span className="theme-accent-text font-semibold">
                {t.app.shortcutHint}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
