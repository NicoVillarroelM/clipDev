import { useState } from "react";
import {
  Code2,
  Link,
  FileText,
  Pin,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Maximize2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ClipItem } from "../types/clip";
import { translations, type Language } from "../locales/translations";

interface ClipCardProps {
  clip: ClipItem;
  onCopy: (content: string) => void;
  onTogglePin: (id: string) => void;
  onDelete: (clip: ClipItem) => void;
  onOpenModal: (clip: ClipItem) => void;
  lang: Language;
}

export const ClipCard = ({
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

  const lines = clip.content.split("\n");
  const isMultiLine = lines.length > 1;
  const isLong = lines.length > 5 || clip.content.length > 250;

  const handleCopy = () => {
    onCopy(clip.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const renderBadge = () => {
    switch (clip.type) {
      case "color":
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-500/10 text-purple-500 border border-purple-500/20">
            <span
              className="w-2.5 h-2.5 rounded-full border border-black/20 dark:border-white/30"
              style={{ backgroundColor: clip.content.trim() }}
            />
            {t.cards.badgeColor}
          </span>
        );
      case "url":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <Link className="w-3 h-3" />
            {t.cards.badgeUrl}
          </span>
        );
      case "code":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium theme-accent-subtle theme-accent-text theme-accent-border border">
            <Code2 className="w-3 h-3" />
            {t.cards.badgeCode}
            {isMultiLine && (
              <span className="ml-1 opacity-75 font-mono text-[10px]">
                ({lines.length} {t.cards.lines})
              </span>
            )}
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium theme-bg-app theme-text-muted border theme-border-app">
            <FileText className="w-3 h-3" />
            {t.cards.badgeText}
            {isMultiLine && (
              <span className="ml-1 opacity-75 font-mono text-[10px]">
                ({lines.length} {t.cards.lines})
              </span>
            )}
          </span>
        );
    }
  };

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
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
  };

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
          {renderBadge()}
          <span
            className="text-[11px] theme-text-muted font-mono"
            title={new Date(clip.createdAt).toLocaleString(
              lang === "es" ? "es-ES" : "en-US",
              { dateStyle: "full", timeStyle: "medium" }
            )}
          >
            {formatDateTime(clip.createdAt)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onOpenModal(clip)}
            className="p-1.5 rounded-md theme-text-muted hover:theme-accent-text hover:theme-accent-subtle transition-colors"
            title={t.cards.fullView}
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
          >
            <Trash2 className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>

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

      {isLong && (
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

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenModal(clip);
            }}
            className="flex items-center gap-1 text-[11px] font-medium theme-text-muted hover:theme-accent-text transition-colors"
            title={t.cards.fullView}
          >
            <Maximize2 className="w-3 h-3" />
            <span>{t.cards.fullView}</span>
          </button>
        </div>
      )}
    </motion.div>
  );
};
