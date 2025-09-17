import { IngestArgsType } from "types";
import { ChecksumService } from "services/checksum-service";
import { ChunkingService } from "services/chunking-service";
import { PdfParserService } from "services/pdf-parser-service";
import { TextWriterService } from "services/text-writer-service";
import { FileScannerService } from "services/file-scanner-service";
import { PageMetadataService } from "services/page-metadata-service";
import { TextNormalizationService } from "services/text-normalization-service";

export class DocumentIngestionPipeline {
  private chunkingService = new ChunkingService();
  private checksumService = new ChecksumService();
  private pdfParserService = new PdfParserService();
  private textWriterService = new TextWriterService();
  private fileScannerService = new FileScannerService();
  private pageMetadataService = new PageMetadataService();
  private textNormalizationService = new TextNormalizationService();

  public async ingestFileAndChunk(args: IngestArgsType) {
    const pdfFiles = this.fileScannerService.getPdfFiles(args.userInputfilePath);

    for (const file of pdfFiles) {
      const checksum = await this.checksumService.compute(file);
      const manifest = this.checksumService.loadManifest();

      if (manifest[checksum]) {
        console.log(`⏩️ Skipping ${file}, already ingested.`);
        return;
      }

      console.log(`✅ Processing ${file} ...`);
      const data = await this.pdfParserService.parse(file);

      console.log(`📖 ${data.info.title} by ${data.info.author}`);

      console.log("🧼 Cleaning book pages ...");
      data.pages = this.textNormalizationService.cleanPages(data.pages);

      const normalizedText = data.pages.join("\n\n");
      this.textWriterService.saveRawText(normalizedText, checksum);

      const pagesWithMetadata = this.pageMetadataService.assignPageNumbers(checksum, data.pages, data.info.title, args.className);

      const chunks = this.chunkingService.chunkPages(pagesWithMetadata, args.chunkSize);

      this.chunkingService.saveChunks(checksum, chunks);

      manifest[checksum] = file;
      this.checksumService.saveManifest(manifest);

      console.log(`📦 Stored chunks for ${file} under checksum ${checksum}`);
    }
  }
}
