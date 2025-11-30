"use client";

import React from "react";
import { cn } from "@/lib/utils";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import ReactMarkdown from "react-markdown";
import type { ChatMessage } from "@/hooks/use-chat";
import { Card, CardContent } from "@/components/ui/card";
import ChatRendererConversationPreview from "./chat-renderer-conversation-preview";

export default function ChatRendererConversation({ messages, setMessages }: { messages: ChatMessage[]; setMessages: (updater: ((prev: ChatMessage[]) => ChatMessage[]) | ChatMessage[]) => void }) {
  if (!messages.length) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6 pb-64">
      {messages.map((msg) => (
        <Card key={msg.id} className={cn("p-0 relative w-fit max-w-[80%] text-white rounded-xl transition-all duration-200", msg.role === "user" ? "ml-auto bg-neutral-800 border-neutral-700 rounded-br-sm" : "mr-auto bg-neutral-900 border-neutral-800 rounded-bl-sm")}>
          <CardContent className="py-2 px-2">
            <div className="text-sm leading-relaxed whitespace-pre-wrap prose prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  p: ({ children }) => <p className="mb-0 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-0">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-0">{children}</ol>,
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>

            {msg.preview && (
              <div className="mt-4">
                <ChatRendererConversationPreview data={msg.preview.data} onApply={() => {}} onDismiss={() => setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, preview: undefined } : m)))} />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
