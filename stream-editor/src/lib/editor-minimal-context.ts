/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Converts editor content/selection to plain markdown string
 * Supports common formatting: headings, lists, bold, italic, links, code, LaTeX, etc.
 */

interface EditorNode {
  type: string;
  attrs?: Record<string, any>;
  content?: EditorNode[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, any> }>;
}

/**
 * Main conversion function
 */
export function editorToMarkdown(node: EditorNode, context: ConversionContext = {}): string {
  const { inList = false, listDepth = 0 } = context;

  if (!node) return "";

  switch (node.type) {
    case "doc":
      return node.content?.map((child) => editorToMarkdown(child, context)).join("") || "";

    case "heading":
      // default to 1 if level is missing, invalid, or non-numeric
      let level = parseInt(node.attrs?.level ?? 1, 10);
      if (isNaN(level) || level < 1) level = 1;
      const headingText = serializeInline(node.content || []);
      return "#".repeat(level) + " " + headingText + "\n\n";

    case "paragraph":
      if (!node.content || node.content.length === 0) return "\n";
      const paraText = serializeInline(node.content);
      return paraText + "\n\n";

    case "bulletList":
      return node.content?.map((child) => editorToMarkdown(child, { inList: true, listDepth: listDepth + 1, listType: "bullet" })).join("") || "";

    case "orderedList":
      return node.content?.map((child, index) => editorToMarkdown(child, { inList: true, listDepth: listDepth + 1, listType: "ordered", listIndex: index + 1 })).join("") || "";

    case "listItem":
      const indent = "  ".repeat(listDepth - 1);
      const bullet = context.listType === "ordered" ? `${context.listIndex}.` : "-";
      const itemText =
        node.content
          ?.map((child) => {
            if (child.type === "paragraph") {
              return serializeInline(child.content || []);
            }
            return editorToMarkdown(child, { ...context, listDepth: listDepth + 1 });
          })
          .join("") || "";
      return `${indent}${bullet} ${itemText}\n`;

    case "codeBlock":
      const language = node.attrs?.language || "";
      const codeText = node.content?.map((c) => c.text || "").join("") || "";
      return "```" + language + "\n" + codeText + "\n```\n\n";

    case "blockquote":
      const quoteContent = node.content?.map((child) => editorToMarkdown(child, context)).join("") || "";
      return (
        quoteContent
          .split("\n")
          .map((line) => (line ? "> " + line : ">"))
          .join("\n") + "\n\n"
      );

    case "horizontalRule":
      return "---\n\n";

    case "image":
      const src = node.attrs?.src || "";
      const alt = node.attrs?.alt || "";
      const title = node.attrs?.title;
      return `![${alt}](${src}${title ? ` "${title}"` : ""})\n\n`;

    case "blockMath":
      const mathContent = node.attrs?.latex || node.attrs?.content || node.content?.[0]?.text || "";
      return "$$\n" + mathContent + "\n$$\n\n";

    case "inlineMath":
      const inlineMathContent = node.attrs?.latex;
      return "$" + inlineMathContent + "$";

    case "table":
      return convertTable(node) + "\n\n";

    case "hardBreak":
      return "  \n";

    case "text":
      return applyMarks(node.text || "", node.marks || []);

    default:
      // Fallback: try to serialize content if it exists
      return node.content?.map((child) => editorToMarkdown(child, context)).join("") || "";
  }
}

/**
 * Serialize inline content (text with marks)
 */
function serializeInline(nodes: EditorNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === "text") {
        return applyMarks(node.text || "", node.marks || []);
      } else if (node.type === "hardBreak") {
        return "  \n";
      } else if (node.type === "image") {
        const src = node.attrs?.src || "";
        const alt = node.attrs?.alt || "";
        return `![${alt}](${src})`;
      } else if (node.type === "mathInline" || node.type === "math_inline" || node.type === "inlineMath") {
        const math = node.attrs?.latex || node.attrs?.content || node.content?.[0]?.text || "";
        return `$${math}$`;
      }
      return "";
    })
    .join("");
}

/**
 * Apply text marks (bold, italic, code, links, etc.)
 */
function applyMarks(text: string, marks: Array<{ type: string; attrs?: Record<string, any> }>): string {
  let result = text;

  // Sort marks by priority (innermost first)
  const sortedMarks = [...marks].sort((a, b) => {
    const priority: Record<string, number> = { code: 0, link: 1, bold: 2, italic: 3 };
    return (priority[a.type] || 4) - (priority[b.type] || 4);
  });

  for (const mark of sortedMarks) {
    switch (mark.type) {
      case "bold":
      case "strong":
        result = `**${result}**`;
        break;
      case "italic":
      case "em":
        result = `*${result}*`;
        break;
      case "code":
        result = `\`${result}\``;
        break;
      case "link":
        const href = mark.attrs?.href || "";
        const title = mark.attrs?.title;
        result = `[${result}](${href}${title ? ` "${title}"` : ""})`;
        break;
      case "strike":
      case "strikethrough":
        result = `~~${result}~~`;
        break;
      case "underline":
        // Markdown doesn't have native underline, could use HTML
        result = `<u>${result}</u>`;
        break;
    }
  }

  return result;
}

