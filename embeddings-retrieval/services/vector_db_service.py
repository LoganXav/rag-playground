import os
import json
import uuid
import faiss
import numpy as np
from typing import Dict, Any, List

db_path = "data/index"


class VectorDBService:
    """A service to build and manage a local FAISS vector DB with metadata."""

    def __init__(self, dim: int, index_type: str = "flat"):
        self.dim = dim
        self.db_path = db_path
        self.index_file = os.path.join(db_path, "faiss.index")
        self.meta_file = os.path.join(db_path, "metadata.jsonl")
        self.manifest_file = os.path.join(db_path, "manifest.json")

        os.makedirs(db_path, exist_ok=True)

        # Pick index type
        if index_type == "flat":
            self.index = faiss.IndexFlatIP(
                dim
            )  # cosine similarity (with normalized vectors)
        elif index_type == "hnsw":
            self.index = faiss.IndexHNSWFlat(dim, 32)
        else:
            raise ValueError(f"Unsupported index type: {index_type}")

        # Metadata management
        self.metadata: Dict[int, Dict[str, Any]] = {}
        self.next_id = 0

    def add_batch(self, vectors: np.ndarray, metadatas: List[Dict[str, Any]]):
        """Add a batch of vectors with associated metadata."""
        # Gets the number of rows (vectors) in a batch
        n = vectors.shape[0]
        # Creates a list of IDs and assigns to each new vector. This ensures every vector get's a unique FAISS ID
        ids = list(range(self.next_id, self.next_id + n))

        self.index.add(vectors)

        # For every vector id in the batch, we spread the associated chunk (with embeddings) and add a unique FAISS ID
        # Then we can store the enriched chunks in memory
        for i, idx in enumerate(ids):
            record = {"faiss_id": idx, **metadatas[i]}
            self.metadata[idx] = record

            # Write append to metadata file in disk for persistence
            with open(self.meta_file, "a") as f:
                f.write(json.dumps(record) + "\n")

        self.next_id += n

    def search(self, query_embedding, k: int = 5) -> List[Dict[str, Any]]:
        """Search top-k nearest neighbors with metadata."""
        query_vector = np.array([query_embedding])
        D, I = self.index.search(query_vector, k)
        results = []
        for score, idx in zip(D[0], I[0]):
            if idx == -1:
                continue
            record = self.metadata.get(idx, {})
            results.append({"score": float(score), "metadata": record})
        return results

    def save(self, model_name: str):
        """Persist FAISS index and manifest file."""
        faiss.write_index(self.index, self.index_file)
        manifest = {
            "model": model_name,
            "dim": self.dim,
            "vectors": self.index.ntotal,
            "created_at": uuid.uuid4().hex,
            "index_type": type(self.index).__name__,
        }
        with open(self.manifest_file, "w") as f:
            json.dump(manifest, f, indent=2)

    def load(self):
        """Load FAISS index and metadata back into memory."""
        if os.path.exists(self.index_file):
            self.index = faiss.read_index(self.index_file)

        if os.path.exists(self.meta_file):
            with open(self.meta_file) as f:
                for line in f:
                    record = json.loads(line)
                    self.metadata[record["faiss_id"]] = record
            self.next_id = max(self.metadata.keys(), default=-1) + 1
