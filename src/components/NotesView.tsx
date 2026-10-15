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
  AlignLeft,
  AlignCenter,
  AlignRight,
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
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);
  const [overlayPos, setOverlayPos] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const t = translations[lang];

  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  const updateOverlayPosition = () => {
    if (!selectedImg || !scrollContainerRef.current) {
      setOverlayPos(null);
      return;
    }
    if (!selectedImg.isConnected) {
      setSelectedImg(null);
      setOverlayPos(null);
      return;
    }
    const contRect = scrollContainerRef.current.getBoundingClientRect();
    const imgRect = selectedImg.getBoundingClientRect();
    setOverlayPos({
      top: imgRect.top - contRect.top + scrollContainerRef.current.scrollTop,
      left: imgRect.left - contRect.left + scrollContainerRef.current.scrollLeft,
      width: imgRect.width,
      height: imgRect.height,
    });
  };

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
    if (selectedImg) {
      selectedImg.removeAttribute("data-selected");
    }
    setSelectedImg(null);
    setOverlayPos(null);
  }, [selectedNoteId]);

  useEffect(() => {
    updateOverlayPosition();
    window.addEventListener("resize", updateOverlayPosition);
    return () => window.removeEventListener("resize", updateOverlayPosition);
  }, [selectedImg]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (selectedImg && (e.key === "Delete" || e.key === "Backspace")) {
        const activeEl = document.activeElement;
        if (activeEl?.tagName !== "INPUT" && activeEl?.tagName !== "TEXTAREA") {
          e.preventDefault();
          deleteSelectedImage();
        }
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [selectedImg]);

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

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target && target.tagName === "IMG") {
      e.stopPropagation();
      if (selectedImg && selectedImg !== target) {
        selectedImg.removeAttribute("data-selected");
      }
      target.setAttribute("data-selected", "true");
      setSelectedImg(target as HTMLImageElement);
    } else {
      if (selectedImg) {
        selectedImg.removeAttribute("data-selected");
      }
      setSelectedImg(null);
      setOverlayPos(null);
    }
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName !== "IMG" && !target.closest("[data-image-toolbar]")) {
      if (selectedImg) {
        selectedImg.removeAttribute("data-selected");
      }
      setSelectedImg(null);
      setOverlayPos(null);
    }
  };

  const applyImageSize = (size: "25%" | "50%" | "75%" | "100%") => {
    if (!selectedImg) return;
    selectedImg.style.width = size;
    selectedImg.style.maxWidth = "100%";
    selectedImg.style.height = "auto";
    updateOverlayPosition();
    handleEditorInput();
  };

  const applyImageAlignment = (align: "left" | "center" | "right") => {
    if (!selectedImg) return;
    selectedImg.style.display = "block";
    if (align === "center") {
      selectedImg.style.marginLeft = "auto";
      selectedImg.style.marginRight = "auto";
    } else if (align === "right") {
      selectedImg.style.marginLeft = "auto";
      selectedImg.style.marginRight = "0";
    } else {
      selectedImg.style.marginLeft = "0";
      selectedImg.style.marginRight = "auto";
    }
    updateOverlayPosition();
    handleEditorInput();
  };

  const deleteSelectedImage = () => {
    if (!selectedImg) return;
    selectedImg.remove();
    setSelectedImg(null);
    setOverlayPos(null);
    handleEditorInput();
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedImg || !scrollContainerRef.current) return;

    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = selectedImg.offsetWidth;
    const contWidth = scrollContainerRef.current.clientWidth - 48;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(80, Math.min(startWidth + deltaX, contWidth));
      selectedImg.style.width = `${newWidth}px`;
      selectedImg.style.maxWidth = "100%";
      selectedImg.style.height = "auto";
      updateOverlayPosition();
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      handleEditorInput();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const dataUrl = event.target?.result as string;
              if (dataUrl) {
                const imgHtml = `<img src="${dataUrl}" style="max-width: 100%; width: 50%; border-radius: 8px; margin: 12px 0; display: block;" alt="Note image" />`;
                document.execCommand("insertHTML", false, imgHtml);
                handleEditorInput();
              }
            };
            reader.readAsDataURL(file);
            return;
          }
        }
      }
    }

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

            <div
              ref={scrollContainerRef}
              onClick={handleContainerClick}
              onScroll={updateOverlayPosition}
              className="flex-1 overflow-y-auto p-4 theme-bg-app relative"
            >
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleEditorInput}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                onClick={handleEditorClick}
                data-placeholder={t.notes.contentPlaceholder}
                className="note-editor-content min-h-full w-full theme-text-app text-sm leading-relaxed select-text"
              />

              {selectedImg && overlayPos && (
                <div
                  style={{
                    position: "absolute",
                    top: overlayPos.top,
                    left: overlayPos.left,
                    width: overlayPos.width,
                    height: overlayPos.height,
                    pointerEvents: "none",
                  }}
                  className="z-30"
                >
                  <div
                    data-image-toolbar="true"
                    style={{
                      top: overlayPos.top < 52 ? "calc(100% + 8px)" : "-44px",
                    }}
                    className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 theme-bg-panel border theme-border-app px-2 py-1 rounded-lg shadow-2xl backdrop-blur-md text-xs font-mono select-none pointer-events-auto z-40 whitespace-nowrap"
                  >
                    <button
                      type="button"
                      onClick={() => applyImageSize("25%")}
                      className="px-2 py-1 rounded theme-text-muted hover:theme-accent-text hover:theme-accent-subtle transition-colors font-medium text-[11px]"
                      title={t.notes.imageSmall}
                    >
                      25%
                    </button>
                    <button
                      type="button"
                      onClick={() => applyImageSize("50%")}
                      className="px-2 py-1 rounded theme-text-muted hover:theme-accent-text hover:theme-accent-subtle transition-colors font-medium text-[11px]"
                      title={t.notes.imageMedium}
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => applyImageSize("75%")}
                      className="px-2 py-1 rounded theme-text-muted hover:theme-accent-text hover:theme-accent-subtle transition-colors font-medium text-[11px]"
                      title={t.notes.imageLarge}
                    >
                      75%
                    </button>
                    <button
                      type="button"
                      onClick={() => applyImageSize("100%")}
                      className="px-2 py-1 rounded theme-text-muted hover:theme-accent-text hover:theme-accent-subtle transition-colors font-medium text-[11px]"
                      title={t.notes.imageFull}
                    >
                      100%
                    </button>

                    <span className="w-[1px] h-3.5 bg-zinc-500/30 mx-1" />

                    <button
                      type="button"
                      onClick={() => applyImageAlignment("left")}
                      className="p-1.5 rounded theme-text-muted hover:theme-accent-text hover:theme-accent-subtle transition-colors"
                      title={t.notes.alignLeft}
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyImageAlignment("center")}
                      className="p-1.5 rounded theme-text-muted hover:theme-accent-text hover:theme-accent-subtle transition-colors"
                      title={t.notes.alignCenter}
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyImageAlignment("right")}
                      className="p-1.5 rounded theme-text-muted hover:theme-accent-text hover:theme-accent-subtle transition-colors"
                      title={t.notes.alignRight}
                    >
                      <AlignRight className="w-3.5 h-3.5" />
                    </button>

                    <span className="w-[1px] h-3.5 bg-zinc-500/30 mx-1" />

                    <button
                      type="button"
                      onClick={deleteSelectedImage}
                      className="p-1.5 rounded text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title={t.notes.deleteImage}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div
                    onMouseDown={handleResizeMouseDown}
                    className={`absolute bottom-0 right-0 w-3.5 h-3.5 theme-accent-bg border-2 border-white dark:border-zinc-900 rounded-full cursor-se-resize shadow-lg translate-x-1/2 translate-y-1/2 pointer-events-auto transition-transform ${
                      isResizing ? "scale-150 ring-4 ring-emerald-500/40" : "hover:scale-125"
                    }`}
                    title={t.notes.resizeHint}
                  />
                </div>
              )}
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
