import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import type { NoteItem, NoteColor } from "../../types/clip";
import { NOTE_COLORS } from "../../constants";
import { translations, type Language } from "../../locales/translations";

interface NoteSidebarProps {
  notes: NoteItem[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  lang: Language;
}

export const NoteSidebar = ({
  notes,
  selectedNoteId,
  onSelectNote,
  onCreateNote,
  lang,
}: NoteSidebarProps) => {
  const t = translations[lang];

  const getColorConfig = (color?: NoteColor) => {
    return NOTE_COLORS.find((c) => c.id === color) || NOTE_COLORS[0];
  };

  return (
    <div className="w-56 border-r theme-border-app theme-bg-panel flex flex-col transition-colors">
      <div className="p-3 border-b theme-border-app flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider theme-text-muted">
          {t.notes.myNotes}
        </span>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onCreateNote}
          className="flex items-center gap-1 px-2 py-1 theme-accent-subtle theme-accent-text text-xs font-medium rounded-md transition-colors theme-accent-border border shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t.notes.newNote}</span>
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {notes.length === 0 ? (
          <div className="text-center py-8 theme-text-muted text-xs px-3">
            {t.notes.emptySidebar}
          </div>
        ) : (
          notes.map((note) => {
            const colorConfig = getColorConfig(note.color);
            const isSelected = selectedNoteId === note.id;

            return (
              <button
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className={`w-full text-left p-2.5 rounded-lg transition-all flex items-center gap-2 border ${
                  isSelected
                    ? `${colorConfig.bg} ${colorConfig.border} theme-text-app shadow-sm font-medium`
                    : "border-transparent theme-text-muted hover:theme-text-app hover:bg-zinc-500/10"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: colorConfig.dot }}
                />
                <span className="text-xs truncate flex-1">
                  {note.title || t.notes.untitled}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
