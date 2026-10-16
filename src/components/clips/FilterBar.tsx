import { Search, X, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import type { FilterType } from "../../types/clip";
import { translations, type Language } from "../../locales/translations";
import { CLIP_FILTERS } from "../../constants";

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  clipsCount: number;
  pinnedCount: number;
  unpinnedCount: number;
  onClearUnpinned: () => void;
  lang: Language;
}

export const FilterBar = ({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  clipsCount,
  pinnedCount,
  unpinnedCount,
  onClearUnpinned,
  lang,
}: FilterBarProps) => {
  const t = translations[lang];

  return (
    <div className="p-3 border-b theme-border-app theme-bg-panel flex flex-col gap-2.5 transition-colors">
      <div className="relative w-full">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 theme-text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t.search.placeholder}
          className="w-full theme-bg-app border theme-border-app focus:theme-accent-border pl-9 pr-8 py-1.5 rounded-lg text-xs theme-text-app placeholder:theme-text-muted focus:outline-none transition-colors shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 theme-text-muted hover:theme-text-app"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 text-xs pb-0.5">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {CLIP_FILTERS.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.id;
            const label = t.filters[filter.labelKey];
            const count =
              filter.id === "all"
                ? clipsCount
                : filter.id === "pinned"
                ? pinnedCount
                : undefined;

            return (
              <button
                key={filter.id}
                onClick={() => onFilterChange(filter.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors shadow-sm ${
                  isActive
                    ? "theme-accent-subtle theme-accent-text theme-accent-border border font-medium"
                    : "theme-bg-app theme-text-muted hover:theme-text-app border theme-border-app"
                }`}
              >
                <Icon className={`w-3 h-3 ${filter.iconColorClass || "theme-accent-text"}`} />
                <span>{label}</span>
                {count !== undefined && (
                  <span className="text-[10px] opacity-60">({count})</span>
                )}
              </button>
            );
          })}
        </div>

        {unpinnedCount > 0 && (
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={onClearUnpinned}
            className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium theme-text-muted hover:text-rose-400 hover:bg-rose-500/15 border border-transparent hover:border-rose-500/30 transition-colors shadow-sm"
            title={t.search.clearTooltip}
            aria-label={t.search.clearTooltip}
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500/70" />
            <span>{t.search.clearHistory}</span>
          </motion.button>
        )}
      </div>
    </div>
  );
};
