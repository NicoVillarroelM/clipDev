import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Trash2,
  Copy,
  Check,
  StickyNote,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Code,
  Quote,
  Highlighter,
  RemoveFormatting,
  Undo,
  Redo,
  HardDrive,
} from "lucide-react";
import { motion } from "framer-motion";
import type { NoteItem, NoteColor } from "../types/clip";
import { translations, type Language } from "../locales/translations";

interface NotesViewProps {
  notes: NoteItem[];
  onSaveNote: (note: NoteItem) => void;
  onDeleteNote: (id: string) => void;
  onCopyContent: (content: string) => void;
  lang: Language;
}

const NOTE_COLORS: { id: NoteColor; name: string; bg: string; dot: string; border: string }[] = [
  { id: "amber", name: "Ámbar", bg: "bg-amber-500/10", dot: "#f59e0b", border: "border-amber-500/40" },
  { id: "emerald", name: "Esmeralda", bg: "bg-emerald-500/10", dot: "#10b981", border: "border-emerald-500/40" },
  { id: "blue", name: "Azul", bg: "bg-blue-500/10", dot: "#3b82f6", border: "border-blue-500/40" },
  { id: "purple", name: "Púrpura", bg: "bg-purple-500/10", dot: "#a855f7", border: "border-purple-500/40" },
  { id: "rose", name: "Rosa", bg: "bg-rose-500/10", dot: "#f43f5e", border: "border-rose-500/40" },
  { id: "zinc", name: "Neutro", bg: "bg-zinc-500/10", dot: "#71717a", border: "border-zinc-500/40" },
];

