import { useState, useEffect, useRef, useCallback, type RefObject, type MouseEvent, type ClipboardEvent } from "react";
import type { ImageResizePreset, ImageAlignOption } from "../constants";

interface UseNoteImageEditorOptions {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  selectedNoteId: string | null;
  onContentChange: () => void;
}

export const useNoteImageEditor = ({
  scrollContainerRef,
  selectedNoteId,
  onContentChange,
}: UseNoteImageEditorOptions) => {
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);
  const [overlayPos, setOverlayPos] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  const onContentChangeRef = useRef(onContentChange);
  useEffect(() => {
    onContentChangeRef.current = onContentChange;
  });

  const updateOverlayPosition = useCallback(() => {
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
  }, [selectedImg, scrollContainerRef]);

  useEffect(() => {
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
  }, [updateOverlayPosition]);

  const deleteSelectedImage = useCallback(() => {
    if (!selectedImg) return;
    selectedImg.remove();
    setSelectedImg(null);
    setOverlayPos(null);
    onContentChangeRef.current();
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
  }, [selectedImg, deleteSelectedImage]);

  const applyImageSize = useCallback(
    (size: ImageResizePreset) => {
      if (!selectedImg) return;
      selectedImg.style.width = size;
      selectedImg.style.maxWidth = "100%";
      selectedImg.style.height = "auto";
      updateOverlayPosition();
      onContentChangeRef.current();
    },
    [selectedImg, updateOverlayPosition]
  );

  const applyImageAlignment = useCallback(
    (align: ImageAlignOption) => {
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
      onContentChangeRef.current();
    },
    [selectedImg, updateOverlayPosition]
  );

  const handleResizeMouseDown = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!selectedImg || !scrollContainerRef.current) return;

      setIsResizing(true);
      const startX = e.clientX;
      const startWidth = selectedImg.offsetWidth;
      const contWidth = scrollContainerRef.current.clientWidth - 48;

      const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
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
        onContentChangeRef.current();
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [selectedImg, scrollContainerRef, updateOverlayPosition]
  );

  const handlePaste = useCallback((e: ClipboardEvent<HTMLDivElement>) => {
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
                onContentChangeRef.current();
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
      onContentChangeRef.current();
    }
  }, []);

  const handleEditorClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
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
    },
    [selectedImg]
  );

  const handleContainerClick = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== "IMG" && !target.closest("[data-image-toolbar]")) {
        if (selectedImg) {
          selectedImg.removeAttribute("data-selected");
        }
        setSelectedImg(null);
        setOverlayPos(null);
      }
    },
    [selectedImg]
  );

  return {
    selectedImg,
    overlayPos,
    isResizing,
    updateOverlayPosition,
    applyImageSize,
    applyImageAlignment,
    deleteSelectedImage,
    handleResizeMouseDown,
    handlePaste,
    handleEditorClick,
    handleContainerClick,
  };
};
