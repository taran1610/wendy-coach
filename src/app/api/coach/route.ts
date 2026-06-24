import { NextResponse } from "next/server";
import { chatWithWendy } from "@/lib/coach";
import { processCoachAttachments, resolveAttachmentMimeType, type CoachAttachmentInput } from "@/lib/coach-attachments";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const message = String(formData.get("message") ?? "").trim();
      const historyRaw = String(formData.get("history") ?? "[]");
      let history: { role: "user" | "assistant"; content: string }[] = [];

      try {
        history = JSON.parse(historyRaw);
      } catch {
        return NextResponse.json({ error: "Invalid chat history." }, { status: 400 });
      }

      const fileEntries = formData
        .getAll("files")
        .filter((entry): entry is File => entry instanceof File && entry.size > 0);

      if (!message && fileEntries.length === 0) {
        return NextResponse.json({ error: "Message or file is required" }, { status: 400 });
      }

      const attachmentInputs: CoachAttachmentInput[] = await Promise.all(
        fileEntries.map(async (file) => ({
          name: file.name,
          mimeType: resolveAttachmentMimeType(file.name, file.type || ""),
          buffer: Buffer.from(await file.arrayBuffer()),
        }))
      );

      const attachments = attachmentInputs.length
        ? await processCoachAttachments(attachmentInputs)
        : [];

      const reply = await chatWithWendy(message, undefined, history, attachments);
      return NextResponse.json({ reply });
    }

    const body = await request.json();
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const history = Array.isArray(body.history) ? body.history : [];
    const reply = await chatWithWendy(message, undefined, history);
    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Coach request failed" },
      { status: 400 }
    );
  }
}
