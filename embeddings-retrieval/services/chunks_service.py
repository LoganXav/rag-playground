import os
import json
import hashlib
from typing import Dict, Any, Generator

file_path = "./data/chunks.ndjson"


class ChunksService:
    """A service to read chunks from an NDJSON file through streams, validate and enrich each chunk with a unique hash."""

    def read(self) -> Generator[Dict[str, Any], None, None]:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found at: {file_path}")

        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    chunk = json.loads(line)
                    yield chunk
                except json.JSONDecodeError as e:
                    print(f"Skipping malformed line: {line.strip()} | Error: {e}")

    def validate_and_enrich(self, chunk: Dict[str, Any]) -> Dict[str, Any]:
        required_fields = ["id", "text", "title", "pageNumbers"]
        for field in required_fields:
            if field not in chunk:
                raise ValueError(f"Chunk is missing required field: {field}")
        if not chunk["text"]:
            raise ValueError("Chunk 'text' field cannot be empty")

        checksum = self._compute_checksum(chunk["text"])
        chunk["text_checksum"] = checksum
        return chunk

    def _compute_checksum(self, text: str) -> str:
        sha256 = hashlib.sha256()
        sha256.update(text.encode("utf-8"))
        return sha256.hexdigest()
