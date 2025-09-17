export interface IngestArgsType {
  noChunk: boolean;
  className: string;
  chunkSize: number;
  userInputfilePath: string;
}

export interface PageWithMetadata {
  id: string;
  title: string;
  pageNumber: number;
  className?: string;
  text: string;
}
