import { NextResponse } from "next/server";
import { chatWithWendy } from "@/lib/coach";
import { processCoachAttachments, type CoachAttachmentInput } from "@/lib/coach-attachments";
import { todayISO } from "@/lib/stats";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const message = String(formData.get("message") ?? "").trim();
      const date = String(formData.get("date") ?? todayISO());
      const historyRaw = String(formData.get("history") ?? "[]");
      const history = JSON.parse(historyRaw) as { role: "user" | "assistant"; content: string }[];

      const fileEntries = formData
        .getAll("files")
        .filter((entry): entry is File => entry instanceof File && entry.size > 0);

      if (!message && fileEntries.length === 0) {
        return NextResponse.json({ error: "Message or file is required" }, { status: 400 });
      }

      const attachmentInputs: CoachAttachmentInput[] = await Promise.all(
        fileEntries.map(async (file) => ({
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          buffer: Buffer.from(await file.arrayBuffer()),
        }))
      );

      const attachments = await processCoachAttachments(attachmentInputs);
      const reply = await chatWithWendy(message, date, history, attachments);
      return NextResponse.json({ reply });
    }

    const body = await request.json();
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const date = body.date ?? todayISO();
    const history = Array.isArray(body.history) ? body.history : [];

    const reply = await chatWithWendy(message, date, history);
    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Coach request failed" },
      { status: 400 }
    );
  }
}
