import path from "path";
import fs from "fs/promises";

/**
 * Service for saving text to disk, primarily for debugging or archival purposes.
 * Handles creation of necessary directories and asynchronous file writes.
 */
export class TextWriterService {
  constructor() {}

  /**
   * Saves raw extracted text to a structured folder path.
   * - Default output path: ./data/processed/<bookTitle>/raw.txt
   * - If bookTitle is not provided, uses the first 5 characters of the text as a fallback.
   * - Ensures directory exists before writing.
   * - Uses asynchronous I/O to avoid blocking the main thread.
   *
   * @param text - The raw text to save
   * @param bookId - Unique identifier (checksum)
   * @return outPath - The output folder path
   */
  public async saveRawText(text: string, bookId: string) {
    try {
      const outDir = path.join("data", "processed", bookId);
      await fs.mkdir(outDir, { recursive: true });

      const outPath = path.join(outDir, "raw.txt");
      await fs.writeFile(outPath, text, "utf-8");

      console.log(`📝 Raw text saved to ${outPath} \n\n`);

      return outPath;
    } catch (err) {
      console.error("🚫 Failed to save raw text:", err);
    }
  }
}
