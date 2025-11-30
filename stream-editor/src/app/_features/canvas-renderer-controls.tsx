"use client";

import katex from "katex";
import { useState } from "react";
import "katex/dist/katex.min.css";
import { Editor } from "@tiptap/core";
import { BoldIcon, Heading1Icon, Heading2Icon, Heading3Icon, ItalicIcon, ListIcon, ListOrderedIcon, FileLock2Icon, Redo2Icon, Undo2Icon, FilePenLineIcon } from "lucide-react";

interface Props {
  isEditable: boolean;
  setIsEditable: React.Dispatch<React.SetStateAction<boolean>>;
  editor: Editor;
}

const mathExpressions = [
  { label: "Fraction", latex: "\\frac{a}{b}", info: "Represents a division of two terms." },
  { label: "Square Root", latex: "\\sqrt{x}", info: "Square root of a number or expression." },
  { label: "Exponent", latex: "x^{2}", info: "x raised to the power of 2." },
  { label: "Subscript", latex: "x_{i}", info: "Subscript notation, commonly for indices." },
  { label: "Pi", latex: "\\pi", info: "Mathematical constant ~3.14159." },
  { label: "Theta", latex: "\\theta", info: "Greek letter, often used for angles." },
  { label: "Sine", latex: "\\sin(x)", info: "Trigonometric sine function." },
  { label: "Limit", latex: "\\lim_{x \\to 0}", info: "Limit as x approaches 0." },
  { label: "Integral", latex: "\\int f(x) dx", info: "Integral of a function over x." },
  { label: "Summation", latex: "\\sum_{i=1}^{n} x_i", info: "Summation over an index range." },
];

export const CanvasRendererControls = ({ isEditable, setIsEditable, editor }: Props) => {
  const toggleEditable = () => {
    if (!editor) return;
    editor.setEditable(!isEditable);
    setIsEditable(!isEditable);
  };

  const [mathOpen, setMathOpen] = useState(false);

  const insertMath = (latex: string) => {
    editor.chain().focus().insertContent(`<span data-type="inline-math" data-latex="${latex}"></span>`).run();
    setMathOpen(false);
  };

  const btn = "px-2 py-1 rounded text-sm cursor-pointer hover:bg-neutral-700 flex justify-center";
  const active = (is: boolean) => (is ? "bg-neutral-700" : "hover:bg-neutral-700");

  return (
    <div>
      <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-1.5  toolbar gap-4 ml-3 flex flex-col relative">
        {/* Lock / Edit toggle */}
        <button type="button" className={`${btn} ${isEditable ? "hover:bg-neutral-700" : "bg-neutral-700"}`} onClick={toggleEditable}>
          {!isEditable ? <FileLock2Icon size={18} strokeWidth={1} /> : <FilePenLineIcon size={18} strokeWidth={1} />}
        </button>

        <hr className="border-neutral-700" />

        {/* Text formatting */}
        <button type="button" className={`${btn} ${active(editor.isActive("bold"))}`} onClick={() => editor.chain().focus().toggleBold().run()}>
          <BoldIcon size={18} strokeWidth={1} />
        </button>

        <button type="button" className={`${btn} ${active(editor.isActive("italic"))}`} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <ItalicIcon size={18} strokeWidth={1} />
        </button>

        <button type="button" className={`${btn} ${active(editor.isActive("heading", { level: 1 }))}`} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1Icon size={18} strokeWidth={1} />
        </button>

        <button type="button" className={`${btn} ${active(editor.isActive("heading", { level: 2 }))}`} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2Icon size={18} strokeWidth={1} />
        </button>

        <button type="button" className={`${btn} ${active(editor.isActive("heading", { level: 3 }))}`} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3Icon size={18} strokeWidth={1} />
        </button>

        <button type="button" className={`${btn} ${active(editor.isActive("bulletList"))}`} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <ListIcon size={18} strokeWidth={1} />
        </button>

        <button type="button" className={`${btn} ${active(editor.isActive("orderedList"))}`} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrderedIcon size={18} strokeWidth={1} />
        </button>

        <hr className="border-neutral-700" />

        {/* Undo/Redo */}
        <button type="button" className={`${btn} hover:bg-neutral-700`} onClick={() => editor.chain().focus().undo().run()}>
          <Undo2Icon size={18} strokeWidth={1} />
        </button>
        <button type="button" className={`${btn} hover:bg-neutral-700`} onClick={() => editor.chain().focus().redo().run()}>
          <Redo2Icon size={18} strokeWidth={1} />
        </button>

        <hr className="border-neutral-700" />

        {/* Math palette with manual hover submenu */}
        <div className="relative" onMouseEnter={() => setMathOpen(true)} onMouseLeave={() => setMathOpen(false)}>
          <button type="button" className="px-2 py-1 rounded text-sm cursor-pointer hover:bg-neutral-700">
            𝑓(x)
          </button>

          {mathOpen && (
            <div className="absolute -top-8 right-9 bg-neutral-900 border border-neutral-700 rounded p-2 flex flex-col gap-2 max-h-72 overflow-y-auto z-50">
              {mathExpressions.map((expr) => (
                <div key={expr.label} className="px-2 py-1 rounded text-sm text-left hover:bg-neutral-800 cursor-pointer" onClick={() => insertMath(expr.latex)}>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: katex.renderToString(expr.latex, {
                        throwOnError: false,
                      }),
                    }}
                  />
                  {expr.info && <p className="text-[10px] text-gray-400 mt-1">{expr.info}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