/**
 * Convert table structure to markdown
 */
function convertTable(tableNode: EditorNode): string {
  const rows = tableNode.content || [];
  if (rows.length === 0) return "";

  const lines: string[] = [];

  rows.forEach((row, rowIndex) => {
    const cells = row.content || [];
    const cellTexts = cells.map((cell) => {
      return serializeInline(cell.content?.[0]?.content || []).trim();
    });

    lines.push("| " + cellTexts.join(" | ") + " |");

    // Add header separator after first row
    if (rowIndex === 0) {
      const separator = cellTexts.map(() => "---").join(" | ");
      lines.push("| " + separator + " |");
    }
  });

  return lines.join("\n");
}

/**
 * Context for tracking conversion state
 */
interface ConversionContext {
  inList?: boolean;
  listDepth?: number;
  listType?: "bullet" | "ordered";
  listIndex?: number;
}

// --- add or replace these in your existing file ---

/**
 * Options for context extraction around selection
 */
interface SelectionContextOptions {
  radius?: number; // number of block nodes to include before & after the overlapping blocks
  maxNodes?: number; // hard cap on number of blocks returned
  expandIfCollapsed?: boolean; // if selection is collapsed, expand to containing block
}

/**
 * Result shape returned by the helper
 */
interface SelectionMarkdownResult {
  selection: { from: number; to: number };
  selectionMarkdown: string;
  contextMarkdown: string;
  contextNodes: EditorNode[]; // original JSON nodes for mapping back later
}

/**
 * Convert the selected portion to markdown (exact selection) and also produce
 * a markdown string containing 'radius' surrounding block nodes.
 *
 * - `radius` is measured in block nodes around the first and last blocks that overlap the selection.
 * - `maxNodes` prevents extremely large context slices.
 */
export function convertSelectionToMarkdownWithContext(editor: any, opts: SelectionContextOptions = {}): SelectionMarkdownResult {
  const { radius = 1, maxNodes = 12, expandIfCollapsed = true } = opts;

  const state = editor.state;
  let { from, to } = (editor && editor.state && editor.state.selection) || (opts as any);
  // normalize selection if passed directly in opts (backwards compat)
  if (!from || !to) {
    from = state.selection.from;
    to = state.selection.to;
  }

  // If collapsed and requested, expand to containing block
  if (expandIfCollapsed && from === to) {
    const $pos = state.doc.resolve(from);
    const blockStart = $pos.start($pos.depth);
    const blockEnd = $pos.end($pos.depth);
    from = blockStart;
    to = blockEnd;
  }

  // Collect block nodes and their positions
  const blocks: Array<{ from: number; to: number; nodeJSON: EditorNode }> = [];
  state.doc.descendants((node: any, pos: number) => {
    if (!node.isBlock) return;
    const start = pos;
    const end = pos + node.nodeSize;
    // Use node.toJSON() so the serializer expects the same shape your editorToMarkdown uses
    const nodeJSON = node.toJSON();
    blocks.push({ from: start, to: end, nodeJSON });
  });

  // Find overlapping blocks
  const overlappingIndexes = blocks.map((b, i) => (b.to > from && b.from < to ? i : -1)).filter((i) => i !== -1);

  // fallback: the block containing the cursor
  if (overlappingIndexes.length === 0) {
    const fallback = blocks.findIndex((b) => b.from <= from && from < b.to);
    if (fallback !== -1) overlappingIndexes.push(fallback);
  }

  // If still empty (very odd), return empty payload with selection markdown only
  // (we still create selection Markdown by slicing the doc)
  // Build selectionMarkdown from the exact slice
  const selectedSlice = state.doc.slice(from, to).content;
  const selectedJSON = selectedSlice.toJSON();
  const selectionTempDoc: EditorNode = { type: "doc", content: selectedJSON };
  const selectionMarkdown = editorToMarkdown(selectionTempDoc).trim();

  if (overlappingIndexes.length === 0) {
    return {
      selection: { from, to },
      selectionMarkdown,
      contextMarkdown: "",
      contextNodes: [],
    };
  }

  const firstIdx = Math.max(0, overlappingIndexes[0] - radius);
  const lastIdx = Math.min(blocks.length - 1, overlappingIndexes[overlappingIndexes.length - 1] + radius);
  let slice = blocks.slice(firstIdx, lastIdx + 1);

  // enforce maxNodes
  if (slice.length > maxNodes) {
    // keep the center region containing the selection: take maxNodes around the middle
    const keepStart = Math.max(0, Math.floor((slice.length - maxNodes) / 2));
    slice = slice.slice(keepStart, keepStart + maxNodes);
  }

  const contextNodes = slice.map((s) => s.nodeJSON);
  const contextTempDoc: EditorNode = { type: "doc", content: contextNodes as any };

  const contextMarkdown = editorToMarkdown(contextTempDoc).trim();

  return {
    selection: { from, to },
    selectionMarkdown,
    contextMarkdown,
    contextNodes,
  };
}

/**
 * Helper: Convert entire document to markdown
 */
export function convertDocumentToMarkdown(editor: any): string {
  const docJSON = editor.state.doc.toJSON();
  return editorToMarkdown(docJSON).trim();
}
