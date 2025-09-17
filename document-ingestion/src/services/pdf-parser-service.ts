import fs from "fs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

export interface ParsedPdf {
  text: string;
  pages: string[];
  numpages: number;
  info: { title: string; author?: string };
}

export interface ParsedPdfMetadataInfo {
  info: { Title?: string; Author?: string };
}

/**
 * Service to parse PDF files into per-page text, full text, and metadata.
 */
export class PdfParserService {
  /**
   * Parse a PDF file from disk and return structured text and metadata.
   *
   * @param filePath - Path to PDF file
   * @returns ParsedPdf object with pages, full text, and metadata
   */
  public async parse(filePath: string): Promise<ParsedPdf> {
    // Read PDF as Uint8Array
    const rawData = new Uint8Array(fs.readFileSync(filePath));

    // Load PDF
    const loadingTask = pdfjsLib.getDocument({ data: rawData });
    const pdf = await loadingTask.promise;

    const pages: string[] = [];
    let fullText = "";

    // Extract text per page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      // Concatenate text items on the page
      // const pageText = content.items.map((item: any) => item.str).join(" ");

      // pages.push(pageText);
      // fullText += pageText + "\n";

      const pageText = content.items.map((item: any) => item.str).join("\n");
      pages.push(pageText);
      fullText += pageText + "\n\n";
    }

    // Try reading metadata, fallback to null if unavailable
    const meta = (await pdf.getMetadata().catch(() => null)) as ParsedPdfMetadataInfo;

    return {
      numpages: pdf.numPages,
      info: { title: meta?.info?.Title ?? "Untitled", author: meta?.info?.Author },
      text: fullText,
      pages,
    };
  }
}
