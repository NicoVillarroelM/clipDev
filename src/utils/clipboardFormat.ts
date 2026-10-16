export interface FormattedClipboardData {
  text: string;
  html: string;
}

export function formatNoteForClipboard(
  htmlContent: string,
  editorElement?: HTMLElement | null
): FormattedClipboardData {
  const sourceHtml = editorElement?.innerHTML || htmlContent || "";
  if (!sourceHtml.trim()) {
    return { text: "", html: "" };
  }

  const isHtml = /<[a-z][\s\S]*>/i.test(sourceHtml);
  if (!isHtml) {
    const plain = sourceHtml.trim();
    return {
      text: plain,
      html: plain.replace(/\n/g, "<br>"),
    };
  }

  const htmlContainer = document.createElement("div");
  htmlContainer.innerHTML = sourceHtml;

  const images = htmlContainer.querySelectorAll("img");
  images.forEach((img) => {
    img.removeAttribute("data-selected");
    img.style.maxWidth = "100%";
    img.style.height = "auto";
  });

  const cleanHtml = htmlContainer.innerHTML;

  const textContainer = document.createElement("div");
  textContainer.innerHTML = sourceHtml;

  textContainer.querySelectorAll("ol").forEach((ol) => {
    const lis = ol.querySelectorAll(":scope > li");
    lis.forEach((li, idx) => {
      li.textContent = `${idx + 1}. ${li.textContent?.trim() || ""}\n`;
    });
  });

  textContainer.querySelectorAll("ul").forEach((ul) => {
    const lis = ul.querySelectorAll(":scope > li");
    lis.forEach((li) => {
      li.textContent = `• ${li.textContent?.trim() || ""}\n`;
    });
  });

  textContainer.querySelectorAll("blockquote").forEach((q) => {
    const lines = (q.textContent || "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => `> ${l}`)
      .join("\n");
    q.textContent = `\n${lines}\n`;
  });

  textContainer.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((h) => {
    const title = h.textContent?.trim() || "";
    h.textContent = `\n${title}\n\n`;
  });

  textContainer.querySelectorAll("p").forEach((p) => {
    const pText = p.textContent?.trim() || "";
    p.textContent = `${pText}\n\n`;
  });

  textContainer.querySelectorAll("div").forEach((d) => {
    if (d.parentElement === textContainer) {
      const dText = d.textContent || "";
      d.textContent = `${dText}\n`;
    }
  });

  textContainer.querySelectorAll("br").forEach((br) => {
    br.replaceWith("\n");
  });

  textContainer.querySelectorAll("img").forEach((img) => {
    const alt = img.getAttribute("alt") || "Imagen";
    img.replaceWith(` [${alt}] `);
  });

  let plainText = textContainer.innerText || textContainer.textContent || "";

  plainText = plainText
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!plainText && editorElement) {
    plainText = (editorElement.innerText || "").trim();
  }

  return {
    text: plainText,
    html: cleanHtml,
  };
}
