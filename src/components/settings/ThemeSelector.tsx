import { useState, useRef, useEffect } from "react";
import { Palette, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { THEME_OPTIONS, type ThemeId } from "../../types/theme";
import { translations, type Language } from "../../locales/translations";

interface ThemeSelectorProps {
  currentTheme: ThemeId;
  onSelectTheme: (theme: ThemeId) => void;
  lang: Language;
}

export const ThemeSelector = ({
  currentTheme,
  onSelectTheme,
  lang,
}: ThemeSelectorProps) => {
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
    THEME_OPTIONS.find((t) => t.id === currentTheme) || THEME_OPTIONS[0];

  return (
    <div className="relative titlebar-no-drag" ref={containerRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md theme-bg-panel hover:theme-accent-subtle theme-border-app border theme-text-app text-xs transition-colors shadow-sm"
        title={t.controls.palette}
      >
        <Palette className="w-3.5 h-3.5" style={{ color: currentOption.color }} />
        <span
          className="w-2 h-2 rounded-full ring-1 ring-black/20 dark:ring-white/20"
          style={{ backgroundColor: currentOption.color }}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full mt-1.5 z-50 w-48 p-2 rounded-xl theme-bg-panel theme-border-app border shadow-2xl"
          >
            <div className="text-[10px] uppercase tracking-wider font-semibold theme-text-muted px-2 py-1 mb-1">
              {t.controls.palette}
            </div>
            <div className="space-y-1">
              {THEME_OPTIONS.map((theme) => {
                const isActive = theme.id === currentTheme;
                const themeName = t.themes[theme.nameKey];

                return (
                  <button
                    key={theme.id}
                    onClick={() => {
                      onSelectTheme(theme.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors ${
                      isActive
                        ? "theme-accent-subtle theme-accent-text font-semibold theme-accent-border border"
                        : "theme-text-muted hover:theme-text-app hover:bg-zinc-500/10"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full ring-1 ring-black/20 dark:ring-white/20"
                        style={{ backgroundColor: theme.color }}
                      />
                      <span>{themeName}</span>
                    </div>
                    {isActive && (
                      <Check className="w-3.5 h-3.5 theme-accent-text" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
