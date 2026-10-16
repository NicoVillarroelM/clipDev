import { useEffect, useState } from "react";
import {
  X,
  Copy,
  Check,
  Pin,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ClipItem } from "../../types/clip";
import { translations, type Language } from "../../locales/translations";
import { ClipBadge } from "./ClipBadge";
import { FEEDBACK_TIMEOUT_MS } from "../../constants";

interface ClipModalProps {
  clip: ClipItem | null;
  onClose: () => void;
  onCopy: (content: string) => void;
  onTogglePin: (id: string) => void;
  onDelete?: (clip: ClipItem) => void;
  lang: Language;
}

export const ClipModal = ({
  clip,
  onClose,
  onCopy,
  onTogglePin,
  onDelete,
  lang,
}: ClipModalProps) => {
  const [copied, setCopied] = useState(false);
  const t = translations[lang];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (clip) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clip, onClose]);

  const handleCopy = () => {
    if (!clip) return;
    onCopy(clip.content);
    setCopied(true);
    setTimeout(() => setCopied(false), FEEDBACK_TIMEOUT_MS);
  };

  return (
    <AnimatePresence>
      {clip && (
        <motion.div
          key="clip-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none"
        >
          <motion.div
            key="clip-modal-card"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl max-h-[88vh] flex flex-col theme-bg-panel border theme-border-app rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b theme-border-app theme-bg-header">
              <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                <ClipBadge clip={clip} lang={lang} size="md" showDetails={false} />
                {clip.type === "image" ? (
                  <>
                    {clip.imageWidth && clip.imageHeight && (
                      <span className="text-xs theme-text-muted font-mono">
                        {clip.imageWidth} × {clip.imageHeight} px
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="text-xs theme-text-muted font-mono">
                      {clip.content.split("\n").length} {t.cards.lines}
                    </span>
                    <span className="text-xs theme-text-muted font-mono opacity-60">·</span>
                    <span className="text-xs theme-text-muted font-mono">
                      {clip.content.length.toLocaleString()} {t.cards.chars}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onTogglePin(clip.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    clip.pinned
                      ? "theme-accent-subtle theme-accent-text theme-accent-border"
                      : "theme-bg-app theme-text-muted hover:theme-text-app theme-border-app"
                  }`}
                  title={clip.pinned ? t.cards.unpin : t.cards.pin}
                >
                  <Pin className={`w-3.5 h-3.5 ${clip.pinned ? "fill-current" : ""}`} />
                  <span className="hidden sm:inline">
                    {clip.pinned ? t.cards.unpin : t.cards.pin}
                  </span>
                </button>

                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border shadow-sm ${
                    copied
                      ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30 font-semibold"
                      : "theme-bg-app hover:theme-accent-subtle theme-border-app theme-text-app"
                  }`}
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copied ? t.cards.copied : t.cards.copyAgain}</span>
                </button>

                {onDelete && (
                  <button
                    onClick={() => onDelete(clip)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-500 theme-text-muted transition-colors"
                    title={t.cards.delete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-500 theme-text-muted transition-colors ml-1"
                  title={t.controls.close}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto overflow-x-auto theme-bg-input flex items-center justify-center">
              {clip.type === "image" ? (
                <img
                  src={clip.content}
                  alt="Clipboard full resolution"
                  className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg select-none"
                />
              ) : (
                <pre className="font-mono theme-code-size whitespace-pre-wrap break-words leading-relaxed select-text theme-text-app m-0 p-0 font-normal w-full">
                  {clip.content}
                </pre>
              )}
            </div>

            <div className="px-4 py-2 border-t theme-border-app theme-bg-header flex items-center justify-between text-[11px] theme-text-muted">
              <span>{t.cards.modalHint}</span>
              <span className="font-mono">
                {new Date(clip.createdAt).toLocaleString([], {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
