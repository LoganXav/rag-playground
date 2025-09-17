import fs from "fs";
import path from "path";

/**
 * Service to recursively scan a directory (or file) and return all PDF file paths.
 */
export class FileScannerService {
  /**
   * Recursively retrieve all PDF files from a directory or a single file.
   *
   * @param filePath - Path to a file or directory to scan
   * @returns Array of absolute or relative PDF file paths
   */
  public getPdfFiles(filePath: string): string[] {
    try {
      const stats = fs.statSync(filePath);

      // If it's a single file, return it only if it's a PDF
      if (stats.isFile()) {
        return this.isPdf(filePath) ? [filePath] : [];
      }

      // If it's a directory, recursively scan its contents
      if (stats.isDirectory()) {
        return (
          fs
            // List files in the directory
            .readdirSync(filePath)
            // Join to get full path
            .map((f: string) => path.join(filePath, f))
            // Recursively scan each file/folder
            .flatMap((f: string) => this.getPdfFiles(f))
        );
      }

      return [];
    } catch (error: any) {
      console.error(`🚫 Error scanning ${filePath}:`, error.message);
      return [];
    }
  }

  /**
   * Check if a file path points to a PDF.
   *
   * @param filePath - File path to check
   * @returns True if the file has a .pdf extension
   */
  private isPdf(filePath: string): boolean {
    return path.extname(filePath).toLowerCase() === ".pdf";
  }
}
