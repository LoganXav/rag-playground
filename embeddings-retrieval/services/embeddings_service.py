import numpy as np
from typing import List, Dict, Any


class EmbeddingsService:
    """Service to generate embeddings for chunks using a pre-trained model."""

    def __init__(self, model, batch_size: int = 64):
        self.model = model
        self.batch_size = batch_size

    def _normalize(self, vectors: np.ndarray) -> np.ndarray:
        """Private reusable method to L2 normalize embeddings (row or single)."""
        if vectors.ndim == 1:  # single vector
            norm = np.linalg.norm(vectors)
            return vectors / norm if norm > 0 else vectors
        else:  # batch of vectors
            norms = np.linalg.norm(vectors, axis=1, keepdims=True)
            return vectors / norms

    def generate_embeddings_batch(
        self, chunks: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Generate embeddings for a batch of chunks with L2 normalization."""
        texts = [chunk["text"] for chunk in chunks]

        embeddings = self.model.encodeEmbeddingsBatch(
            texts,
            batch_size=self.batch_size,
            convert_to_numpy=True,
            show_progress_bar=False,
        )

        normalized_embeddings = self._normalize(embeddings)

        for chunk, vector in zip(chunks, normalized_embeddings):
            chunk["embedding"] = vector.tolist()  # JSON-friendly
            chunk["text_length"] = len(chunk["text"])

        return chunks

    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for a single query with L2 normalization."""
        embedding = self.model.encode([text])[0]
        normalized = self._normalize(embedding)
        return normalized.tolist()

