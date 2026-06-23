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

export function validateCoachAttachments(files: CoachAttachmentInput[]): void {
  if (files.length > MAX_FILES) {
    throw new Error(`You can attach up to ${MAX_FILES} files per message.`);
  }

  for (const file of files) {
    if (file.buffer.byteLength > MAX_FILE_BYTES) {
      throw new Error(`${file.name} is too large. Max size is 4 MB per file.`);
    }

    const allowed =
      IMAGE_MIME_TYPES.has(file.mimeType) || PDF_MIME_TYPES.has(file.mimeType);

    if (!allowed) {
      throw new Error(`${file.name} is not supported. Upload PDF or image files only.`);
    }
  }
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();

  const text = result.text?.trim() ?? "";

  if (!text) {
    throw new Error("Could not read text from that PDF. Try a screenshot instead.");
  }

  return text.slice(0, 12000);
}

export async function processCoachAttachments(
  files: CoachAttachmentInput[]
): Promise<ProcessedCoachAttachment[]> {
  validateCoachAttachments(files);

  const processed: ProcessedCoachAttachment[] = [];

  for (const file of files) {
    if (IMAGE_MIME_TYPES.has(file.mimeType)) {
      const base64 = file.buffer.toString("base64");
      processed.push({
        name: file.name,
        kind: "image",
        mimeType: file.mimeType,
        dataUrl: `data:${file.mimeType};base64,${base64}`,
      });
      continue;
    }

    if (PDF_MIME_TYPES.has(file.mimeType)) {
      const text = await extractPdfText(file.buffer);
      processed.push({
        name: file.name,
        kind: "pdf",
        mimeType: file.mimeType,
        text,
      });
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
