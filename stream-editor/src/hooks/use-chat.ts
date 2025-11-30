"use client";

import { useState } from "react";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  preview?: { data: string } | null;
};

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Markers must exactly match the systemInstruction tokens:
  const PREVIEW_START = "<<<PREVIEW_START>>>";
  const PREVIEW_END = "<<<PREVIEW_END>>>";

  async function sendMessage({ message, context }: { message: string; context: string }) {
    if (!message.trim()) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: "user",
      content: message,
    };

    const assistantId = String(Date.now() + 1);
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      isStreaming: true,
      preview: undefined,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsSending(true);

    try {
      const res = await fetch("/api/chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, context }),
      });

      if (!res.ok) throw new Error(await res.text());

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const startIdx = buffer.indexOf(PREVIEW_START);
        const endIdx = buffer.indexOf(PREVIEW_END);

        if (startIdx === -1) {
          setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: buffer, isStreaming: true, preview: undefined } : m)));
        } else {
          const contentPart = buffer.slice(0, startIdx);
          const previewStart = startIdx + PREVIEW_START.length;
          const previewPart = endIdx === -1 ? buffer.slice(previewStart) : buffer.slice(previewStart, endIdx);

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: contentPart.trimEnd(),
                    isStreaming: true,
                    preview: { data: previewPart },
                  }
                : m
            )
          );
        }
      }

      // finalize stream
      const finalStart = buffer.indexOf(PREVIEW_START);
      const finalEnd = buffer.indexOf(PREVIEW_END);
      if (finalStart === -1) {
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: buffer.trim(), isStreaming: false, preview: undefined } : m)));
      } else {
        const contentFinal = buffer.slice(0, finalStart).trimEnd();
        const previewStartIdx = finalStart + PREVIEW_START.length;
        const previewFinal = finalEnd === -1 ? buffer.slice(previewStartIdx).trim() : buffer.slice(previewStartIdx, finalEnd).trim();

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: contentFinal,
                  isStreaming: false,
                  preview: previewFinal ? { data: previewFinal } : undefined,
                }
              : m
          )
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("sendMessage error:", err);
      setMessages((prev) => prev.map((m) => (m.role === "assistant" && m.isStreaming ? { ...m, content: `Error: ${err.message || String(err)}`, isStreaming: false } : m)));
    } finally {
      setIsSending(false);
    }
  }

  return { messages, setMessages, sendMessage, isSending };
}
