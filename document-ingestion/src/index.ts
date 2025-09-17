import { Command } from "commander";
import { IngestArgsType } from "types";
import { DocumentIngestionPipeline } from "document-ingestion";

const program = new Command();

program.name("document-ingestion").description("CLI to injest pdf documents and chunck them for an embedding model.").version("1.0.0");

program
  .command("ingest")
  .description("Ingest a single or multiple pdf files in a folder")
  .argument("<filePath>", "file to ingest")
  .option("-c, --class <className>", "Name of the class the book is for")
  .option("-s, --chunkSize <chunkSize>", "Size of the file chunks", "2000")
  .option("--noChunk", "File ingestion with no chunking")
  .action((filePath, options) => {
    const documentIngestionPipeline = new DocumentIngestionPipeline();

    const args: IngestArgsType = {
      userInputfilePath: filePath,
      className: options.class,
      chunkSize: parseInt(options.chunkSize, 10),
      noChunk: options.noChunk,
    };

    documentIngestionPipeline.ingestFileAndChunk(args);
  });

program.parse();
