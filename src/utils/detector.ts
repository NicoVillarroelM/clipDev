import type { ContentType } from "../types/clip";

export function detectContentType(text: string): ContentType {
  const trimmed = text.trim();

  // Detección de Colores Hexadecimales o rgb
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)) {
    return "color";
  }
  if (/^rgba?\((\s*\d+\s*,){2}\s*\d+\s*(,\s*[\d.]+\s*)?\)$/i.test(trimmed)) {
    return "color";
  }

  // Detección de URLs
  try {
    const url = new URL(trimmed);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return "url";
    }
  } catch {
    // No es una URL estándar
  }

  // Detección de Código / Comandos
  const codePatterns = [
    /[{}();=>]/,
    /^(const|let|var|function|import|export|class|interface|type)\s+/m,
    /<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/, // HTML / JSX tags
    /^(pnpm|npm|npx|yarn|git|docker|curl|cd|ls|mkdir)\s+/, // CLI commands
    /^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP)\s+/i, // SQL
  ];

  if (codePatterns.some((pattern) => pattern.test(trimmed)) || trimmed.includes("\n")) {
    return "code";
  }

  return "text";
}
