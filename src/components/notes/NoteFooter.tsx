import { HardDrive } from "lucide-react";
import { translations, type Language } from "../../locales/translations";

interface NoteFooterProps {
  wordsCount: number;
  charsCount: number;
  lang: Language;
}

export const NoteFooter = ({
  wordsCount,
  charsCount,
  lang,
}: NoteFooterProps) => {
  const t = translations[lang];

  return (
    <div className="px-4 py-1.5 border-t theme-border-app theme-bg-header flex items-center justify-between text-[11px] theme-text-muted select-none">
      <div className="flex items-center gap-1.5 font-mono">
        <HardDrive className="w-3 h-3 text-emerald-500" />
        <span className="text-emerald-500/90 font-medium">
          {lang === "es" ? "Guardado automático en disco" : "Auto-saved to disk"}
        </span>
      </div>
      <div className="flex items-center gap-2 font-mono opacity-75">
        <span>
          {wordsCount} {lang === "es" ? "palabras" : "words"}
        </span>
        <span>·</span>
        <span>
          {charsCount} {t.cards.chars}
        </span>
      </div>
    </div>
  );
};
