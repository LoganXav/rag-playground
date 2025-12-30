import { atom, createStore } from "jotai";
import type { Editor } from "@tiptap/react";
import type { Range } from "@tiptap/core";

/**
 * Global atom holding the TipTap Editor instance.
 * Set in CanvasRenderer onCreate/onUpdate and consumed by preview/apply UI.
 */
export const editorAtom = atom<Editor | null>(null);
export const queryAtom = atom("");
export const rangeAtom = atom<Range | null>(null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const editorStore: any = createStore();
export * from "jotai";
