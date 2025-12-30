"use client";

import "@/styles/editor.css";
import React, { useEffect, useRef, useState } from "react";
import { useSetAtom } from "jotai";
import { editorAtom } from "@/store/editor";
import { useChat } from "@/hooks/use-chat";
import { useEditorContent } from "@/providers/editor-content-provider";
import { CanvasRendererControls } from "./canvas-renderer-controls";
import { CanvasAskAI } from "./canvas-ask-ai";

import { Editor, JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Math, { migrateMathStrings } from "@tiptap/extension-mathematics";
import { markdownToHtml } from "@/lib/utils";
import CharacterCount from "@tiptap/extension-character-count";
import { Markdown } from "tiptap-markdown";

import { useDebouncedCallback } from "use-debounce";

import DragHandle from "@tiptap/extension-drag-handle-react";
import { GripVerticalIcon } from "lucide-react";
import { useSyncContent } from "@/hooks/use-sync-content";
import { EditorContent, EditorRoot } from "@/components/ui/editor";
import { nodeIdPlugin } from "@/lib/editor-node-id-plugin";
import { EditorCommand, EditorCommandList } from "@/components/ui/editor-command";
import EditorCommandItem, { EditorCommandEmpty } from "@/components/ui/editor-command-item";
import { slashCommand, suggestionItems } from "@/lib/slash-suggested-items";

export const CanvasRenderer = () => {
  const setEditorAtom = useSetAtom(editorAtom);
  const { appliedContent } = useEditorContent();
  const { sendMessage } = useChat();

  const [editor, setEditor] = useState<Editor | null>(null);
  const editorRef = useRef<Editor | null>(null);

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

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  const extensions = [
    StarterKit.configure({ codeBlock: false }),
    Placeholder.configure({
      placeholder: "Start creating your notes. Press '/' for quick commands.",

      // placeholder: ({ node }) => {
      //   if (node.type.name === "heading") {
      //     return `Heading ${node.attrs.level}`;
      //   }
      //   return "Press '/' for commands";
      // },
      // includeChildren: true,
      // showOnlyCurrent: true,
    }),
    Math.configure({
      blockOptions: {
        onClick: (node, pos) => {
          const newCalc = prompt("Enter new block math expression:", node.attrs.latex);
          if (newCalc && editorRef.current) {
            editorRef.current.chain().setNodeSelection(pos).updateBlockMath({ latex: newCalc }).focus().run();
          }
        },
      },
      inlineOptions: {
        onClick: (node, pos) => {
          const newCalc = prompt("Enter new inline math expression:", node.attrs.latex);
          if (newCalc && editorRef.current) {
            editorRef.current.chain().setNodeSelection(pos).updateInlineMath({ latex: newCalc }).focus().run();
          }
        },
      },
    }),
    CharacterCount,
    Markdown.configure({
      html: true,
      transformCopiedText: true,
    }),
    slashCommand,
  ];

  // Set initial content from local storage on page load.
  useEffect(() => {
    const content = window.localStorage.getItem("vesper-structured-content");

    if (content) {
      setInitialContent(JSON.parse(content));
    } else {
      setInitialContent({});
    }
  }, []);

  // Handle appliedContent (insert AI-suggested markdown)
  useEffect(() => {
    if (editor && appliedContent) {
      const htmlChunk = markdownToHtml(appliedContent);
      editor.commands.insertContent(htmlChunk);
    }
  }, [appliedContent, editor]);

  if (!initialContent) return null;

  return (
    <>
      <div className="p-0 lg:p-6 lg:px-10 relative">
        {/* Floating editor controls */}
        <div className="fixed z-30 right-3 top-1/2 -translate-y-1/2">{editor && <CanvasRendererControls editor={editor} isEditable={isEditable} setIsEditable={setIsEditable} />}</div>

        {/* Counts */}
        <div className="flex justify-end sticky right-5 top-[1px] z-10 mb-5 gap-2">
          <div className="rounded-xl bg-neutral-700 px-2 py-1 text-xs text-white">{saveStatus}</div>
          <div className={charsCount ? "rounded-xl px-2 py-1 text-xs text-white bg-neutral-700" : "hidden"}>{charsCount} Words</div>
        </div>

        {/* Main editor area */}
        {editor && (
          <DragHandle editor={editor}>
            <GripVerticalIcon strokeWidth={1} />
          </DragHandle>
        )}

        <EditorRoot>
          <EditorContent
            className="tiptap text-white"
            immediatelyRender={true}
            editable={true}
            onCreate={({ editor }) => {
              migrateMathStrings(editor);
              editor.registerPlugin(nodeIdPlugin());

              setEditor(editor);
              setEditorAtom(editor);
            }}
            onUpdate={({ editor }) => {
              setEditorAtom(editor);

              debouncedUpdates(editor);
              setSaveStatus("Unsaved");
            }}
            onDestroy={() => {
              setEditor(null);
            }}
            initialContent={initialContent}
            extensions={extensions}
          >
            <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border border-neutral-700 bg-neutral-800 p-1 shadow-md transition-all">
              <EditorCommandEmpty className="px-2 text-muted-foreground">No results</EditorCommandEmpty>
              <EditorCommandList>
                {suggestionItems.map((item) => (
                  <EditorCommandItem value={item.title} onCommand={(val) => item.command(val)} className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-neutral-700 aria-selected:bg-neutral-700 hover:cursor-pointer" key={item.title}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-md border border-neutral-700 hover:bg-neutral-700 aria-selected:bg-neutral-700">{item.icon}</div>
                    <div>
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </EditorCommandItem>
                ))}
              </EditorCommandList>
            </EditorCommand>
          </EditorContent>
        </EditorRoot>
      </div>
      {/* Ask AI popover */}
      {editor && <CanvasAskAI sendMessage={sendMessage} editor={editor} />}{" "}
    </>
  );
};
