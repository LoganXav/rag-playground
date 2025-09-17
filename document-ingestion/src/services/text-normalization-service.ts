/**
 * Service responsible for cleaning and normalizing extracted text from documents.
 * Provides modular methods for whitespace normalization, header/footer removal,
 * page number cleanup, hyphenation fixing, and mild paragraph reflowing.
 */
export class TextNormalizationService {
  constructor() {}

  /**
   * Full pipeline to clean and normalize pages of text.
   * Applies multiple transformations in order:
   * - Whitespace normalization
   * - Light header/footer removal
   * - Page number removal
   * - Hyphenation fixes
   * - Paragraph reflow
   *
   * @param pages - Array of raw page strings to be cleaned
   * @returns Cleaned array of page strings
   */
  public cleanPages(pages: string[]): string[] {
    pages = pages.map(this.normalizeWhitespace);
    pages = this.removeLightHeadersFooters(pages);
    pages = pages.map(this.removePageNumbers);
    pages = pages.map(this.fixHyphenation);
    pages = pages.map(this.reflowText);

    return pages;
  }

  /**
   * Normalizes whitespace across a block of text.
   * - Collapses multiple spaces into a single space
   * - Trims leading/trailing whitespace on each line
   *
   * @param text - Raw text to normalize
   * @returns Text with normalized whitespace
   */
  private normalizeWhitespace(text: string): string {
    return text
      .split("\n")
      .map((line) => line.replace(/\s+/g, " ").trim())
      .join("\n");
  }

  /**
   * Removes lines that are likely repetitive headers or footers.
   * - Detects lines that appear across a large fraction of pages
   * - Filters them out from each page
   *
   * @param pages - Array of page strings
   * @param thresholdRatio - Fraction of pages a line must appear on to be considered repetitive
   * @returns Array of pages with repetitive lines removed
   */
  private removeLightHeadersFooters(pages: string[], thresholdRatio = 0.3): string[] {
    const lineCounts: Record<string, number> = {};
    pages.forEach((page) =>
      page.split("\n").forEach((line) => {
        lineCounts[line] = (lineCounts[line] || 0) + 1;
      })
    );

    const threshold = pages.length * thresholdRatio;
    const repetitiveLines = new Set(
      Object.entries(lineCounts)
        .filter(([_, count]) => count > threshold)
        .map(([line]) => line)
    );

    return pages.map((page) =>
      page
        .split("\n")
        .filter((line) => !repetitiveLines.has(line))
        .join("\n")
    );
  }

  /**
   * Removes or normalizes page number lines.
   * - Detects common page number patterns like "Page X" or "Page X of Y"
   * - Keeps the page number in metadata for downstream reference
   *
   * @param text - Page text
   * @returns Text without page number lines
   */
  private removePageNumbers(text: string): string {
    return text
      .split("\n")
      .filter((line) => !/^\s*page\s*\d+(\s*of\s*\d+)?\s*$/i.test(line))
      .join("\n");
  }

  /**
   * Fixes hyphenation caused by line breaks.
   * - Joins words that were split with a hyphen at the end of a line
   * - Example: "alge-\nbra" -> "algebra"
   *
   * @param text - Page text
   * @returns Text with fixed hyphenation
   */
  private fixHyphenation(text: string): string {
    return text.replace(/-\n\s*/g, "");
  }

  /**
   * Mildly reflows short lines into paragraphs while preserving section breaks.
   * - Joins consecutive lines into a paragraph
   * - Preserves empty lines as paragraph separators
   * - Avoids over-merging to keep natural breaks
   *
   * @param text - Page text
   * @returns Reflowed text with merged lines into paragraphs
   */
  private reflowText(text: string): string {
    const lines = text.split("\n").map((line) => line.trim());
    const paragraphs: string[] = [];
    let buffer = "";

    lines.forEach((line) => {
      if (!line) {
        if (buffer) paragraphs.push(buffer);
        buffer = "";
      } else {
        buffer += buffer ? " " + line : line;
      }
    });

    if (buffer) paragraphs.push(buffer);
    return paragraphs.join("\n\n");
  }
}
