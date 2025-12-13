import crypto from "crypto";
import {
  DataArray,
  FeatureExtractionPipeline,
  pipeline,
} from "@xenova/transformers";
import { VectorDatabase } from "@/database";

export const splitMarkdownContentIntoChunks = (
  content: string,
  maxWords = 100,
): string[] => {
  if (!content) return [];

  const lines = content.split("\n");
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentWordCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineWordCount = line.split(/\s+/).filter(Boolean).length;

    // If line is a heading and current chunk is not empty, push current chunk first
    if (/^#+\s/.test(line) && currentChunk.length > 0) {
      chunks.push(currentChunk.join("\n").trim());
      currentChunk = [];
      currentWordCount = 0;
    }

    currentChunk.push(line);
    currentWordCount += lineWordCount;

    // If chunk exceeds maxWords, push it
    if (currentWordCount >= maxWords) {
      chunks.push(currentChunk.join("\n").trim());
      currentChunk = [];
      currentWordCount = 0;
    }
  }

  // Push any remaining content
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join("\n").trim());
  }

  return chunks;
};

export const generateHash = (content: string): string => {
  return crypto.createHash("sha256").update(content).digest("hex");
};

let embedder: FeatureExtractionPipeline;

export const embedContent = async (content: string): Promise<DataArray> => {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }

  // Run embeddings
  const result = await embedder(content, {
    pooling: "mean",
    normalize: true,
  });

  return result.data;
};

export const runCosineSimilaritySearch = (a: number[], b: number[]) => {
  let dot = 0;
  let aNorm = 0;
  let bNorm = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    aNorm += a[i] ** 2;
    bNorm += b[i] ** 2;
  }

  return dot / (Math.sqrt(aNorm) * Math.sqrt(bNorm));
};

export const getRelevantChunksContext = (embeddedUserMessage: DataArray) => {
  const topK = 5;
  const vectorResults = VectorDatabase.read();

  // similarity search with the user's embedding against the chnks in the db to retrieve relevent cunks
  const results = vectorResults.map((entry) => {
    const score = runCosineSimilaritySearch(
      Array.from(embeddedUserMessage),
      Array.from(entry.embedding),
    );

    return { ...entry, score };
  });

  results.sort((a, b) => b.score - a.score);

  const context = results.slice(0, topK).map((result) => result.chunk);

  return context;
};
