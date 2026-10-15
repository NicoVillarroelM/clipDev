import { motion } from "framer-motion";

interface ClipSkeletonProps {
  count?: number;
}

export const ClipSkeleton = ({ count = 4 }: ClipSkeletonProps) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: i * 0.05 }}
          className="relative flex flex-col p-3 rounded-xl border theme-border-app theme-bg-card shadow-sm overflow-hidden"
        >
          {/* Header de la tarjeta esqueleto */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              {/* Badge placeholder */}
              <div className="h-5 w-16 rounded-md bg-zinc-500/15 dark:bg-zinc-700/30 animate-pulse" />
              {/* Date / time placeholder */}
              <div className="h-3.5 w-28 rounded bg-zinc-500/10 dark:bg-zinc-700/20 animate-pulse" />
            </div>

            {/* Action buttons placeholder */}
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-zinc-500/15 dark:bg-zinc-700/30 animate-pulse" />
              <div className="w-6 h-6 rounded-md bg-zinc-500/15 dark:bg-zinc-700/30 animate-pulse" />
              <div className="w-6 h-6 rounded-md bg-zinc-500/15 dark:bg-zinc-700/30 animate-pulse" />
              <div className="w-6 h-6 rounded-md bg-zinc-500/15 dark:bg-zinc-700/30 animate-pulse" />
            </div>
          </div>

          {/* Content preview placeholder con líneas de ancho variable */}
          <div className="p-3 rounded-lg border theme-border-app theme-bg-input flex flex-col gap-2">
            <div
              className="h-3 rounded bg-zinc-500/20 dark:bg-zinc-700/40 animate-pulse"
              style={{ width: `${80 - (i % 3) * 15}%` }}
            />
            <div
              className="h-3 rounded bg-zinc-500/15 dark:bg-zinc-700/30 animate-pulse"
              style={{ width: `${60 + (i % 2) * 20}%` }}
            />
            <div
              className="h-3 rounded bg-zinc-500/10 dark:bg-zinc-700/20 animate-pulse"
              style={{ width: `${45 + (i % 3) * 10}%` }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
};
