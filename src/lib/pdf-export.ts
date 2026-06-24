import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 50;
const FONT_SIZE = 11;
const LINE_HEIGHT = 14;

function wrapText(text: string, maxWidth: number, measure: (line: string) => number): string[] {
  const lines: string[] = [];

  for (const paragraph of text.split("\n")) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }

    const words = paragraph.split(/\s+/);
    let current = "";

    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (measure(next) > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = next;
      }
    }

    if (current) lines.push(current);
  }

  return lines;
}

export async function createPdfFromText(title: string, content: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const maxWidth = PAGE_WIDTH - MARGIN * 2;

  const measure = (line: string) => font.widthOfTextAtSize(line, FONT_SIZE);
  const bodyLines = wrapText(content, maxWidth, measure);
  const titleLines = wrapText(title, maxWidth, (line) =>
    boldFont.widthOfTextAtSize(line, 16)
  );

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  for (const line of titleLines) {
    if (y < MARGIN + 40) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
    page.drawText(line, {
      x: MARGIN,
      y,
      size: 16,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 22;
  }

  y -= 10;

  for (const line of bodyLines) {
    if (y < MARGIN) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }

    if (line) {
      page.drawText(line, {
        x: MARGIN,
        y,
        size: FONT_SIZE,
        font,
        color: rgb(0.15, 0.15, 0.15),
      });
    }

    y -= LINE_HEIGHT;
  }

  return pdfDoc.save();
}

export async function downloadTextAsPdf(filename: string, title: string, content: string) {
  const bytes = await createPdfFromText(title, content);
  const blob = new Blob([Uint8Array.from(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

export function userRequestedPdf(text: string): boolean {
  return /\b(generate|create|make|export|download|turn\s+this\s+into)\b[\s\S]{0,40}\bpdf\b/i.test(
    text
  ) || /\bpdf\b[\s\S]{0,40}\b(generate|create|make|export|download)\b/i.test(text);
}
