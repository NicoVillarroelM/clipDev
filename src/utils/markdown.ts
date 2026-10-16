import { marked } from "marked";
import type React from "react";

marked.setOptions({
  gfm: true,
  breaks: true,
});

export function isMarkdown(text: string): boolean {
  if (!text || text.length < 2) return false;

  if (/```[\s\S]*?```/.test(text)) return true;
  if (/^#{1,6}\s+\S+/m.test(text)) return true;
  if (/^(\s*[-*+])\s+\S+/m.test(text)) return true;
  if (/^\s*\d+\.\s+\S+/m.test(text)) return true;
  if (/^>\s+\S+/m.test(text)) return true;
  if (/\*\*[^*\n]+\*\*|__[^_\n]+__/.test(text)) return true;
  if (/`[^`\n]+`/.test(text)) return true;
  if (/\[[^\]]+\]\(https?:\/\/[^\s)]+\)/.test(text)) return true;
  if (/^(\*{3,}|-{3,})$/m.test(text)) return true;

  return false;
}

export function parseMarkdownToHtml(markdown: string): string {
  if (!markdown) return "";
  return marked.parse(markdown) as string;
}

export function handleMarkdownShortcuts(
  e: React.KeyboardEvent<HTMLDivElement>,
  onContentChange: () => void
): boolean {
  if (e.key === "Tab") {
    e.preventDefault();
    document.execCommand("insertText", false, "    ");
    onContentChange();
    return true;
  }

  if (e.key !== " ") {
    return false;
  }

  const selection = window.getSelection();
  if (!selection || !selection.isCollapsed) return false;

  const anchorNode = selection.anchorNode;
  if (!anchorNode || anchorNode.nodeType !== Node.TEXT_NODE) return false;

  const textBefore = anchorNode.textContent?.slice(0, selection.anchorOffset) || "";

  const applyBlockShortcut = (prefix: string, command: string, value?: string) => {
    e.preventDefault();
    const fullText = anchorNode.textContent || "";
    anchorNode.textContent = fullText.slice(prefix.length);
    document.execCommand(command, false, value);
    onContentChange();
    return true;
  };

  if (textBefore === "#") {
    return applyBlockShortcut("#", "formatBlock", "<h1>");
  }
  if (textBefore === "##") {
    return applyBlockShortcut("##", "formatBlock", "<h2>");
  }
  if (textBefore === "###") {
    return applyBlockShortcut("###", "formatBlock", "<h3>");
  }
  if (textBefore === "-" || textBefore === "*") {
    return applyBlockShortcut(textBefore, "insertUnorderedList");
  }
  if (textBefore === "1.") {
    return applyBlockShortcut("1.", "insertOrderedList");
  }
  if (textBefore === ">") {
    return applyBlockShortcut(">", "formatBlock", "<blockquote>");
  }

  return false;
}
