"use client";

import "@/styles/editor.css";
import React, { useEffect, useState } from "react";
import { useSetAtom } from "jotai";
import { editorAtom } from "@/store/editor";
import { useChat } from "@/hooks/use-chat";
import { useEditorContent } from "@/providers/editor-content-provider";
import { CanvasRendererControls } from "./canvas-renderer-controls";
// import { CanvasAskAI } from "./canvas-ask-ai";

import { Editor, EditorContent, JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Math, { migrateMathStrings } from "@tiptap/extension-mathematics";
import { nodeIdPlugin } from "@/lib/editor-node-id-plugin";
import { markdownToHtml } from "@/lib/utils";
import CharacterCount from "@tiptap/extension-character-count";
import { Markdown } from "tiptap-markdown";

import { useDebouncedCallback } from "use-debounce";

import DragHandle from "@tiptap/extension-drag-handle-react";
import { GripVerticalIcon } from "lucide-react";
import { useSyncContent } from "@/hooks/use-sync-content";

export const CanvasRenderer = () => {
  const setEditorAtom = useSetAtom(editorAtom);
  const { appliedContent } = useEditorContent();
  const { messages, sendMessage } = useChat();

  const [editor, setEditor] = useState<Editor | null>(null);
  const [isEditable, setIsEditable] = useState(true);

  const [initialContent, setInitialContent] = useState<null | JSONContent>(null);
  const [saveStatus, setSaveStatus] = useState("Saved");
  const [charsCount, setCharsCount] = useState();

  const { syncMarkdownContent } = useSyncContent();

  const debouncedUpdates = useDebouncedCallback(async (editor) => {
    const json = editor.getJSON();
    setCharsCount(editor.storage.characterCount.words());

    window.localStorage.setItem("vesper-html-content", editor.getHTML());
    window.localStorage.setItem("vesper-structured-content", JSON.stringify(json));
    window.localStorage.setItem("vesper-markdown", editor.storage.markdown.getMarkdown());

    syncMarkdownContent(editor.storage.markdown.getMarkdown());
    setSaveStatus("Saved");
  }, 1500);

  // Set initial content from local storage on page load.
  useEffect(() => {
    const content = window.localStorage.getItem("vesper-structured-content");

    if (content) {
      setInitialContent(JSON.parse(content));
    } else {
      setInitialContent({});
    }
  }, []);

  // Initialize TipTap editor immediately on mount
  useEffect(() => {
    const instance = new Editor({
      extensions: [
        StarterKit.configure({ codeBlock: false }),
        Placeholder.configure({
          placeholder: "Start creating your notes...",
        }),
        Math.configure({
          blockOptions: {
            onClick: (node, pos) => {
              const newCalc = prompt("Enter new block math expression:", node.attrs.latex);
              if (newCalc) {
                instance.chain().setNodeSelection(pos).updateBlockMath({ latex: newCalc }).focus().run();
              }
            },
          },
          inlineOptions: {
            onClick: (node, pos) => {
              const newCalc = prompt("Enter new inline math expression:", node.attrs.latex);
              if (newCalc) {
                instance.chain().setNodeSelection(pos).updateInlineMath({ latex: newCalc }).focus().run();
              }
            },
          },
        }),
        CharacterCount,
        Markdown.configure({
          html: true,
          transformCopiedText: true,
        }),
      ],
      content: initialContent,
      editable: true,
      onCreate: ({ editor }) => {
        migrateMathStrings(editor);
        editor.registerPlugin(nodeIdPlugin());
        setEditorAtom(editor);
      },
      onUpdate: ({ editor }) => {
        setEditorAtom(editor);

        debouncedUpdates(editor);
        setSaveStatus("Unsaved");
      },
      onDestroy: () => {
        setEditorAtom(null);
      },
    });

    setEditor(instance);
    setEditorAtom(instance);

    return () => instance.destroy();
  }, [setEditorAtom, debouncedUpdates, initialContent]);

  // Handle appliedContent (insert AI-suggested markdown)
  useEffect(() => {
    if (editor && appliedContent) {
      const htmlChunk = markdownToHtml(appliedContent);
      editor.commands.insertContent(htmlChunk);
    }
  }, [appliedContent, editor]);

  if (!editor) return <div>Loading editor…</div>;

  return (
    <>
      <div className="p-0 lg:p-6 lg:px-10 relative">
        {/* Floating editor controls */}
        <div className="fixed z-30 right-3 top-1/2 -translate-y-1/2">
          <CanvasRendererControls editor={editor} isEditable={isEditable} setIsEditable={setIsEditable} />
        </div>

        {/* Counts */}
        <div className="flex justify-end sticky right-5 top-[1px] z-10 mb-5 gap-2">
          <div className="rounded-xl bg-neutral-700 px-2 py-1 text-xs text-white">{saveStatus}</div>
          <div className={charsCount ? "rounded-xl px-2 py-1 text-xs text-white bg-neutral-700" : "hidden"}>{charsCount} Words</div>
        </div>

        {/* Main editor area */}
        <DragHandle editor={editor}>
          <GripVerticalIcon strokeWidth={1} />
        </DragHandle>
        <div className="tiptap text-white">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Ask AI popover */}
      {/* <CanvasAskAI sendMessage={sendMessage} editor={editor} /> */}
    </>
  );
};
