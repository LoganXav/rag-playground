import numpy as np
from typing import List, Dict, Any


class EmbeddingsService:
    """Service to generate embeddings for chunks using a pre-trained model."""

    def __init__(self, model, batch_size: int = 64):
        self.model = model
        self.batch_size = batch_size

    def generate_embeddings_batch(
        self, chunks: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Generate embeddings for a batch of chunks with L2 normalization."""
        texts = [chunk["text"] for chunk in chunks]

        # Compute embeddings in one go
        embeddings = self.model.encodeEmbeddingsBatch(
            texts,
            batch_size=self.batch_size,
            convert_to_numpy=True,
            show_progress_bar=False,
        )

        # L2 normalization (row-wise)
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        normalized_embeddings = embeddings / norms

        # Attach embeddings back to chunks
        for chunk, vector in zip(chunks, normalized_embeddings):
            chunk["embedding"] = vector.tolist()  # store as list for JSON compatibility
            chunk["text_length"] = len(chunk["text"])

        return chunks

