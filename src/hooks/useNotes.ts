import { useState, useEffect, useRef, useCallback } from "react";
import type { NoteItem } from "../types/clip";
import { STORAGE_KEYS, STORAGE_SAVE_DEBOUNCE_MS } from "../constants";

interface UseNotesOptions {
  initialTitle: string;
  initialContent: string;
}

export function useNotes({ initialTitle, initialContent }: UseNotesOptions) {
  const isHydratedRef = useRef(false);
  const isDirtyRef = useRef(false);
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTES);
      if (saved) return JSON.parse(saved);
      return [
        {
          id: "welcome-note",
          title: initialTitle,
          content: initialContent,
          color: "amber",
          updatedAt: Date.now(),
        },
      ];
    } catch {
      return [
        {
          id: "welcome-note",
          title: initialTitle,
          content: initialContent,
          color: "amber",
          updatedAt: Date.now(),
        },
      ];
    }
  });

  const notesRef = useRef(notes);
  notesRef.current = notes;

  useEffect(() => {
    let isMounted = true;
    if (window.electronAPI?.loadStorageFromDisk) {
      window.electronAPI
        .loadStorageFromDisk()
        .then((data) => {
          if (!isMounted) return;
          if (data.notes && data.notes.length > 0) {
            setNotes((prev) => (prev.length <= 1 ? data.notes! : prev));
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

  const saveToStorage = useCallback((notesToSave: NoteItem[]) => {
    const json = JSON.stringify(notesToSave);
    try {
      localStorage.setItem(STORAGE_KEYS.NOTES, json);
    } catch {}
    window.electronAPI?.saveNotesToDisk?.(json);
  }, []);

  useEffect(() => {
    if (!isHydratedRef.current) return;
    isDirtyRef.current = true;

    const timer = setTimeout(() => {
      saveToStorage(notesRef.current);
      isDirtyRef.current = false;
    }, STORAGE_SAVE_DEBOUNCE_MS);

    const handleBeforeUnload = () => {
      if (isDirtyRef.current) {
        clearTimeout(timer);
        saveToStorage(notesRef.current);
        isDirtyRef.current = false;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [notes, saveToStorage]);

  useEffect(() => {
    return () => {
      if (isDirtyRef.current) {
        saveToStorage(notesRef.current);
      }
    };
  }, [saveToStorage]);

  const handleSaveNote = useCallback((updatedNote: NoteItem) => {
    setNotes((prev) => {
      const exists = prev.some((n) => n.id === updatedNote.id);
      if (exists) {
        return prev.map((n) => (n.id === updatedNote.id ? updatedNote : n));
      }
      return [updatedNote, ...prev];
    });
  }, []);

  const handleDeleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return {
    notes,
    setNotes,
    handleSaveNote,
    handleDeleteNote,
  };
}
