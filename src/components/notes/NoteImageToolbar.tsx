import { AlignLeft, AlignCenter, AlignRight, Trash2 } from "lucide-react";
import type { ImageResizePreset, ImageAlignOption } from "../../constants";
import { translations, type Language } from "../../locales/translations";

interface NoteImageToolbarProps {
  overlayPos: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  isResizing: boolean;
  onResize: (size: ImageResizePreset) => void;
  onAlign: (align: ImageAlignOption) => void;
  onDelete: () => void;
  onResizeMouseDown: (e: React.MouseEvent) => void;
  lang: Language;
}

export const NoteImageToolbar = ({
  overlayPos,
  isResizing,
  onResize,
  onAlign,
  onDelete,
  onResizeMouseDown,
  lang,
}: NoteImageToolbarProps) => {
  const t = translations[lang];

  return (
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
          onClick={() => onResize("25%")}
          className="px-2 py-1 rounded theme-text-muted hover:theme-accent-text hover:theme-accent-subtle transition-colors font-medium text-[11px]"
          title={t.notes.imageSmall}
        >
          25%
        </button>
        <button
          type="button"
          onClick={() => onResize("50%")}
          className="px-2 py-1 rounded theme-text-muted hover:theme-accent-text hover:theme-accent-subtle transition-colors font-medium text-[11px]"
          title={t.notes.imageMedium}
        >
          50%
        </button>
        <button
          type="button"
          onClick={() => onResize("75%")}
          className="px-2 py-1 rounded theme-text-muted hover:theme-accent-text hover:theme-accent-subtle transition-colors font-medium text-[11px]"
          title={t.notes.imageLarge}
        >
          75%
        </button>
        <button
          type="button"
          onClick={() => onResize("100%")}
          className="px-2 py-1 rounded theme-text-muted hover:theme-accent-text hover:theme-accent-subtle transition-colors font-medium text-[11px]"
          title={t.notes.imageFull}
        >
          100%
        </button>

        <span className="w-[1px] h-3.5 bg-zinc-500/30 mx-1" />

        <button
          type="button"
          onClick={() => onAlign("left")}
          className="p-1.5 rounded theme-text-muted hover:theme-accent-text hover:theme-accent-subtle transition-colors"
          title={t.notes.alignLeft}
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onAlign("center")}
          className="p-1.5 rounded theme-text-muted hover:theme-accent-text hover:theme-accent-subtle transition-colors"
          title={t.notes.alignCenter}
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onAlign("right")}
          className="p-1.5 rounded theme-text-muted hover:theme-accent-text hover:theme-accent-subtle transition-colors"
          title={t.notes.alignRight}
        >
          <AlignRight className="w-3.5 h-3.5" />
        </button>

        <span className="w-[1px] h-3.5 bg-zinc-500/30 mx-1" />

        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 rounded text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
          title={t.notes.deleteImage}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div
        onMouseDown={onResizeMouseDown}
        className={`absolute bottom-0 right-0 w-3.5 h-3.5 theme-accent-bg border-2 border-white dark:border-zinc-900 rounded-full cursor-se-resize shadow-lg translate-x-1/2 translate-y-1/2 pointer-events-auto transition-transform ${
          isResizing ? "scale-150 ring-4 ring-emerald-500/40" : "hover:scale-125"
        }`}
        title={t.notes.resizeHint}
      />
    </div>
  );
};
