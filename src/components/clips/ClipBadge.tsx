import {
  Code2,
  Link,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import type { ClipItem } from "../../types/clip";
import { translations, type Language } from "../../locales/translations";

interface ClipBadgeProps {
  clip: ClipItem;
  lang: Language;
  size?: "sm" | "md";
  showDetails?: boolean;
}

export const ClipBadge = ({
  clip,
  lang,
  size = "sm",
  showDetails = true,
}: ClipBadgeProps) => {
  const t = translations[lang];
  const iconSize = size === "md" ? "w-3.5 h-3.5" : "w-3 h-3";
  const textSize = size === "md" ? "text-xs" : "text-[11px]";

  const lines = clip.type === "image" ? [] : clip.content.split("\n");
  const isMultiLine = lines.length > 1;

  switch (clip.type) {
    case "image":
      return (
        <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded ${textSize} font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20`}>
          <ImageIcon className={iconSize} />
          {t.cards.badgeImage}
          {showDetails && clip.imageWidth && clip.imageHeight && (
            <span className="ml-1 opacity-75 font-mono text-[10px]">
              ({clip.imageWidth}×{clip.imageHeight})
            </span>
          )}
        </span>
      );

    case "color":
      return (
        <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded ${textSize} font-medium bg-purple-500/10 text-purple-500 border border-purple-500/20`}>
          <span
            className="w-2.5 h-2.5 rounded-full border border-black/20 dark:border-white/30"
            style={{ backgroundColor: clip.content.trim() }}
          />
          {t.cards.badgeColor}
        </span>
      );

    case "url":
      return (
        <span className={`flex items-center gap-1 px-2 py-0.5 rounded ${textSize} font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20`}>
          <Link className={iconSize} />
          {t.cards.badgeUrl}
        </span>
      );

    case "code":
      return (
        <span className={`flex items-center gap-1 px-2 py-0.5 rounded ${textSize} font-medium theme-accent-subtle theme-accent-text theme-accent-border border`}>
          <Code2 className={iconSize} />
          {t.cards.badgeCode}
          {showDetails && isMultiLine && (
            <span className="ml-1 opacity-75 font-mono text-[10px]">
              ({lines.length} {t.cards.lines})
            </span>
          )}
        </span>
      );

    default:
      return (
        <span className={`flex items-center gap-1 px-2 py-0.5 rounded ${textSize} font-medium theme-bg-app theme-text-muted border theme-border-app`}>
          <FileText className={iconSize} />
          {t.cards.badgeText}
          {showDetails && isMultiLine && (
            <span className="ml-1 opacity-75 font-mono text-[10px]">
              ({lines.length} {t.cards.lines})
            </span>
          )}
        </span>
      );
  }
};
