import { DataArray } from "@xenova/transformers";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  meta?: {
    type?: "patch" | "text";
    patch?: string;
    explanation?: string;
    applied?: boolean;
  };
};

export type VectorDatabaseEntry = {
  index: number;
  embedding: DataArray;
  chunk: string[];
  score?: number;
  updatedAt: string;
};
