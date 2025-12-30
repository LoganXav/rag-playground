"use client";

import { useAtom } from "jotai";
import { cn } from "@/lib/utils";
import remarkMath from "remark-math";
import { ChatMessage } from "@/types";
import rehypeKatex from "rehype-katex";
import ReactMarkdown from "react-markdown";
import { editorAtom } from "@/store/editor";
import React, { Dispatch, SetStateAction } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useSyncContent } from "@/hooks/use-sync-content";
import { applyEditsToMarkdown } from "@/lib/apply-edits";
import ChatRendererConversationPreview from "./chat-renderer-conversation-preview";
import { migrateMathStrings } from "@tiptap/extension-mathematics";

export default function ChatRendererConversation({
  messages,
  setMessages,
}: {
  messages: ChatMessage[];
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
}) {
  const [editor] = useAtom(editorAtom);

  const { syncMarkdownContent } = useSyncContent();

  if (!messages.length) {
    return null;
  }

  const handleApplyEdits = (msg: ChatMessage) => {
    const edits = msg.edits;
    if (!editor || !edits) return;

    const currentMarkdown =
      window.localStorage.getItem("vesper-markdown") ?? "";

    const updatedMarkdown = applyEditsToMarkdown(currentMarkdown, edits);

    editor.commands.setContent(updatedMarkdown);

    migrateMathStrings(editor);

    syncMarkdownContent(updatedMarkdown);

    setMessages((prev) =>
      prev.map((m) =>
        m.id === msg.id
          ? {
              ...m,
              status: "used",
            }
          : m,
      ),
    );
  };

  return (
    <div className="flex flex-col gap-6 pb-64">
      {messages.map((msg) => (
        <Card
          key={msg.id}
          className={cn(
            "p-0 relative w-fit max-w-[80%] text-white rounded-xl transition-all duration-200",
            msg.role === "user"
              ? "ml-auto bg-neutral-800 border-neutral-700 rounded-br-sm"
              : "mr-auto bg-neutral-900 border-neutral-800 rounded-bl-sm",
          )}
        >
          <CardContent className="py-2 px-2">
            <div className="prose prose-invert max-w-none text-sm leading-relaxed prose-p:my-0 prose-li:my-0 prose-ul:pl-0 prose-ol:pl-0">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {msg.content.replace(/\n/g, "  \n")}
              </ReactMarkdown>
            </div>

            {msg.preview && (
              <div className="mt-4">
                <ChatRendererConversationPreview
                  data={msg.preview.data}
                  status={msg.status}
                  onApply={() => handleApplyEdits(msg)}
                  onDismiss={() =>
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === msg.id ? { ...m, status: "dismissed" } : m,
                      ),
                    )
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
