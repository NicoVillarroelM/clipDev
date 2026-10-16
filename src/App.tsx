import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TitleBar,
  FilterBar,
  ClipCard,
  ClipModal,
  ConfirmDeleteModal,
  ClipSkeleton,
  NotesView,
  ScaleToast,
} from "./components";
import { useAppearance, useClips, useNotes } from "./hooks";
import type { ClipItem, ActiveTab } from "./types/clip";
import { INITIAL_MOUNT_DELAY_MS } from "./constants";

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("clipboard");
  const [modalClip, setModalClip] = useState<ClipItem | null>(null);
  const [clipToDelete, setClipToDelete] = useState<ClipItem | null>(null);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const {
    lang,
    setLang,
    mode,
    handleToggleMode,
    finish,
    handleToggleFinish,
    fontSize,
    setFontSize,
    currentTheme,
    setCurrentTheme,
    showScaleToast,
    t,
  } = useAppearance();

  const { notes, handleSaveNote, handleDeleteNote } = useNotes({
    initialTitle: t.notes.initialTitle,
    initialContent: t.notes.initialContent,
  });

  const {
    clips,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    filteredClips,
    unpinnedCount,
    handleCopy,
    handleTogglePin,
    handleDeleteClip,
    handleConfirmClearUnpinned,
  } = useClips({ imageFilterLabel: t.filters.image });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, INITIAL_MOUNT_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const handleConfirmDelete = () => {
    if (clipToDelete) {
      handleDeleteClip(clipToDelete.id);
      if (modalClip?.id === clipToDelete.id) {
        setModalClip(null);
      }
      setClipToDelete(null);
    }
  };

  const handleConfirmClear = () => {
    handleConfirmClearUnpinned();
    setIsConfirmClearOpen(false);
  };

  const handleOpenConfirmClear = useCallback(() => {
    setIsConfirmClearOpen(true);
  }, []);

  const pinnedCount = clips.filter((c) => c.pinned).length;

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
        onSelectLang={setLang}
        fontSize={fontSize}
        onSelectFontSize={setFontSize}
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
            <FilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              clipsCount={clips.length}
              pinnedCount={pinnedCount}
              unpinnedCount={unpinnedCount}
              onClearUnpinned={handleOpenConfirmClear}
              lang={lang}
            />

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
                      onDelete={setClipToDelete}
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

      <ScaleToast show={showScaleToast} fontSize={fontSize} lang={lang} />

      <ClipModal
        clip={modalClip}
        onClose={() => setModalClip(null)}
        onCopy={handleCopy}
        onTogglePin={handleTogglePin}
        onDelete={setClipToDelete}
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
            handleConfirmClear();
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
