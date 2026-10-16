import { Copy, Check, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import type { NoteItem, NoteColor } from "../../types/clip";
import { NOTE_COLORS } from "../../constants";
import { translations, type Language } from "../../locales/translations";

interface NoteHeaderProps {
  note: NoteItem;
  copied: boolean;
  onTitleChange: (title: string) => void;
  onColorChange: (color: NoteColor) => void;
  onCopy: () => void;
  onDelete: () => void;
  lang: Language;
}

export const NoteHeader = ({
  note,
  copied,
  onTitleChange,
  onColorChange,
  onCopy,
  onDelete,
  lang,
}: NoteHeaderProps) => {
  const t = translations[lang];

  return (
    <div className="p-3 border-b theme-border-app flex items-center justify-between gap-3 theme-bg-header transition-colors">
      <input
        type="text"
        value={note.title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder={t.notes.titlePlaceholder}
        className="flex-1 bg-transparent text-sm font-semibold theme-text-app focus:outline-none placeholder:theme-text-muted"
      />

      <div className="flex items-center gap-1.5 px-2 py-1 theme-bg-panel rounded-lg border theme-border-app shadow-sm">
        {NOTE_COLORS.map((c) => (
          <button
            key={c.id}
            onClick={() => onColorChange(c.id)}
            className={`w-4 h-4 rounded-full transition-transform ${
              (note.color || "amber") === c.id
                ? "scale-125 ring-2 ring-black/40 dark:ring-white/60 shadow-sm"
                : "opacity-60 hover:opacity-100"
            }`}
            style={{ backgroundColor: c.dot }}
            title={c.name}
          />
        ))}
      </div>

      <div className="flex items-center gap-1">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onCopy}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors border shadow-sm ${
            copied
              ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
              : "theme-bg-panel hover:theme-accent-subtle theme-border-app theme-text-app"
          }`}
          title={t.notes.copyContent}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          <span>{copied ? t.cards.copied : t.notes.copyContent}</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onDelete}
          className="p-1.5 rounded-md theme-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
          title={t.notes.deleteNote}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </div>
  );
};
