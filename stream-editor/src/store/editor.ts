import { atom } from "jotai";
import type { Editor } from "@tiptap/react";

/**
 * Global atom holding the TipTap Editor instance.
 * Set in CanvasRenderer onCreate/onUpdate and consumed by preview/apply UI.
 */
export const editorAtom = atom<Editor | null>(null);
