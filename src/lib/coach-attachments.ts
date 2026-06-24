export type CoachAttachmentInput = {
  name: string;
  mimeType: string;
  buffer: Buffer;
};

export type ProcessedCoachAttachment = {
  name: string;
  kind: "image" | "pdf";
  mimeType: string;
  dataUrl?: string;
  text?: string;
};

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_FILES = 3;

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const PDF_MIME_TYPES = new Set(["application/pdf"]);

const EXTENSION_MIME_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

export function resolveAttachmentMimeType(name: string, mimeType: string): string {
  const normalized = mimeType.trim().toLowerCase();

  if (normalized && normalized !== "application/octet-stream") {
    return normalized;
  }

  const extension = name.toLowerCase().split(".").pop() ?? "";
  return EXTENSION_MIME_TYPES[extension] ?? normalized;
}

export function validateCoachAttachments(files: CoachAttachmentInput[]): void {
  if (files.length > MAX_FILES) {
    throw new Error(`You can attach up to ${MAX_FILES} files per message.`);
  }

  for (const file of files) {
    if (file.buffer.byteLength > MAX_FILE_BYTES) {
      throw new Error(`${file.name} is too large. Max size is 4 MB per file.`);
    }

    const mimeType = resolveAttachmentMimeType(file.name, file.mimeType);
    const allowed =
      IMAGE_MIME_TYPES.has(mimeType) || PDF_MIME_TYPES.has(mimeType);

    if (!allowed) {
      throw new Error(
        `${file.name} is not supported. Upload a PDF or image (PNG, JPG, WEBP, GIF).`
      );
    }
  }
}

async function extractPdfContent(
  buffer: Buffer
): Promise<{ text?: string; dataUrl?: string }> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    const text = result.text?.trim() ?? "";

    if (text) {
      return { text: text.slice(0, 12000) };
    }

    const screenshot = await parser.getScreenshot({ partial: [1], scale: 1.5 });
    const page = screenshot.pages[0];

    if (page?.dataUrl) {
      return { dataUrl: page.dataUrl };
    }

    throw new Error("Could not read text from that PDF. Try a screenshot instead.");
  } finally {
    await parser.destroy();
  }
}

export async function processCoachAttachments(
  files: CoachAttachmentInput[]
): Promise<ProcessedCoachAttachment[]> {
  validateCoachAttachments(files);

  const processed: ProcessedCoachAttachment[] = [];

  for (const file of files) {
    const mimeType = resolveAttachmentMimeType(file.name, file.mimeType);

    if (IMAGE_MIME_TYPES.has(mimeType)) {
      const base64 = file.buffer.toString("base64");
      processed.push({
        name: file.name,
        kind: "image",
        mimeType,
        dataUrl: `data:${mimeType};base64,${base64}`,
      });
      continue;
    }

    if (PDF_MIME_TYPES.has(mimeType)) {
      const pdfResult = await extractPdfContent(file.buffer);

      if (pdfResult.text) {
        processed.push({
          name: file.name,
          kind: "pdf",
          mimeType,
          text: pdfResult.text,
        });
        continue;
      }

      if (pdfResult.dataUrl) {
        processed.push({
          name: file.name,
          kind: "image",
          mimeType: "image/png",
          dataUrl: pdfResult.dataUrl,
        });
      }
    }
  }

  return processed;
}

export function attachmentSummary(attachments: ProcessedCoachAttachment[]): string {
  if (attachments.length === 0) return "";

  return attachments
    .map((file) => {
      if (file.kind === "image") return `[Image: ${file.name}]`;
      return `[PDF: ${file.name}]`;
    })
    .join(" ");
}
