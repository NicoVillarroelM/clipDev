import { useState, useMemo, memo } from "react";
import {
  Pin,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Maximize2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ClipItem } from "../../types/clip";
import { translations, type Language } from "../../locales/translations";
import { ClipBadge } from "./ClipBadge";
import { FEEDBACK_TIMEOUT_MS } from "../../constants";

interface ClipCardProps {
  clip: ClipItem;
  onCopy: (content: string) => void;
  onTogglePin: (id: string) => void;
  onDelete: (clip: ClipItem) => void;
  onOpenModal: (clip: ClipItem) => void;
  lang: Language;
}

export const ClipCard = memo(({
  clip,
  onCopy,
  onTogglePin,
  onDelete,
  onOpenModal,
  lang,
}: ClipCardProps) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const t = translations[lang];

  const lines = clip.type === "image" ? [] : clip.content.split("\n");
  const isLong = clip.type !== "image" && (lines.length > 5 || clip.content.length > 250);

  const handleCopy = () => {
    onCopy(clip.content);
    setCopied(true);
    setTimeout(() => setCopied(false), FEEDBACK_TIMEOUT_MS);
  };

  const formattedDate = useMemo(() => {
    const date = new Date(clip.createdAt);
    const dateStr = date.toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
    const timeStr = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${dateStr} · ${timeStr}`;
  }, [clip.createdAt, lang]);

  const fullDateTime = useMemo(() => {
    return new Date(clip.createdAt).toLocaleString(
      lang === "es" ? "es-ES" : "en-US",
      { dateStyle: "full", timeStyle: "medium" }
    );
  }, [clip.createdAt, lang]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      className={`group relative flex flex-col p-3 rounded-xl border transition-colors duration-200 shadow-sm ${
        clip.pinned
          ? "theme-accent-subtle theme-accent-border shadow-md"
          : "theme-bg-card theme-border-app hover:theme-accent-border"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <ClipBadge clip={clip} lang={lang} size="sm" showDetails={true} />
          <span
            className="text-[11px] theme-text-muted font-mono"
            title={fullDateTime}
          >
            {formattedDate}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onOpenModal(clip)}
            className="p-1.5 rounded-md theme-text-muted hover:theme-accent-text hover:theme-accent-subtle transition-colors"
            title={t.cards.fullView}
            aria-label={t.cards.fullView}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onTogglePin(clip.id)}
            className={`p-1.5 rounded-md transition-colors ${
              clip.pinned
                ? "theme-accent-text theme-accent-subtle"
                : "theme-text-muted hover:theme-text-app hover:bg-zinc-500/10"
            }`}
            title={clip.pinned ? t.cards.unpin : t.cards.pin}
            aria-label={clip.pinned ? t.cards.unpin : t.cards.pin}
          >
            <Pin className={`w-3.5 h-3.5 ${clip.pinned ? "fill-current" : ""}`} />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleCopy}
            className={`p-1.5 rounded-md transition-colors ${
              copied
                ? "bg-emerald-500/20 text-emerald-500"
                : "theme-text-muted hover:theme-text-app hover:bg-zinc-500/10"
            }`}
            title={t.cards.copyAgain}
            aria-label={t.cards.copyAgain}
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                >
                  <Check className="w-3.5 h-3.5" />
                </motion.div>
              ) : (
                <motion.div
                  key="copy"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                >
                  <Copy className="w-3.5 h-3.5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete(clip)}
            className="p-1.5 rounded-md theme-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
            title={t.cards.delete}
            aria-label={t.cards.delete}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>

      {clip.type === "image" ? (
        <div
          onClick={handleCopy}
          className="relative cursor-pointer rounded-lg border theme-border-app hover:theme-accent-border transition-all overflow-hidden theme-bg-input p-2 flex items-center justify-center group/img"
        >
          <img
            src={clip.content}
            alt="Clipboard thumbnail"
            className="max-h-52 max-w-full rounded object-contain select-none shadow-sm"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors pointer-events-none" />
        </div>
      ) : (
        <div
          onClick={() => {
            const selection = window.getSelection();
            if (selection && selection.toString().length > 0) return;
            handleCopy();
          }}
          className={`relative cursor-pointer font-mono theme-code-size theme-text-app select-text theme-bg-input p-3 rounded-lg border theme-border-app hover:theme-accent-border transition-[max-height] duration-300 ease-in-out shadow-inner ${
            isLong && !expanded
              ? "max-h-32 overflow-hidden"
              : "max-h-80 overflow-y-auto overflow-x-auto"
          }`}
        >
          <pre className="font-mono theme-code-size whitespace-pre-wrap break-words leading-relaxed select-text m-0 p-0 font-normal">
            {clip.content}
          </pre>

          {isLong && !expanded && (
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[var(--bg-input)] to-transparent pointer-events-none" />
          )}
        </div>
      )}

      {clip.type !== "image" && isLong && (
        <div className="flex items-center gap-3 mt-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="flex items-center gap-1 text-[11px] font-medium theme-accent-text hover:underline transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                <span>{t.cards.showLess}</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                <span>{t.cards.showMore}</span>
              </>
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
});
