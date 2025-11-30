import MarkdownIt from "markdown-it";
import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";
import { StateBlock, StateInline } from "markdown-it/index.js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Markdown-it Math Plugin
 * -----------------------
 * This plugin extends Markdown-it to recognize LaTeX-style math delimiters
 * both inline (`$...$`) and block (`$$...$$`), then replaces them with
 * safe HTML placeholders.
 *
 * These placeholders can be rendered downstream (e.g., with KaTeX or MathJax)
 * into actual mathematical notation within the DOM.
 *
 * Output examples:
 *   Inline math → <span data-type="inline-math" data-latex="E=mc^2"></span>
 *   Block math  → <div data-type="block-math" data-latex="a^2 + b^2 = c^2"></div>
 */

/* -------------------------------------------------------------------------- */
/*                                Helper Utils                                */
/* -------------------------------------------------------------------------- */

/**
 * Escapes special characters so that LaTeX expressions can safely be placed
 * inside an HTML attribute without breaking markup or introducing XSS vectors.
 */
function escapeForLatexAttribute(latex: string): string {
  return String(latex).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Normalizes LaTeX content for consistent rendering.
 *
 * - Collapses double-escaped backslashes (\\\\ → \\)
 * - Normalizes newlines (\r\n → \n)
 * - Trims surrounding whitespace
 * - Collapses multiple consecutive newlines
 */
function normalizeLatex(latex: string): string {
  return String(latex)
    .replace(/\\\\/g, "\\")
    .replace(/\r\n?/g, "\n")
    .replace(/^\s+|\s+$/g, "")
    .replace(/\n+/g, "\n");
}

/* -------------------------------------------------------------------------- */
/*                                Math Plugin                                 */
/* -------------------------------------------------------------------------- */

function markdownItMathPlugin(md: MarkdownIt): void {
  /**
   * Custom rule to detect and tokenize block math expressions.
   * Supports both same-line (`$$...$$`) and multi-line (`$$ ... $$`) blocks.
   */
  function mathBlockRule(state: StateBlock, startLine: number, endLine: number, silent: boolean): boolean {
    const startPos = state.bMarks[startLine] + state.tShift[startLine];
    const maxPos = state.eMarks[startLine];

    // Must start with "$$"
    if (startPos + 1 >= maxPos) return false;
    if (state.src.charCodeAt(startPos) !== 0x24 /* $ */) return false;
    if (state.src.charCodeAt(startPos + 1) !== 0x24 /* $ */) return false;

    const restOfLine = state.src.slice(startPos + 2, maxPos);

    // --- Case 1: Same-line $$ ... $$
    const sameLineCloseIndex = restOfLine.indexOf("$$");
    if (sameLineCloseIndex !== -1) {
      if (silent) return true;
      const inner = restOfLine.slice(0, sameLineCloseIndex);
      const token = state.push("math_block", "", 0);
      token.block = true;
      token.content = normalizeLatex(inner);
      token.map = [startLine, startLine + 1];
      state.line = startLine + 1;
      return true;
    }

    // --- Case 2: Multi-line $$ ... $$
    let nextLine = startLine;
    let found = false;

    while (++nextLine < endLine) {
      const linePos = state.bMarks[nextLine] + state.tShift[nextLine];
      const lineMax = state.eMarks[nextLine];
      const lineText = state.src.slice(linePos, lineMax);
      if (lineText.includes("$$")) {
        found = true;
        break;
      }
    }

    if (!found) return false;
    if (silent) return true;

    const contentStart = state.bMarks[startLine] + state.tShift[startLine] + 2;
    const contentEnd = state.bMarks[nextLine] + state.tShift[nextLine];
    const content = normalizeLatex(state.src.slice(contentStart, contentEnd));

    const token = state.push("math_block", "", 0);
    token.block = true;
    token.content = content;
    token.map = [startLine, nextLine + 1];

    state.line = nextLine + 1;
    return true;
  }

  /**
   * Custom rule to detect inline math expressions: `$...$`
   * Skips `$$` (those are handled by the block rule).
   */
  function mathInlineRule(state: StateInline, silent: boolean): boolean {
    const start = state.pos;
    if (state.src[start] !== "$") return false;

    // Skip `$$` — that's for block math.
    if (start + 1 < state.posMax && state.src[start + 1] === "$") return false;

    // Find closing single unescaped `$`
    let pos = start + 1;
    while ((pos = state.src.indexOf("$", pos)) !== -1) {
      let backslashes = 0;
      let k = pos - 1;
      while (k >= 0 && state.src[k] === "\\") {
        backslashes++;
        k--;
      }
      // Even number of backslashes → not escaped.
      if (backslashes % 2 === 0) break;
      pos++;
    }

    if (pos === -1) return false;

    if (!silent) {
      const content = state.src.slice(start + 1, pos);
      const token = state.push("math_inline", "", 0);
      token.content = normalizeLatex(content);
    }

    state.pos = pos + 1;
    return true;
  }

  /* --------------------------- Rule Registration -------------------------- */

  /**
   * Block rules determine how top-level structures (paragraphs, blockquotes,
   * lists, etc.) are recognized.
   *
   * We register `math_block` before `paragraph` so that lines starting with `$$`
   * are caught as math blocks *before* being parsed as plain paragraphs.
   */
  md.block.ruler.before("paragraph", "math_block", mathBlockRule, {
    alt: ["paragraph", "reference", "blockquote", "list"],
  });

  /**
   * Inline rules operate within block content — they recognize inline tokens
   * such as emphasis, links, and math.
   *
   * Registering before `"emphasis"` ensures `$...$` math expressions are
   * recognized before Markdown-it interprets `$` as part of italic text.
   */
  md.inline.ruler.before("emphasis", "math_inline", mathInlineRule);

  /* ----------------------------- Token Renderers -------------------------- */

  md.renderer.rules.math_inline = (tokens, idx) => {
    const raw = tokens[idx].content || "";
    return `<span data-type="inline-math" data-latex="${escapeForLatexAttribute(raw)}"></span>`;
  };

  md.renderer.rules.math_block = (tokens, idx) => {
    const raw = tokens[idx].content || "";
    return `<div data-type="block-math" data-latex="${escapeForLatexAttribute(raw)}"></div>\n`;
  };
}

/* -------------------------------------------------------------------------- */
/*                            Markdown → HTML Exporter                        */
/* -------------------------------------------------------------------------- */

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });
md.use(markdownItMathPlugin);

/**
 * Converts Markdown containing math delimiters into HTML with math placeholders.
 */
export function markdownToHtml(markdown: string): string {
  const input = String(markdown || "");
  const normalizedInput = input.replace(/\\\\/g, "\\"); // prevent over-escaping
  return md.render(normalizedInput);
}
