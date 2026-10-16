import { useEffect } from "react";
import { Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ClipItem } from "../../types/clip";
import { translations, type Language } from "../../locales/translations";

interface ConfirmDeleteModalProps {
  clip: ClipItem | null;
  isOpenClearAll?: boolean;
  unpinnedCount?: number;
  onClose: () => void;
  onConfirm: () => void;
  lang: Language;
}

export const ConfirmDeleteModal = ({
  clip,
  isOpenClearAll = false,
  unpinnedCount = 0,
  onClose,
  onConfirm,
  lang,
}: ConfirmDeleteModalProps) => {
  const t = translations[lang];
  const isOpen = Boolean(clip || isOpenClearAll);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="confirm-delete-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none"
        >
          <motion.div
            key="confirm-delete-card"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md flex flex-col theme-bg-panel border theme-border-app rounded-2xl shadow-2xl overflow-hidden p-5"
          >
            <button
              onClick={onClose}
              className="absolute right-3.5 top-3.5 p-1 rounded-lg hover:bg-zinc-500/10 theme-text-muted hover:theme-text-app transition-colors"
              title={t.confirmDelete.cancel}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center text-red-500 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1 pr-6">
                <h3 className="text-sm font-semibold theme-text-app">
                  {isOpenClearAll ? t.confirmClear.title : t.confirmDelete.title}
                </h3>
                <p className="text-xs theme-text-muted mt-1 leading-relaxed">
                  {isOpenClearAll ? t.confirmClear.message : t.confirmDelete.message}
                </p>
              </div>
            </div>

            {isOpenClearAll ? (
              <div className="mt-4 p-3.5 rounded-lg theme-bg-input border theme-border-app flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="theme-text-app font-medium">
                    {unpinnedCount} {t.confirmClear.warning}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  ✓ {t.confirmClear.pinnedSafe}
                </span>
              </div>
            ) : clip ? (
              <div className="mt-4 p-3 rounded-lg theme-bg-input border theme-border-app overflow-hidden">
                <div className="flex items-center justify-between text-[10px] theme-text-muted font-mono mb-1.5 pb-1 border-b theme-border-app">
                  <span className="uppercase font-semibold opacity-75">{clip.type}</span>
                  <span>
                    {new Date(clip.createdAt).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                    })} · {new Date(clip.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="font-mono text-xs theme-text-muted line-clamp-3 whitespace-pre-wrap break-words select-text">
                  {clip.content}
                </p>
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium theme-bg-app border theme-border-app theme-text-app hover:bg-zinc-500/10 transition-colors shadow-sm"
              >
                {t.confirmDelete.cancel}
              </button>

              <button
                type="button"
                onClick={onConfirm}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-red-500 hover:bg-red-600 text-white transition-colors shadow-sm shadow-red-500/20 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isOpenClearAll ? t.confirmClear.confirm : t.confirmDelete.confirm}</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
