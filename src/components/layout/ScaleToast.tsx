import { Type } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { FontSize } from "../../types/theme";
import { translations, type Language } from "../../locales/translations";

interface ScaleToastProps {
  show: boolean;
  fontSize: FontSize;
  lang: Language;
}

export const ScaleToast = ({ show, fontSize, lang }: ScaleToastProps) => {
  const t = translations[lang];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.95 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 pointer-events-none flex items-center gap-2 px-4 py-2 rounded-full theme-bg-panel border theme-accent-border shadow-2xl backdrop-blur-md text-xs font-semibold theme-accent-text"
        >
          <Type className="w-3.5 h-3.5" />
          <span>
            {t.controls.scaleToast}:{" "}
            {fontSize === "xlarge"
              ? t.controls.fontXLarge
              : fontSize === "large"
              ? t.controls.fontLarge
              : t.controls.fontNormal}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
