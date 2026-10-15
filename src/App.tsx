import { useState, useEffect, useMemo, useRef } from "react";
import { Search, X, Trash2, Pin, Code2, Link, Palette, Layers, Type } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TitleBar } from "./components/TitleBar";
import { ClipCard } from "./components/ClipCard";
import { ClipModal } from "./components/ClipModal";
import { ConfirmDeleteModal } from "./components/ConfirmDeleteModal";
import { ClipSkeleton } from "./components/ClipSkeleton";
import { NotesView } from "./components/NotesView";
import { detectContentType } from "./utils/detector";
import type { ClipItem, NoteItem, ActiveTab, FilterType } from "./types/clip";
import type { ThemeId, ThemeMode, FontSize, AppFinish } from "./types/theme";
import { translations, type Language } from "./locales/translations";

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("clipboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [modalClip, setModalClip] = useState<ClipItem | null>(null);
  const [clipToDelete, setClipToDelete] = useState<ClipItem | null>(null);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showScaleToast, setShowScaleToast] = useState(false);
  const isInitialMount = useRef(true);

  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem("clipdev_lang");
      return (saved as Language) || "es";
    } catch {
      return "es";
    }
  });

  const [mode, setMode] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem("clipdev_mode");
      return (saved as ThemeMode) || "dark";
    } catch {
      return "dark";
    }
  });

  const [finish, setFinish] = useState<AppFinish>(() => {
    try {
      const saved = localStorage.getItem("clipdev_finish");
      return (saved as AppFinish) || "solid";
    } catch {
      return "solid";
    }
  });

  const [fontSize, setFontSize] = useState<FontSize>(() => {
    try {
      const saved = localStorage.getItem("clipdev_fontsize");
      return (saved as FontSize) || "normal";
    } catch {
      return "normal";
    }
  });

  const [currentTheme, setCurrentTheme] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem("clipdev_theme");
      return (saved as ThemeId) || "amber";
    } catch {
      return "amber";
    }
  });

  const t = translations[lang];

  const [clips, setClips] = useState<ClipItem[]>(() => {
    try {
      const saved = localStorage.getItem("clipdev_clips");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [notes, setNotes] = useState<NoteItem[]>(() => {
    try {
      const saved = localStorage.getItem("clipdev_notes");
      if (saved) return JSON.parse(saved);
      return [
        {
          id: "welcome-note",
          title: t.notes.initialTitle,
          content: t.notes.initialContent,
          color: "amber",
          updatedAt: Date.now(),
        },
      ];
    } catch {
      return [
        {
          id: "welcome-note",
          title: t.notes.initialTitle,
          content: t.notes.initialContent,
          color: "amber",
          updatedAt: Date.now(),
        },
      ];
    }
  });

  useEffect(() => {
    localStorage.setItem("clipdev_lang", lang);
  }, [lang]);

  useEffect(() => {
    document.documentElement.setAttribute("data-mode", mode);
    localStorage.setItem("clipdev_mode", mode);
  }, [mode]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", currentTheme);
    localStorage.setItem("clipdev_theme", currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-finish", finish);
    localStorage.setItem("clipdev_finish", finish);
    if (window.electronAPI?.setBackgroundMaterial) {
      window.electronAPI.setBackgroundMaterial(finish === "glass" ? "acrylic" : "none");
    }
  }, [finish]);

  useEffect(() => {
    const factor = fontSize === "xlarge" ? 1.25 : fontSize === "large" ? 1.12 : 1.0;
    if (window.electronAPI?.setZoomFactor) {
      window.electronAPI.setZoomFactor(factor);
    } else {
      (document.documentElement.style as unknown as { zoom: string | number }).zoom = factor;
    }
    document.documentElement.setAttribute("data-font-size", fontSize);
    localStorage.setItem("clipdev_fontsize", fontSize);
  }, [fontSize]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setShowScaleToast(true);
    const timer = setTimeout(() => {
      setShowScaleToast(false);
    }, 1300);
    return () => clearTimeout(timer);
  }, [fontSize]);

  useEffect(() => {
    if (window.electronAPI?.loadStorageFromDisk) {
      window.electronAPI.loadStorageFromDisk().then((data) => {
        if (data.clips && data.clips.length > 0) {
          setClips((prev) => (prev.length === 0 ? data.clips! : prev));
        }
        if (data.notes && data.notes.length > 0) {
          setNotes((prev) => (prev.length <= 1 ? data.notes! : prev));
        }
      });
    }
  }, []);

  useEffect(() => {
    const json = JSON.stringify(clips);
    localStorage.setItem("clipdev_clips", json);
    window.electronAPI?.saveClipsToDisk?.(json);
  }, [clips]);

  useEffect(() => {
    const json = JSON.stringify(notes);
    localStorage.setItem("clipdev_notes", json);
    window.electronAPI?.saveNotesToDisk?.(json);
  }, [notes]);

  useEffect(() => {
    if (!window.electronAPI) {
      console.warn("window.electronAPI no está disponible.");
      return;
    }

    const addClip = (newText: string) => {
      const trimmed = newText.trim();
      if (!trimmed) return;

      setClips((prev) => {
        const existingIndex = prev.findIndex((c) => c.content === trimmed);
        const type = detectContentType(trimmed);

        if (existingIndex !== -1) {
          const item = prev[existingIndex];
          const updated = { ...item, createdAt: Date.now() };
          const rest = prev.filter((_, i) => i !== existingIndex);
          return [updated, ...rest];
        }

        const newClip: ClipItem = {
          id: crypto.randomUUID(),
          content: trimmed,
          type,
          pinned: false,
          createdAt: Date.now(),
        };

        return [newClip, ...prev].slice(0, 150);
      });
    };

    window.electronAPI.getCurrentClipboard().then((text) => {
      if (text) addClip(text);
    });

    const cleanup = window.electronAPI.onClipboardUpdate((newText) => {
      addClip(newText);
    });

    return () => cleanup();
  }, []);

  const handleCopy = (text: string) => {
    if (window.electronAPI) {
      window.electronAPI.writeClipboard(text);
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  const handleTogglePin = (id: string) => {
    setClips((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
    );
    setModalClip((prev) =>
      prev && prev.id === id ? { ...prev, pinned: !prev.pinned } : prev
    );
  };

  const handleDeleteClip = (id: string) => {
    setClips((prev) => prev.filter((c) => c.id !== id));
  };

  const handleRequestDelete = (clip: ClipItem) => {
    setClipToDelete(clip);
  };

  const handleConfirmDelete = () => {
    if (clipToDelete) {
      handleDeleteClip(clipToDelete.id);
      if (modalClip?.id === clipToDelete.id) {
        setModalClip(null);
      }
      setClipToDelete(null);
    }
  };

  const handleConfirmClearUnpinned = () => {
    setClips((prev) => prev.filter((c) => c.pinned));
    setIsConfirmClearOpen(false);
  };

  const handleSaveNote = (updatedNote: NoteItem) => {
    setNotes((prev) => {
      const exists = prev.some((n) => n.id === updatedNote.id);
      if (exists) {
        return prev.map((n) => (n.id === updatedNote.id ? updatedNote : n));
      }
      return [updatedNote, ...prev];
    });
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleToggleMode = () => {
    setMode((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleToggleLang = () => {
    setLang((prev) => (prev === "es" ? "en" : "es"));
  };

  const handleCycleFontSize = () => {
    setFontSize((prev) => {
      if (prev === "normal") return "large";
      if (prev === "large") return "xlarge";
      return "normal";
    });
  };

  const handleToggleFinish = () => {
    setFinish((prev) => (prev === "solid" ? "glass" : "solid"));
  };

  const filteredClips = useMemo(() => {
    return clips.filter((clip) => {
      if (activeFilter === "pinned" && !clip.pinned) return false;
      if (activeFilter === "code" && clip.type !== "code") return false;
      if (activeFilter === "url" && clip.type !== "url") return false;
      if (activeFilter === "color" && clip.type !== "color") return false;

      if (searchQuery.trim() !== "") {
        return clip.content
          .toLowerCase()
          .includes(searchQuery.toLowerCase().trim());
      }

      return true;
    });
  }, [clips, activeFilter, searchQuery]);

  const unpinnedCount = useMemo(() => clips.filter((c) => !c.pinned).length, [clips]);

  return (
    <div
      data-theme={currentTheme}
      data-mode={mode}
      data-font-size={fontSize}
      data-finish={finish}
      className="flex flex-col h-screen w-screen theme-bg-app theme-text-app overflow-hidden font-sans select-none transition-colors duration-200"
    >
      <TitleBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        clipsCount={clips.length}
        notesCount={notes.length}
        currentTheme={currentTheme}
        onSelectTheme={setCurrentTheme}
        mode={mode}
        onToggleMode={handleToggleMode}
        lang={lang}
        onToggleLang={handleToggleLang}
        fontSize={fontSize}
        onCycleFontSize={handleCycleFontSize}
        finish={finish}
        onToggleFinish={handleToggleFinish}
      />

      <motion.div
        key={`content-scale-${fontSize}`}
        initial={{ opacity: 0.9, scale: 0.996 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="flex-1 flex flex-col overflow-hidden relative"
      >
        {activeTab === "clipboard" ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-3 border-b theme-border-app theme-bg-panel flex flex-col gap-2.5 transition-colors">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 theme-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.search.placeholder}
                  className="w-full theme-bg-app border theme-border-app focus:theme-accent-border pl-9 pr-8 py-1.5 rounded-lg text-xs theme-text-app placeholder:theme-text-muted focus:outline-none transition-colors shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 theme-text-muted hover:theme-text-app"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 text-xs pb-0.5">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <button
                    onClick={() => setActiveFilter("all")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors shadow-sm ${
                      activeFilter === "all"
                        ? "theme-accent-subtle theme-accent-text theme-accent-border border font-medium"
                        : "theme-bg-app theme-text-muted hover:theme-text-app border theme-border-app"
                    }`}
                  >
                    <Layers className="w-3 h-3 theme-accent-text" />
                    <span>{t.filters.all}</span>
                    <span className="text-[10px] opacity-60">({clips.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveFilter("pinned")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors shadow-sm ${
                      activeFilter === "pinned"
                        ? "theme-accent-subtle theme-accent-text theme-accent-border border font-medium"
                        : "theme-bg-app theme-text-muted hover:theme-text-app border theme-border-app"
                    }`}
                  >
                    <Pin className="w-3 h-3 theme-accent-text" />
                    <span>{t.filters.pinned}</span>
                    <span className="text-[10px] opacity-60">
                      ({clips.filter((c) => c.pinned).length})
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveFilter("code")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors shadow-sm ${
                      activeFilter === "code"
                        ? "theme-accent-subtle theme-accent-text theme-accent-border border font-medium"
                        : "theme-bg-app theme-text-muted hover:theme-text-app border theme-border-app"
                    }`}
                  >
                    <Code2 className="w-3 h-3 text-emerald-500" />
                    <span>{t.filters.code}</span>
                  </button>

                  <button
                    onClick={() => setActiveFilter("url")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors shadow-sm ${
                      activeFilter === "url"
                        ? "theme-accent-subtle theme-accent-text theme-accent-border border font-medium"
                        : "theme-bg-app theme-text-muted hover:theme-text-app border theme-border-app"
                    }`}
                  >
                    <Link className="w-3 h-3 text-blue-500" />
                    <span>{t.filters.url}</span>
                  </button>

                  <button
                    onClick={() => setActiveFilter("color")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors shadow-sm ${
                      activeFilter === "color"
                        ? "theme-accent-subtle theme-accent-text theme-accent-border border font-medium"
                        : "theme-bg-app theme-text-muted hover:theme-text-app border theme-border-app"
                    }`}
                  >
                    <Palette className="w-3 h-3 text-purple-500" />
                    <span>{t.filters.color}</span>
                  </button>
                </div>

                {unpinnedCount > 0 && (
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={() => setIsConfirmClearOpen(true)}
                    className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-zinc-400 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors shadow-sm"
                    title={t.search.clearTooltip}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500/70" />
                    <span>{t.search.clearHistory}</span>
                  </motion.button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {isLoading ? (
                <ClipSkeleton count={4} />
              ) : filteredClips.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 theme-text-muted">
                  <Search className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-xs font-medium">
                    {searchQuery
                      ? t.cards.noResults.replace("{{query}}", searchQuery)
                      : t.cards.emptyTitle}
                  </p>
                  <p className="text-[11px] opacity-75 mt-1 max-w-xs">
                    {t.cards.emptyDesc}
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {filteredClips.map((clip) => (
                    <ClipCard
                      key={clip.id}
                      clip={clip}
                      onCopy={handleCopy}
                      onTogglePin={handleTogglePin}
                      onDelete={handleRequestDelete}
                      onOpenModal={setModalClip}
                      lang={lang}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        ) : (
          <NotesView
            notes={notes}
            onSaveNote={handleSaveNote}
            onDeleteNote={handleDeleteNote}
            onCopyContent={handleCopy}
            lang={lang}
          />
        )}
      </motion.div>

      <AnimatePresence>
        {showScaleToast && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex items-center gap-2 px-4 py-2 rounded-full theme-bg-panel border theme-accent-border shadow-2xl backdrop-blur-md text-xs font-semibold theme-accent-text"
          >
            <Type className="w-3.5 h-3.5" />
            <span>
              {t.controls.scaleToast}:{" "}
              {fontSize === "xlarge"
                ? t.controls.fontXLarge
                : fontSize === "large"
                ? t.controls.fontLarge
                : t.controls.fontNormal}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <ClipModal
        clip={modalClip}
        onClose={() => setModalClip(null)}
        onCopy={handleCopy}
        onTogglePin={handleTogglePin}
        onDelete={handleRequestDelete}
        lang={lang}
      />

      <ConfirmDeleteModal
        clip={clipToDelete}
        isOpenClearAll={isConfirmClearOpen}
        unpinnedCount={unpinnedCount}
        onClose={() => {
          setClipToDelete(null);
          setIsConfirmClearOpen(false);
        }}
        onConfirm={() => {
          if (isConfirmClearOpen) {
            handleConfirmClearUnpinned();
          } else {
            handleConfirmDelete();
          }
        }}
        lang={lang}
      />
    </div>
  );
}

export default App;