export const NotesView = ({
  notes,
  onSaveNote,
  onDeleteNote,
  onCopyContent,
  lang,
}: NotesViewProps) => {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(
    notes[0]?.id || null
  );
  const [copied, setCopied] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const t = translations[lang];

  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  useEffect(() => {
    if (editorRef.current) {
      if (selectedNote) {
        const content = selectedNote.content || "";
        const isHtml = /<[a-z][\s\S]*>/i.test(content);
        editorRef.current.innerHTML = isHtml
          ? content
          : content.replace(/\n/g, "<br>");
      } else {
        editorRef.current.innerHTML = "";
      }
    }
  }, [selectedNoteId]);

  const handleCreateNote = () => {
    const newNote: NoteItem = {
      id: crypto.randomUUID(),
      title: lang === "es" ? "Nueva Nota" : "New Note",
      content: "",
      color: "amber",
      updatedAt: Date.now(),
    };
    onSaveNote(newNote);
    setSelectedNoteId(newNote.id);
  };

  const handleTitleChange = (title: string) => {
    if (!selectedNote) return;
    onSaveNote({ ...selectedNote, title, updatedAt: Date.now() });
  };

  const handleEditorInput = () => {
    if (!editorRef.current || !selectedNote) return;
    onSaveNote({
      ...selectedNote,
      content: editorRef.current.innerHTML,
      updatedAt: Date.now(),
    });
  };

  const handleColorChange = (color: NoteColor) => {
    if (!selectedNote) return;
    onSaveNote({ ...selectedNote, color, updatedAt: Date.now() });
  };

  const handleCopy = () => {
    if (!selectedNote || !editorRef.current) return;
    const text = editorRef.current.innerText || selectedNote.content;
    onCopyContent(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const formatText = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    handleEditorInput();
  };

  const setBlockFormat = (tag: string) => {
    document.execCommand("formatBlock", false, `<${tag}>`);
    handleEditorInput();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");

    if (!html && text) {
      e.preventDefault();
      const escaped = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>");
      document.execCommand("insertHTML", false, escaped);
      handleEditorInput();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      document.execCommand("insertText", false, "    ");
    }
  };

  const getColorConfig = (color?: NoteColor) => {
    return NOTE_COLORS.find((c) => c.id === color) || NOTE_COLORS[0];
  };

  const textContent = editorRef.current?.innerText || selectedNote?.content || "";
  const wordsCount = textContent.trim() ? textContent.trim().split(/\s+/).length : 0;
  const charsCount = textContent.length;

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="w-56 border-r theme-border-app theme-bg-panel flex flex-col transition-colors">
        <div className="p-3 border-b theme-border-app flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider theme-text-muted">
            {t.notes.myNotes}
          </span>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleCreateNote}
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
                  onClick={() => setSelectedNoteId(note.id)}
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

      <div className="flex-1 flex flex-col theme-bg-app transition-colors overflow-hidden">
        {selectedNote ? (
          <>
            <div className="p-3 border-b theme-border-app flex items-center justify-between gap-3 theme-bg-header transition-colors">
              <input
                type="text"
                value={selectedNote.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder={t.notes.titlePlaceholder}
                className="flex-1 bg-transparent text-sm font-semibold theme-text-app focus:outline-none placeholder:theme-text-muted"
              />

              <div className="flex items-center gap-1.5 px-2 py-1 theme-bg-panel rounded-lg border theme-border-app shadow-sm">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleColorChange(c.id)}
                    className={`w-4 h-4 rounded-full transition-transform ${
                      (selectedNote.color || "amber") === c.id
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
                  onClick={handleCopy}
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
                  onClick={() => {
                    onDeleteNote(selectedNote.id);
                    setSelectedNoteId(notes.find((n) => n.id !== selectedNote.id)?.id || null);
                  }}
                  className="p-1.5 rounded-md theme-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  title={t.notes.deleteNote}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </div>

            <div className="px-3 py-1.5 border-b theme-border-app theme-bg-panel flex items-center gap-1 flex-wrap text-xs select-none">
              <div className="flex items-center gap-0.5 pr-1.5 border-r theme-border-app">
                <button
                  type="button"
                  onClick={() => setBlockFormat("h1")}
                  className="p-1 rounded hover:theme-accent-subtle hover:theme-accent-text theme-text-muted font-bold text-xs"
                  title={t.notes.h1}
                >
                  H1
                </button>
                <button
                  type="button"
                  onClick={() => setBlockFormat("h2")}
                  className="p-1 rounded hover:theme-accent-subtle hover:theme-accent-text theme-text-muted font-bold text-xs"
                  title={t.notes.h2}
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() => setBlockFormat("p")}
                  className="p-1 rounded hover:theme-accent-subtle hover:theme-accent-text theme-text-muted font-medium text-xs"
                  title={t.notes.paragraph}
                >
                  P
                </button>
              </div>

              <div className="flex items-center gap-0.5 px-1.5 border-r theme-border-app">
                <button
                  type="button"
                  onClick={() => formatText("bold")}
                  className="p-1.5 rounded hover:theme-accent-subtle hover:theme-accent-text theme-text-muted"
                  title={t.notes.bold}
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => formatText("italic")}
                  className="p-1.5 rounded hover:theme-accent-subtle hover:theme-accent-text theme-text-muted"
                  title={t.notes.italic}
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => formatText("underline")}
                  className="p-1.5 rounded hover:theme-accent-subtle hover:theme-accent-text theme-text-muted"
                  title={t.notes.underline}
                >
                  <UnderlineIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => formatText("strikeThrough")}
                  className="p-1.5 rounded hover:theme-accent-subtle hover:theme-accent-text theme-text-muted"
                  title={t.notes.strikethrough}
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => formatText("hiliteColor", "rgba(245, 158, 11, 0.25)")}
                  className="p-1.5 rounded hover:theme-accent-subtle hover:theme-accent-text theme-text-muted"
                  title={t.notes.highlight}
                >
                  <Highlighter className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-0.5 px-1.5 border-r theme-border-app">
                <button
                  type="button"
                  onClick={() => formatText("insertUnorderedList")}
                  className="p-1.5 rounded hover:theme-accent-subtle hover:theme-accent-text theme-text-muted"
                  title={t.notes.bulletList}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => formatText("insertOrderedList")}
                  className="p-1.5 rounded hover:theme-accent-subtle hover:theme-accent-text theme-text-muted"
                  title={t.notes.numberedList}
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setBlockFormat("pre")}
                  className="p-1.5 rounded hover:theme-accent-subtle hover:theme-accent-text theme-text-muted"
                  title={t.notes.codeBlock}
                >
                  <Code className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setBlockFormat("blockquote")}
                  className="p-1.5 rounded hover:theme-accent-subtle hover:theme-accent-text theme-text-muted"
                  title={t.notes.quote}
                >
                  <Quote className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-0.5 pl-1.5">
                <button
                  type="button"
                  onClick={() => formatText("undo")}
                  className="p-1.5 rounded hover:theme-accent-subtle hover:theme-accent-text theme-text-muted"
                  title={t.notes.undo}
                >
                  <Undo className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => formatText("redo")}
                  className="p-1.5 rounded hover:theme-accent-subtle hover:theme-accent-text theme-text-muted"
                  title={t.notes.redo}
                >
                  <Redo className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => formatText("removeFormat")}
                  className="p-1.5 rounded hover:theme-accent-subtle hover:theme-accent-text theme-text-muted"
                  title={t.notes.clearFormat}
                >
                  <RemoveFormatting className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 theme-bg-app">
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleEditorInput}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                data-placeholder={t.notes.contentPlaceholder}
                className="note-editor-content min-h-full w-full theme-text-app text-sm leading-relaxed select-text"
              />
            </div>

            <div className="px-4 py-1.5 border-t theme-border-app theme-bg-header flex items-center justify-between text-[11px] theme-text-muted select-none">
              <div className="flex items-center gap-1.5 font-mono">
                <HardDrive className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-500/90 font-medium">
                  {lang === "es" ? "Guardado automático en disco" : "Auto-saved to disk"}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono opacity-75">
                <span>{wordsCount} {lang === "es" ? "palabras" : "words"}</span>
                <span>·</span>
                <span>{charsCount} {t.cards.chars}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center theme-text-muted text-xs">
            <StickyNote className="w-8 h-8 mb-2 opacity-20" />
            <p>{t.notes.selectOrCreate}</p>
          </div>
        )}
      </div>
    </div>
  );
};
