import { ChatMessageEdit } from "@/types";
import { Chunk, parseMarkdownToChunks, stableChunkId, detectChunkType } from "./chunks";

export function applyEditsToMarkdown(markdown: string, edits: ChatMessageEdit[]) {
  const chunks = parseMarkdownToChunks(markdown);
  const newChunks: Chunk[] = [...chunks];

  // Special case: empty document
  if (chunks.length === 0) {
    for (const edit of edits) {
      if (edit.action === "insert") {
        newChunks.push({
          id: stableChunkId(edit.content),
          type: detectChunkType(edit.content),
          content: edit.content,
        });
      }
    }

    return newChunks.map((c) => c.content).join("\n\n");
  }

  for (const edit of edits) {
    const { action } = edit;

    if (action === "insert") {
      // Invalid if document is not empty — ignore safely
      continue;
    }

    const index = newChunks.findIndex((c) => c.id === edit.id);
    if (index === -1) continue;

    switch (action) {
      case "update": {
        newChunks[index] = {
          ...newChunks[index],
          content: edit.content,
          type: detectChunkType(edit.content),
        };
        break;
      }

      case "delete": {
        newChunks.splice(index, 1);
        break;
      }

      case "insert_after": {
        newChunks.splice(index + 1, 0, {
          id: stableChunkId(edit.content),
          type: detectChunkType(edit.content),
          content: edit.content,
        });
        break;
      }

      case "insert_before": {
        newChunks.splice(index, 0, {
          id: stableChunkId(edit.content),
          type: detectChunkType(edit.content),
          content: edit.content,
        });
        break;
      }
    }
  }

  return newChunks.map((c) => c.content).join("\n\n");
}
