"use client";

import { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import React, { useEffect, useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { convertSelectionToMarkdownWithContext } from "@/lib/editor-minimal-context";

interface Props {
  editor: Editor;
  sendMessage: ({ message, context }: { message: string; context: string }) => Promise<void>;
}

export const CanvasAskAI = ({ editor, sendMessage }: Props) => {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [prompt, setPrompt] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();

      // If no selection or collapsed:
      // - if popover is open, keep the UI alive (don't clear position),
      // - otherwise clear position as before.
      if (!selection || selection.isCollapsed) {
        if (!open) {
          setPosition(null);
        }
        return;
      }

      const range = selection.getRangeAt(0);
      const text = selection.toString().trim();
      if (!text) {
        if (!open) setPosition(null);
        return;
      }

      // Safely extract the DOM element for the editor
      let editorEl: HTMLElement | null = null;
      const elOption = editor?.options.element;
      if (elOption instanceof HTMLElement) editorEl = elOption;
      else if (elOption && typeof elOption === "object" && "mount" in elOption) editorEl = (elOption as { mount: HTMLElement }).mount;

      // If selection is outside editor, ignore (and clear only if popover closed)
      if (!editorEl || !editorEl.contains(range.commonAncestorContainer)) {
        if (!open) setPosition(null);
        return;
      }

      const rects = range.getClientRects();
      if (!rects.length) {
        if (!open) setPosition(null);
        return;
      }

      const lastRect = rects[rects.length - 1];
      const top = lastRect.bottom + window.scrollY + 35;
      const left = lastRect.right + window.scrollX;

      // setSelectedText(text);
      setPosition({ top, left });
    };

    document.addEventListener("mouseup", handleSelection);
    // optional: also clear when user presses Escape or when editor loses focus entirely
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setPosition(null);
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mouseup", handleSelection);
      document.removeEventListener("keydown", onKey);
    };
  }, [editor, open]);

  const handleSend = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Convert current selection to markdown (uses editor.state.selection if not passed)
    const { selectionMarkdown, contextMarkdown, selection } = convertSelectionToMarkdownWithContext(editor, {
      radius: 2,
      maxNodes: 12,
      expandIfCollapsed: true,
    });

    console.log("selection:", selection);
    console.log("=== selectionMarkdown ===\n", selectionMarkdown);
    console.log("=== contextMarkdown ===\n", contextMarkdown);

    // still send the user prompt/context if you want
    sendMessage({ message: prompt, context: contextMarkdown });

    setPrompt("");
    setOpen(false);
    setPosition(null);
  };

  const handleClose = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPrompt("");
    setOpen(false);
    setPosition(null);
  };

  // If position is null but popover is open, keep rendering (precaution)
  if (!position && !open) return null;

  return (
    <div
      ref={containerRef}
      className="absolute z-50"
      style={{
        top: position?.top ?? 0,
        left: position?.left ?? 0,
        transform: "translate(-50%, -100%)",
        pointerEvents: "auto",
      }}
    >
      <Popover open={open} onOpenChange={(next) => setOpen(next)}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              // Ensure we open even if selection collapsed (we stored selectedText already)
              setOpen(true);
            }}
            className="rounded-full bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-white text-sm"
          >
            ✨ Ask AI
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-80 bg-neutral-900 border-neutral-800 text-white p-2 rounded-lg space-y-2"
          // prevent Radix default outside-interaction handlers from closing while inside
          onPointerDownOutside={(e) => {
            /* allow outside clicks to close, but we can control behavior here if needed */
          }}
          onInteractOutside={(e) => {
            // if click outside, close popover
            setOpen(false);
            setPosition(null);
          }}
        >
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What should AI do with this selection?"
            className="w-full p-2 rounded-md bg-neutral-800 resize-none focus:outline-none text-xs"
            rows={3}
            onClick={(e) => e.stopPropagation()} // prevent bubbling
          />

          <div className="flex justify-end gap-1">
            <Button
              size="sm"
              variant={"outline"}
              onClick={(e) => {
                e.stopPropagation();
                handleClose(e);
              }}
              className="text-xs h-5 rounded-sm"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleSend(e);
              }}
              disabled={!prompt.trim()}
              className="text-xs h-5 rounded-sm"
            >
              Send
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
