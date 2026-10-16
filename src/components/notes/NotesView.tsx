import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from "react";
import { StickyNote } from "lucide-react";
import type { NoteItem, NoteColor } from "../../types/clip";
import { translations, type Language } from "../../locales/translations";
import { FEEDBACK_TIMEOUT_MS } from "../../constants";
import { useNoteImageEditor } from "../../hooks";
import { NoteSidebar } from "./NoteSidebar";
import { NoteHeader } from "./NoteHeader";
import { NoteFormatToolbar } from "./NoteFormatToolbar";
import { NoteImageToolbar } from "./NoteImageToolbar";
import { NoteFooter } from "./NoteFooter";

interface NotesViewProps {
  notes: NoteItem[];
  onSaveNote: (note: NoteItem) => void;
  onDeleteNote: (id: string) => void;
  onCopyContent: (content: string) => void;
  lang: Language;
}

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const t = translations[lang];

  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  const handleEditorInput = useCallback(() => {
    if (!editorRef.current || !selectedNote) return;
    onSaveNote({
      ...selectedNote,
      content: editorRef.current.innerHTML,
      updatedAt: Date.now(),
    });
  }, [selectedNote, onSaveNote]);

  const imageEditor = useNoteImageEditor({
    scrollContainerRef,
    selectedNoteId,
    onContentChange: handleEditorInput,
  });

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

  const handleColorChange = (color: NoteColor) => {
    if (!selectedNote) return;
    onSaveNote({ ...selectedNote, color, updatedAt: Date.now() });
  };

  const handleCopy = () => {
    if (!selectedNote || !editorRef.current) return;
    const text = editorRef.current.innerText || selectedNote.content;
    onCopyContent(text);
    setCopied(true);
    setTimeout(() => setCopied(false), FEEDBACK_TIMEOUT_MS);
  };

  const handleDeleteCurrentNote = () => {
    if (!selectedNote) return;
    onDeleteNote(selectedNote.id);
    setSelectedNoteId(notes.find((n) => n.id !== selectedNote.id)?.id || null);
  };

  const formatText = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    handleEditorInput();
  };

  const setBlockFormat = (tag: string) => {
    document.execCommand("formatBlock", false, `<${tag}>`);
    handleEditorInput();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      document.execCommand("insertText", false, "    ");
    }
  };

  const textContent = editorRef.current?.innerText || selectedNote?.content || "";
  const wordsCount = textContent.trim() ? textContent.trim().split(/\s+/).length : 0;
  const charsCount = textContent.length;

  return (
    <div className="flex-1 flex overflow-hidden">
      <NoteSidebar
        notes={notes}
        selectedNoteId={selectedNoteId}
        onSelectNote={setSelectedNoteId}
        onCreateNote={handleCreateNote}
        lang={lang}
      />

      <div className="flex-1 flex flex-col theme-bg-app transition-colors overflow-hidden">
        {selectedNote ? (
          <>
            <NoteHeader
              note={selectedNote}
              copied={copied}
              onTitleChange={handleTitleChange}
              onColorChange={handleColorChange}
              onCopy={handleCopy}
              onDelete={handleDeleteCurrentNote}
              lang={lang}
            />

            <NoteFormatToolbar
              onFormatText={formatText}
              onSetBlockFormat={setBlockFormat}
              lang={lang}
            />

            <div
              ref={scrollContainerRef}
              onClick={imageEditor.handleContainerClick}
              onScroll={imageEditor.updateOverlayPosition}
              className="flex-1 overflow-y-auto p-4 theme-bg-app relative"
            >
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleEditorInput}
                onPaste={imageEditor.handlePaste}
                onKeyDown={handleKeyDown}
                onClick={imageEditor.handleEditorClick}
                data-placeholder={t.notes.contentPlaceholder}
                className="note-editor-content min-h-full w-full theme-text-app text-sm leading-relaxed select-text"
              />

              {imageEditor.selectedImg && imageEditor.overlayPos && (
                <NoteImageToolbar
                  overlayPos={imageEditor.overlayPos}
                  isResizing={imageEditor.isResizing}
                  onResize={imageEditor.applyImageSize}
                  onAlign={imageEditor.applyImageAlignment}
                  onDelete={imageEditor.deleteSelectedImage}
                  onResizeMouseDown={imageEditor.handleResizeMouseDown}
                  lang={lang}
                />
              )}
            </div>

            <NoteFooter
              wordsCount={wordsCount}
              charsCount={charsCount}
              lang={lang}
            />
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
