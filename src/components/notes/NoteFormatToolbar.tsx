import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  List,
  ListOrdered,
  Code,
  Quote,
  Undo,
  Redo,
  RemoveFormatting,
} from "lucide-react";
import { translations, type Language } from "../../locales/translations";

interface NoteFormatToolbarProps {
  onFormatText: (command: string, value?: string) => void;
  onSetBlockFormat: (tag: string) => void;
  lang: Language;
}

export const NoteFormatToolbar = ({
  onFormatText,
  onSetBlockFormat,
  lang,
}: NoteFormatToolbarProps) => {
  const t = translations[lang];

  return (
    <div className="px-3 py-1.5 border-b theme-border-app theme-bg-panel flex items-center gap-1 flex-wrap text-xs select-none">
      <div className="flex items-center gap-0.5 pr-1.5 border-r theme-border-app">
        <button
          type="button"
          onClick={() => onSetBlockFormat("h1")}
          className="p-1 rounded hover:theme-accent-subtle hover:theme-accent-text theme-text-muted font-bold text-xs"
          title={t.notes.h1}
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => onSetBlockFormat("h2")}
          className="p-1 rounded hover:theme-accent-subtle hover:theme-accent-text theme-text-muted font-bold text-xs"
          title={t.notes.h2}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => onSetBlockFormat("p")}
          className="p-1 rounded hover:theme-accent-subtle hover:theme-accent-text theme-text-muted font-medium text-xs"
          title={t.notes.paragraph}
        >
          P
        </button>
      </div>

      <div className="flex items-center gap-0.5 px-1.5 border-r theme-border-app">
        <button
          type="button"
          onClick={() => onFormatText("bold")}
          className="p-1.5 rounded hover:theme-accent-subtle hover:theme-accent-text theme-text-muted"
          title={t.notes.bold}
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onFormatText("italic")}
          className="p-1.5 rounded hover:theme-accent-subtle hover:theme-accent-text theme-text-muted"
          title={t.notes.italic}
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onFormatText("underline")}
          className="p-1.5 rounded hover:theme-accent-subtle hover:theme-accent-text theme-text-muted"
          title={t.notes.underline}
        >
          <UnderlineIcon className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onFormatText("strikeThrough")}
          className="p-1.5 rounded hover:theme-accent-subtle hover:theme-accent-text theme-text-muted"
          title={t.notes.strikethrough}
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onFormatText("hiliteColor", "rgba(245, 158, 11, 0.25)")}
          className="p-1.5 rounded hover:theme-accent-subtle hover:theme-accent-text theme-text-muted"
          title={t.notes.highlight}
        >
          <Highlighter className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-0.5 px-1.5 border-r theme-border-app">
        <button
          type="button"
          onClick={() => onFormatText("insertUnorderedList")}
          className="p-1.5 rounded hover:theme-accent-subtle hover:theme-accent-text theme-text-muted"
          title={t.notes.bulletList}
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onFormatText("insertOrderedList")}
          className="p-1.5 rounded hover:theme-accent-subtle hover:theme-accent-text theme-text-muted"
          title={t.notes.numberedList}
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onSetBlockFormat("pre")}
          className="p-1.5 rounded hover:theme-accent-subtle hover:theme-accent-text theme-text-muted"
          title={t.notes.codeBlock}
        >
          <Code className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onSetBlockFormat("blockquote")}
          className="p-1.5 rounded hover:theme-accent-subtle hover:theme-accent-text theme-text-muted"
          title={t.notes.quote}
        >
          <Quote className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-0.5 pl-1.5">
        <button
          type="button"
          onClick={() => onFormatText("undo")}
          className="p-1.5 rounded hover:theme-accent-subtle hover:theme-accent-text theme-text-muted"
          title={t.notes.undo}
        >
          <Undo className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onFormatText("redo")}
          className="p-1.5 rounded hover:theme-accent-subtle hover:theme-accent-text theme-text-muted"
          title={t.notes.redo}
        >
          <Redo className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onFormatText("removeFormat")}
          className="p-1.5 rounded hover:theme-accent-subtle hover:theme-accent-text theme-text-muted"
          title={t.notes.clearFormat}
        >
          <RemoveFormatting className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
