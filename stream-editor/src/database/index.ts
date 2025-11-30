import fs from "fs";
import path from "path";
import { DataArray } from "@xenova/transformers";
import { VectorDatabaseEntry } from "@/types";

const DB_FILE = path.resolve("./src/database/database.json");
const VECTOR_DB_FILE = path.resolve("./src/database/vector-database.json");

export class Database {
  static update(key: string, content: string) {
    let data: Record<string, string> = {};

    if (fs.existsSync(DB_FILE)) {
      data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    }

    data[key] = content;

    fs.writeFileSync(DB_FILE, JSON.stringify(data));
  }

  static read(key: string): string {
    if (!fs.existsSync(DB_FILE)) {
      console.error("Database not initialized yet.");

      return "";
    }

    const data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));

    return data[key];
  }
}

export class VectorDatabase {
  static upsert(index: number, embedding: DataArray, chunk: string) {
    let db: Array<{
      index: number;
      embedding: number[];
      chunk: string;
      updatedAt: string;
    }> = [];

    // Load existing DB if available
    if (fs.existsSync(VECTOR_DB_FILE)) {
      db = JSON.parse(fs.readFileSync(VECTOR_DB_FILE, "utf-8"));
    }

    // Convert DataArray → plain number[]
    const vector = Array.from(embedding);

    const entry = {
      index,
      embedding: vector,
      chunk,
      updatedAt: new Date().toISOString(),
    };

    // Check if index already exists
    const existingIndex = db.findIndex((item) => item.index === index);

    if (existingIndex === -1) {
      // insert
      db.push(entry);
    } else {
      // update
      db[existingIndex] = entry;
    }

    // Save back to vector store
    fs.writeFileSync(VECTOR_DB_FILE, JSON.stringify(db, null, 2));

    return entry;
  }

  static read(): VectorDatabaseEntry[] {
    if (!fs.existsSync(VECTOR_DB_FILE)) {
      console.error("Database not initialized yet.");
      return [];
    }

    const data = JSON.parse(fs.readFileSync(VECTOR_DB_FILE, "utf-8"));

    return data;
  }
}
