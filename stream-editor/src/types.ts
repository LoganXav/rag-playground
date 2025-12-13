import { DataArray } from "@xenova/transformers";

export type ChatMessage = {
  id: string;
  status: "used" | "dismissed" | "default";
  role: "user" | "assistant";
  content: string;
  preview?: { data: string } | null;
  edits?: ChatMessageEdit[];
};

export type ChatMessageEdit = {
  id: string;
  content: string;
  action: "insert" | "delete" | "insert_after" | "update" | "insert_before";
};

export type VectorDatabaseEntry = {
  index: number;
  embedding: DataArray;
  chunk: string[];
  score?: number;
  updatedAt: string;
};
