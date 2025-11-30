"use client";

import katex from "katex";
import { markdownToHtml } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import React, { useEffect, useRef } from "react";
import { ForwardIcon, XIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useEditorContent } from "@/providers/editor-content-provider";

interface ChatRendererConversationPreviewProps {
  data?: string | null;
  onApply?: () => void;
  onDismiss?: () => void;
}

export default function ChatRendererConversationPreview({ data, onApply, onDismiss }: ChatRendererConversationPreviewProps) {
  const { setEditorContent } = useEditorContent();
  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!previewRef.current) return;
    if (!data) {
      previewRef.current.innerHTML = "";
      return;
    }

    const html = markdownToHtml(String(data));
    previewRef.current.innerHTML = html;

    // render math
    const nodes = previewRef.current.querySelectorAll<HTMLElement>('[data-type="inline-math"], [data-type="block-math"]');
    nodes.forEach((node) => {
      const latex = node.getAttribute("data-latex") || "";
      const displayMode = node.getAttribute("data-type") === "block-math";
      try {
        katex.render(latex, node, { displayMode, throwOnError: false });
      } catch {
        node.textContent = latex;
      }
    });
  }, [data]);

  const apply = () => {
    if (!data) return;

    setEditorContent(data);

    onApply?.();
  };

  return (
    <div className="space-y-3">
      <Card className="bg-neutral-900/60 border border-neutral-700 rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="p-3 text-xs text-neutral-400 border-b border-neutral-800 uppercase tracking-wider">Preview</CardHeader>

        <CardContent className="p-4 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
          <div
            ref={previewRef}
            className="
              prose prose-invert max-w-none text-xs leading-relaxed text-neutral-200
              prose-headings:font-semibold prose-headings:text-neutral-100 prose-headings:tracking-tight
              prose-h1:text-lg prose-h2:text-sm prose-h3:text-xs
              prose-h1:leading-0 prose-h2:leading-0 prose-hr:my-2 prose-hr:border-neutral-800
              prose-p:text-neutral-300 prose-strong:text-neutral-100 prose-em:text-neutral-300
              prose-ul:list-disc prose-ul:pl-3 prose-li:marker:text-neutral-500
              prose-blockquote:border-l-2 prose-blockquote:border-neutral-700 prose-blockquote:pl-4 prose-blockquote:text-neutral-400
              prose-code:bg-neutral-800 prose-code:text-neutral-100 prose-code:px-1 prose-code:rounded-sm
              prose-pre:bg-neutral-900 prose-pre:p-2 prose-pre:rounded-md prose-pre:text-neutral-200
              prose-a:text-blue-400 hover:prose-a:text-blue-300 transition-colors
            "
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 items-center">
        <Button variant="ghost" size="sm" onClick={onDismiss} className="h-6 px-2 text-[11px] rounded-sm text-neutral-300 hover:bg-neutral-800 hover:text-white">
          <XIcon size={12} className="mr-0.5" />
          Dismiss
        </Button>

        <Button size="sm" onClick={apply} className="h-6 px-2 text-[11px] rounded-sm bg-neutral-300 hover:bg-neutral-400">
          <ForwardIcon size={12} className="mr-0.5" />
          Apply
        </Button>
      </div>
    </div>
  );
}
