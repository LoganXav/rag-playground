"use client";

import React, { createContext, useContext, useState } from "react";

type ContextType = {
  appliedContent: string;
  setEditorContent: (md: string) => void;
  undo: () => void;
};

const EditorContentContext = createContext<ContextType | null>(null);

export const EditorContentProvider = ({ children }: { children: React.ReactNode }) => {
  const [appliedContent, setAppliedContentState] = useState<string>("");
  const [history, setHistory] = useState<string[]>([]);

  const setEditorContent = (md: string) => {
    setHistory((h) => [...h, appliedContent]);
    setAppliedContentState(md);
  };

  const undo = () => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const last = h[h.length - 1];
      setAppliedContentState(last);
      return h.slice(0, -1);
    });
  };

  return <EditorContentContext.Provider value={{ appliedContent, setEditorContent, undo }}>{children}</EditorContentContext.Provider>;
};

export function useEditorContent() {
  const ctx = useContext(EditorContentContext);
  if (!ctx) throw new Error("useEditorContent must be used inside EditorContentProvider");
  return ctx;
}
