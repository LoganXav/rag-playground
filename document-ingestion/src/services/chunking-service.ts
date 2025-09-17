import fs from "fs";
import path from "path";
import { PageWithMetadata } from "types";

export interface Chunk {
  id: string;
  text: string;
  title: string;
  className?: string;
  pageNumbers: number[];
}

/**
 * Service responsible for splitting book pages into semantic chunks
 * with preserved page number references for later citation.
 */
export class ChunkingService {
  private readonly root = "./data/processed";
  /**
   * Splits pages into chunks of sentences while preserving page references.
   *
   * @param pagesWithMetadata - Pages enriched with metadata (id, title, pageNumber, text, etc.)
   * @param maxChunkSize - Maximum number of characters allowed in each chunk
   * @param sentenceOverlap - Number of sentences to overlap between consecutive chunks
   * @returns Array of `Chunk` objects with text + metadata
   */
  public chunkPages(pagesWithMetadata: PageWithMetadata[], maxChunkSize = 1000, sentenceOverlap = 2): Chunk[] {
    const chunks: Chunk[] = [];
    let buffer: { sentence: string; page: number }[] = [];

    /**
     * Flushes the current buffer into a new chunk.
     */
    const flushChunk = () => {
      if (buffer.length === 0) return;

      const text = buffer
        .map((b) => b.sentence)
        .join(" ")
        .trim();
      const pageNumbers = Array.from(new Set(buffer.map((b) => b.page))).sort((a, b) => a - b);

      chunks.push({
        id: pagesWithMetadata[0].id,
        title: pagesWithMetadata[0].title,
        className: pagesWithMetadata[0].className,
        pageNumbers,
        text,
      });
    };

    // Walk through each page and split into sentences
    for (const page of pagesWithMetadata) {
      const sentences = page.text
        .split(/(?<=[.!?])\s+/) // split by sentence enders
        .map((s) => s.trim())
        .filter(Boolean);

      for (const sentence of sentences) {
        const sentenceObj = { sentence, page: page.pageNumber };

        // Tentatively add this sentence
        buffer.push(sentenceObj);

        const bufferText = buffer.map((b) => b.sentence).join(" ");
        if (bufferText.length >= maxChunkSize) {
          // Flush current chunk
          flushChunk();

          // Prepare new buffer with overlap sentences only
          buffer = buffer.slice(-sentenceOverlap);
        }
      }
    }

    // Flush any remaining sentences
    flushChunk();

    return chunks;
  }

  /**
   * Save chunks as NDJSON file in book folder.
   *
   * @param bookId - Unique identifier (checksum)
   * @param chunks - Array of chunk objects
   */
  public saveChunks(bookId: string, chunks: unknown[]): void {
    const outDir = path.join(this.root, bookId);
    const outFile = path.join(outDir, "chunks.ndjson");

    // Ensure directory exists
    fs.mkdirSync(outDir, { recursive: true });

    // Write NDJSON line by line
    const stream = fs.createWriteStream(outFile, { flags: "w" });
    chunks.forEach((chunk) => {
      stream.write(JSON.stringify(chunk) + "\n");
    });
    stream.end();

    console.log(`💾 Saved ${chunks.length} chunks → ${outFile}`);
  }
}
