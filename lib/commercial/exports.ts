import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { documentLines, type QuoteDocument } from "./quote";
const xml = (s: string) =>
  s.replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
export function wrapText(text: string, maxChars = 90): string[] {
  return text.split("\n").flatMap((part) => {
    if (!part) return [""];
    const lines: string[] = [];
    let current = "";
    for (const word of part.split(/\s+/)) {
      if (current.length + word.length + 1 > maxChars && current) {
        lines.push(current);
        current = "";
      }
      for (let offset = 0; offset < word.length; offset += maxChars) {
        const chunk = word.slice(offset, offset + maxChars);
        if (offset > 0 && current) {
          lines.push(current);
          current = "";
        }
        current += (current ? " " : "") + chunk;
      }
    }
    if (current) lines.push(current);
    return lines;
  });
}
export async function quotePdf(doc: QuoteDocument) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(
    await readFile(
      path.join(process.cwd(), "public/fonts/NotoSans-Regular.ttf"),
    ),
    { subset: true },
  );
  const logo = await pdf.embedPng(
    await sharp(
      await readFile(path.join(process.cwd(), "public/logo-horizontal.png")),
    )
      .png()
      .toBuffer(),
  );
  let page = pdf.addPage([595, 842]);
  let y = 750;
  page.drawImage(logo, { x: 40, y: 775, width: 100, height: 40 });
  for (const line of documentLines(doc).flatMap((l) => wrapText(l, 86))) {
    if (y < 45) {
      page = pdf.addPage([595, 842]);
      y = 795;
    }
    page.drawText(line, {
      x: 40,
      y,
      size: 10,
      font,
      color: rgb(0.055, 0.133, 0.251),
    });
    y -= 16;
  }
  pdf.setTitle(`${doc.folio} revisión ${doc.revision}`);
  return pdf.save();
}
export async function quotePng(doc: QuoteDocument) {
  const lines = documentLines(doc).flatMap((l) => wrapText(l, 66));
  const height = 180 + lines.length * 35;
  const logo = (
    await readFile(path.join(process.cwd(), "public/logo-horizontal.png"))
  ).toString("base64");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${height}"><rect width="1080" height="${height}" fill="white"/><image href="data:image/png;base64,${logo}" x="48" y="25" width="170" height="70"/><g fill="#0e2240" font-family="Arial, sans-serif" font-size="25">${lines.map((l, i) => `<text x="48" y="${145 + i * 35}">${xml(l)}</text>`).join("")}</g></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}
