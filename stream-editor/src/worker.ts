import { Database, VectorDatabase } from "@/database";
import {
  embedContent,
  generateHash,
  splitMarkdownContentIntoChunks,
} from "@/lib/process-content";

// Store previous hashes in memory
let previousHashes: string[] = [];

async function startEmbeddingsWorker() {
  try {
    const editorContent = Database.read("editor-content");

    if (!editorContent) {
      throw new Error("Database not initialized yet");
    }

    // Chunk the editor content
    const chunks = splitMarkdownContentIntoChunks(editorContent);

    // Generate an hash for each chunk
    const currentHashes = chunks.map((chunk) => generateHash(chunk));

    for (let i = 0; i < chunks.length; i++) {
      // Only embed chunks that changed
      if (previousHashes[i] !== currentHashes[i]) {
        const embedding = await embedContent(chunks[i]);

        // Store it in the vector store
        VectorDatabase.upsert(i, embedding, chunks[i]);
      }
    }

    // Update the latest hashes
    previousHashes = currentHashes;
  } catch (error: any) {
    console.error(error.message);
  }
}

startEmbeddingsWorker().catch(console.error);

setInterval(
  () => {
    startEmbeddingsWorker().catch(console.error);
  },
  2 * 1000 * 60,
);
