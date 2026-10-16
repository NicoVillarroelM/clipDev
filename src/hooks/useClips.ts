import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import type { ClipItem, FilterType } from "../types/clip";
import { detectContentType } from "../utils/detector";
import { STORAGE_KEYS, MAX_CLIPS_COUNT, STORAGE_SAVE_DEBOUNCE_MS } from "../constants";

interface UseClipsOptions {
  imageFilterLabel: string;
}

export function useClips({ imageFilterLabel }: UseClipsOptions) {
  const isHydratedRef = useRef(false);
  const isDirtyRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const [clips, setClips] = useState<ClipItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLIPS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const clipsRef = useRef(clips);
  clipsRef.current = clips;

  useEffect(() => {
    let isMounted = true;
    if (window.electronAPI?.loadStorageFromDisk) {
      window.electronAPI
        .loadStorageFromDisk()
        .then((data) => {
          if (!isMounted) return;
          if (data.clips && data.clips.length > 0) {
            setClips((prev) => (prev.length === 0 ? data.clips! : prev));
          }
          isHydratedRef.current = true;
        })
        .catch(() => {
          if (isMounted) isHydratedRef.current = true;
        });
    } else {
      isHydratedRef.current = true;
    }
    return () => {
      isMounted = false;
    };
  }, []);

  const saveToStorage = useCallback((clipsToSave: ClipItem[]) => {
    const json = JSON.stringify(clipsToSave);
    try {
      localStorage.setItem(STORAGE_KEYS.CLIPS, json);
    } catch {}
    window.electronAPI?.saveClipsToDisk?.(json);
  }, []);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    isDirtyRef.current = true;

    const timer = setTimeout(() => {
      saveToStorage(clipsRef.current);
      isDirtyRef.current = false;
    }, STORAGE_SAVE_DEBOUNCE_MS);

    const handleBeforeUnload = () => {
      if (isDirtyRef.current) {
        clearTimeout(timer);
        saveToStorage(clipsRef.current);
        isDirtyRef.current = false;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [clips, saveToStorage]);

  useEffect(() => {
    return () => {
      if (isDirtyRef.current) {
        saveToStorage(clipsRef.current);
      }
    };
  }, [saveToStorage]);

  useEffect(() => {
    if (!window.electronAPI) {
      return;
    }

    const addClip = (newText: string) => {
      const trimmed = newText.trim();
      if (!trimmed) return;

      setClips((prev) => {
        const existingIndex = prev.findIndex((c) => c.content === trimmed);
        const type = detectContentType(trimmed);

        if (existingIndex !== -1) {
          const item = prev[existingIndex];
          const updated = { ...item, createdAt: Date.now() };
          const rest = prev.filter((_, i) => i !== existingIndex);
          return [updated, ...rest];
        }

        const newClip: ClipItem = {
          id: crypto.randomUUID(),
          content: trimmed,
          type,
          pinned: false,
          createdAt: Date.now(),
        };

        return [newClip, ...prev].slice(0, MAX_CLIPS_COUNT);
      });
    };

    const addImageClip = (data: { content: string; width: number; height: number; sizeLabel: string }) => {
      setClips((prev) => {
        const existingIndex = prev.findIndex((c) => c.type === "image" && c.content === data.content);

        if (existingIndex !== -1) {
          const item = prev[existingIndex];
          const updated = { ...item, createdAt: Date.now() };
          const rest = prev.filter((_, i) => i !== existingIndex);
          return [updated, ...rest];
        }

        const newClip: ClipItem = {
          id: crypto.randomUUID(),
          content: data.content,
          type: "image",
          imageWidth: data.width,
          imageHeight: data.height,
          imageSize: data.sizeLabel,
          pinned: false,
          createdAt: Date.now(),
        };

        return [newClip, ...prev].slice(0, MAX_CLIPS_COUNT);
      });
    };

    window.electronAPI.getCurrentClipboard().then((text) => {
      if (text) addClip(text);
    });

    if (window.electronAPI.getCurrentClipboardImage) {
      window.electronAPI.getCurrentClipboardImage().then((img) => {
        if (img) addImageClip(img);
      });
    }

    const cleanup = window.electronAPI.onClipboardUpdate((newText) => {
      addClip(newText);
    });

    const cleanupImage = window.electronAPI.onClipboardImageUpdate?.((img) => {
      addImageClip(img);
    });

    return () => {
      cleanup();
      cleanupImage?.();
    };
  }, []);

  const handleCopy = useCallback((content: string) => {
    if (content.startsWith("data:image/") && window.electronAPI?.writeClipboardImage) {
      window.electronAPI.writeClipboardImage(content);
      return;
    }
    if (window.electronAPI) {
      window.electronAPI.writeClipboard(content);
    } else {
      navigator.clipboard.writeText(content);
    }
  }, []);

  const handleTogglePin = useCallback((id: string) => {
    setClips((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
    );
  }, []);

  const handleDeleteClip = useCallback((id: string) => {
    setClips((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleConfirmClearUnpinned = useCallback(() => {
    setClips((prev) => prev.filter((c) => c.pinned));
  }, []);

  const filteredClips = useMemo(() => {
    return clips.filter((clip) => {
      if (activeFilter === "pinned" && !clip.pinned) return false;
      if (activeFilter === "code" && clip.type !== "code") return false;
      if (activeFilter === "url" && clip.type !== "url") return false;
      if (activeFilter === "color" && clip.type !== "color") return false;
      if (activeFilter === "image" && clip.type !== "image") return false;

      if (searchQuery.trim() !== "") {
        if (clip.type === "image") {
          return imageFilterLabel.toLowerCase().includes(searchQuery.toLowerCase().trim());
        }
        return clip.content
          .toLowerCase()
          .includes(searchQuery.toLowerCase().trim());
      }

      return true;
    });
  }, [clips, activeFilter, searchQuery, imageFilterLabel]);

  const unpinnedCount = useMemo(() => clips.filter((c) => !c.pinned).length, [clips]);

  return {
    clips,
    setClips,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    filteredClips,
    unpinnedCount,
    handleCopy,
    handleTogglePin,
    handleDeleteClip,
    handleConfirmClearUnpinned,
  };
}
