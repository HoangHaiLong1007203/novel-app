import mammoth from "mammoth";
import { marked } from "marked";

export async function convertDocBufferToHtml(buffer, originalname = "file", mimetype = "") {
  const lower = originalname.toLowerCase();
  try {
    if (lower.endsWith(".docx") || mimetype.includes("openxmlformats")) {
      const result = await mammoth.convertToHtml({ buffer });
      return { html: result.value, messages: result.messages };
    }

    // .md
    if (lower.endsWith(".md") || mimetype === "text/markdown") {
      const text = buffer.toString("utf8");
      return { html: marked.parse(text), messages: [] };
    }

    // .html
    if (lower.endsWith(".html") || mimetype === "text/html") {
      return { html: buffer.toString("utf8"), messages: [] };
    }

    // .txt or other fallback
    const text = buffer.toString("utf8");
    // convert simple paragraphs to HTML
    const escaped = text
      .split(/\r?\n\r?\n/)
      .map((p) => `<p>${p.replace(/\n/g, "<br />")}</p>`)
      .join("\n");
    return { html: escaped, messages: [] };
  } catch (err) {
    // fallback to plain text
    const text = buffer.toString("utf8");
    const escaped = text
      .split(/\r?\n\r?\n/)
      .map((p) => `<p>${p.replace(/\n/g, "<br />")}</p>`)
      .join("\n");
    return { html: escaped, messages: [{ type: "error", message: err.message }] };
  }
}

export default convertDocBufferToHtml;
