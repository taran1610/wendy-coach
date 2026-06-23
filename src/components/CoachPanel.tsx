"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { todayISO } from "@/lib/stats";

type MessageAttachment = {
  name: string;
  kind: "image" | "pdf";
  previewUrl?: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  attachments?: MessageAttachment[];
};

type PendingAttachment = {
  id: string;
  file: File;
  previewUrl?: string;
};

const ACCEPTED_FILE_TYPES =
  "image/jpeg,image/png,image/webp,image/gif,application/pdf,.pdf";

function fileKind(file: File): "image" | "pdf" {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
    ? "pdf"
    : "image";
}

export function CoachPanel() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingFiles, setPendingFiles] = useState<PendingAttachment[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      pendingFiles.forEach((file) => {
        if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
      });
    };
  }, [pendingFiles]);

  function resizeTextarea() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return;

    const next = [...pendingFiles];

    for (const file of Array.from(fileList)) {
      if (next.length >= 3) {
        setError("You can attach up to 3 files per message.");
        break;
      }

      const kind = fileKind(file);
      const previewUrl = kind === "image" ? URL.createObjectURL(file) : undefined;
      next.push({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        previewUrl,
      });
    }

    setPendingFiles(next);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePendingFile(id: string) {
    setPendingFiles((current) => {
      const target = current.find((file) => file.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return current.filter((file) => file.id !== id);
    });
  }

  async function sendMessage(e?: FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if ((!text && pendingFiles.length === 0) || loading) return;

    const sentAttachments: MessageAttachment[] = pendingFiles.map((item) => ({
      name: item.file.name,
      kind: fileKind(item.file),
      previewUrl: item.previewUrl,
    }));

    const attachmentNote = sentAttachments
      .map((file) => (file.kind === "pdf" ? `[PDF: ${file.name}]` : `[Image: ${file.name}]`))
      .join(" ");

    const userMessage: ChatMessage = {
      role: "user",
      content: text || attachmentNote,
      attachments: sentAttachments.length ? sentAttachments : undefined,
    };

    const nextMessages = [...messages, userMessage];
    const filesToSend = pendingFiles.map((item) => item.file);

    setInput("");
    setPendingFiles([]);
    setError("");
    setMessages(nextMessages);
    setLoading(true);
    resizeTextarea();

    const formData = new FormData();
    formData.append("message", text);
    formData.append("date", todayISO());
    formData.append(
      "history",
      JSON.stringify(messages.map((m) => ({ role: m.role, content: m.content })))
    );
    filesToSend.forEach((file) => formData.append("files", file));

    const res = await fetch("/api/coach", {
      method: "POST",
      body: formData,
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong. Try again.");
      setMessages(messages);
      setInput(text);
      setPendingFiles(
        filesToSend.map((file) => ({
          id: `${file.name}-${file.lastModified}-${Math.random()}`,
          file,
          previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
        }))
      );
      return;
    }

    const data = await res.json();
    setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }

  const canSend = Boolean(input.trim() || pendingFiles.length);

  return (
    <div className="flex flex-col h-[calc(100dvh-2.5rem)] lg:h-[calc(100dvh-4rem)] -m-5 lg:-m-8">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
          {messages.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--gold)] flex items-center justify-center text-[var(--accent-on-gradient)] font-bold text-2xl mb-4">
                W
              </div>
              <h1 className="text-2xl font-semibold mb-2">Wendy Coach</h1>
              <p className="text-[var(--muted)] max-w-md text-sm">
                Ask about your trading, upload chart screenshots, or attach PDFs for Wendy to
                analyze.
              </p>
            </div>
          ) : null}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" ? (
                <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--gold)] flex items-center justify-center text-[var(--accent-on-gradient)] font-bold text-sm">
                  W
                </div>
              ) : null}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-[var(--hover-bg)] text-[var(--foreground)]"
                    : "bg-transparent text-[var(--foreground)]"
                }`}
              >
                {msg.attachments?.length ? (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {msg.attachments.map((file) =>
                      file.kind === "image" && file.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={file.name}
                          src={file.previewUrl}
                          alt={file.name}
                          className="max-h-40 rounded-lg border border-[var(--card-border)]"
                        />
                      ) : (
                        <span
                          key={file.name}
                          className="inline-flex items-center rounded-full bg-[var(--surface-muted)] border border-[var(--card-border)] px-3 py-1 text-xs"
                        >
                          PDF · {file.name}
                        </span>
                      )
                    )}
                  </div>
                ) : null}
                {msg.content}
              </div>
            </div>
          ))}

          {loading ? (
            <div className="flex gap-4">
              <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--gold)] flex items-center justify-center text-[var(--accent-on-gradient)] font-bold text-sm">
                W
              </div>
              <p className="text-sm text-[var(--muted)] py-2">Wendy is thinking...</p>
            </div>
          ) : null}

          {error ? <p className="text-sm text-[var(--danger)] text-center">{error}</p> : null}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-[var(--card-border)] bg-[color-mix(in_srgb,var(--background)_95%,transparent)] backdrop-blur-sm p-4">
        {pendingFiles.length ? (
          <div className="mx-auto max-w-3xl mb-3 flex flex-wrap gap-2">
            {pendingFiles.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--surface-muted)] px-3 py-2 text-xs"
              >
                {item.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.previewUrl} alt={item.file.name} className="h-8 w-8 rounded object-cover" />
                ) : (
                  <span className="font-semibold text-[var(--accent)]">PDF</span>
                )}
                <span className="max-w-[140px] truncate">{item.file.name}</span>
                <button
                  type="button"
                  className="text-[var(--muted)] hover:text-[var(--foreground)]"
                  onClick={() => removePendingFile(item.id)}
                  aria-label={`Remove ${item.file.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <form
          onSubmit={sendMessage}
          className="mx-auto max-w-3xl flex items-end gap-2 rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-3 py-3 shadow-sm"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FILE_TYPES}
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
          <button
            type="button"
            className="btn btn-secondary shrink-0 rounded-xl px-3 py-2 text-sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            aria-label="Attach PDF or image"
          >
            Attach
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              resizeTextarea();
            }}
            onKeyDown={onKeyDown}
            placeholder="Message Wendy or attach a chart/PDF..."
            rows={1}
            disabled={loading}
            className="min-h-[24px] max-h-[200px] flex-1 resize-none border-0 bg-transparent p-0 focus:outline-none focus:ring-0"
          />
          <button
            type="submit"
            className="btn btn-primary shrink-0 rounded-xl px-4 py-2 text-sm disabled:opacity-40"
            disabled={loading || !canSend}
          >
            Send
          </button>
        </form>
        <p className="mx-auto max-w-3xl mt-2 text-center text-xs text-[var(--muted)]">
          Upload PDFs or images (PNG, JPG, WEBP). Max 3 files, 4 MB each. Powered by GPT-5.5.
        </p>
      </div>
    </div>
  );
}
