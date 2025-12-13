"use client";

import { useState } from "react";
import { ChatMessage, ChatMessageEdit } from "@/types";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

  async function sendMessage({ message, context }: { message: string; context?: string }) {
    if (!message.trim()) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: "user",
      content: message,
      status: "default",
    };

    const assistantId = String(Date.now() + 1);
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "Thinking...",
      preview: null,
      status: "default",
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

      // Read full body as text
      let text = await res.text();
      text = text.trim();

      let data: { summary?: string; edits?: ChatMessageEdit[] } | null = null;

      // Remove ```json fences if they exist
      if (text.startsWith("```json") && text.endsWith("```")) {
        text = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      }

      try {
        data = JSON.parse(text);
      } catch {
        // If parsing fails, treat as plain text
        data = null;
      }

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== assistantId) return m;

          if (data && (data.summary || data.edits)) {
            let mergedContent = "";

            data?.edits?.forEach((item) => {
              if (item.content) {
                mergedContent += item.content + "\n\n";
              }
            });

            // Structured edit response
            return {
              ...m,
              content: data.summary || "",
              isStreaming: false,
              preview: mergedContent ? { data: mergedContent } : undefined,
              edits: data.edits,
            };
          } else {
            // Plain text response
            return {
              ...m,
              content: text,
              isStreaming: false,
              preview: undefined,
              edits: undefined,
            };
          }
        })
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("sendMessage error:", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.role === "assistant"
            ? {
                ...m,
                content: `Error: ${err.message || String(err)}`,
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      setIsSending(false);
    }
  }

  return { messages, setMessages, sendMessage, isSending };
}
