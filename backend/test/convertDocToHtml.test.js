import { describe, it, expect } from "vitest";
import { convertDocBufferToHtml } from "../utils/convertDocToHtml.js";

const sampleText = `Dòng 1\n\nDòng 2 với nhiều chữ`; // Vietnamese sample

describe("convertDocBufferToHtml", () => {
  it("wraps plain text into paragraphs", async () => {
    const buffer = Buffer.from(sampleText, "utf8");
    const { html } = await convertDocBufferToHtml(buffer, "sample.txt", "text/plain");
    expect(html).toContain("<p>Dòng 1</p>");
    expect(html).toContain("Dòng 2 với nhiều chữ");
  });

  it("handles markdown", async () => {
    const md = Buffer.from("# Tiêu đề\n\nNội dung", "utf8");
    const { html } = await convertDocBufferToHtml(md, "chapter.md", "text/markdown");
    expect(html).toContain("<h1");
    expect(html).toContain("Nội dung");
  });
});
