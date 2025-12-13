import { createHash } from "crypto";

export function stableChunkId(content: string) {
  return createHash("sha1").update(content.trim()).digest("hex").slice(0, 12);
}

export type Chunk = {
  id: string;
  type: "paragraph" | "math" | "list" | "code" | "heading";
  content: string;
};

export function parseMarkdownToChunks(markdown: string): Chunk[] {
  if (!markdown.trim()) return [];

  // Split into blocks by two newlines
  const rawBlocks = markdown
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  const chunks: Chunk[] = rawBlocks.map((block) => {
    let type: Chunk["type"] = "paragraph";

    if (/^#{1,6}\s+/.test(block)) type = "heading";
    else if (/^\$[^$]/.test(block) || /^\$\$/.test(block)) type = "math";
    else if (/^```/.test(block)) type = "code";
    else if (/^[-*+]\s+/.test(block) || /^\d+\./.test(block)) type = "list";

    return {
      id: stableChunkId(block),
      type,
      content: block,
    };
  });

  return chunks;
}

export const buildStructuredContext = (
  allChunks: { id: string; type: string; content: string }[],
) => {
  const contextLines: string[] = [];

  // Try to match multiple nodes within this chunk
  allChunks.forEach((node) => {
    contextLines.push(`CHUNK ${node.id} (${node.type}):\n"${node.content}"\n`);
  });

  return contextLines.join("\n");
};

export function detectChunkType(block: string): Chunk["type"] {
  if (/^#{1,6}\s+/.test(block)) return "heading";
  if (/^\$\$/.test(block) || /^\$[^$]/.test(block)) return "math";
  if (/^```/.test(block)) return "code";
  if (/^[-*+]\s+/.test(block) || /^\d+\./.test(block)) return "list";
  return "paragraph";
}
