import { ChatMessageEdit } from "@/hooks/use-chat";
import { Chunk, parseMarkdownToChunks, stableChunkId } from "./chunk";

export function applyEditsToMarkdown(
  markdown: string,
  edits: ChatMessageEdit[],
) {
  // 1. Re-chunk the markdown
  const chunks = parseMarkdownToChunks(markdown);

  // Use an array so actions like insert_after can reorder
  const newChunks = [...chunks];

  for (const edit of edits) {
    const { action, id, content } = edit;

    const index = newChunks.findIndex((c) => c.id === id);
    if (index === -1) continue; // no match, safe no-op

    switch (action) {
      case "update": {
        const original = newChunks[index];
        newChunks[index] = {
          ...original,
          content,
          // Keep type the same unless content changes type
          type: detectChunkType(content),
        };
        break;
      }

      case "delete": {
        newChunks.splice(index, 1);
        break;
      }

      case "insert_after": {
        const newChunk = {
          id: stableChunkId(content),
          type: detectChunkType(content),
          content,
        };
        newChunks.splice(index + 1, 0, newChunk);
        break;
      }

      default:
        console.warn("Unknown edit action:", action);
    }
  }

  // 3. Re-assemble markdown
  const finalMarkdown = newChunks.map((c) => c.content).join("\n\n");

  return finalMarkdown;
}

// Same type detection logic used during initial parsing
function detectChunkType(block: string): Chunk["type"] {
  if (/^#{1,6}\s+/.test(block)) return "heading";
  if (/^\$[^$]/.test(block) || /^\$\$/.test(block)) return "math";
  if (/^```/.test(block)) return "code";
  if (/^[-*+]\s+/.test(block) || /^\d+\./.test(block)) return "list";
  return "paragraph";
}
