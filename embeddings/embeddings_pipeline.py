import numpy as np
from tqdm import tqdm
from model import EmbeddingModel
from services.chunks_service import ChunksService
from services.vector_db_service import VectorDBService
from services.embeddings_service import EmbeddingsService


class EmbeddingsPipeline:
    """
    A pipeline for generating embeddings from document chunks,
    validating them, and storing them in a vector database.
    """

    def __init__(self):
        """
        Initialize services for chunking, embeddings, and vector storage.
        """

        self.chunks_service = ChunksService()

        self.model = EmbeddingModel()
        self.embeddings_service = EmbeddingsService(self.model)

        # Initialize vector DB using dimensions derived from the embedding model
        self.vector_db = VectorDBService(
            dim=self.model.getDimensions(), index_type="flat"
        )

    def start(self):
        """
        Run the embedding pipeline:
        1. Read chunks from the chunk service.
        2. Validate and enrich chunks.
        3. Generate embeddings in batches.
        4. Store embeddings in the vector database.
        5. Persist the vector index to disk.

        Returns:
            list: A list of processed and embedded chunks.
        """

        print("Starting embeddings pipeline...")

        processed_chunks = []
        BATCH_SIZE = 64
        batch = []

        chunk_stream = self.chunks_service.read()

        # Use tqdm to show a progress bar
        for chunk in tqdm(chunk_stream, desc="Generating Embeddings"):
            try:
                validated_chunk = self.chunks_service.validate_and_enrich(chunk)

                batch.append(validated_chunk)

                if len(batch) == BATCH_SIZE:
                    embedded_chunks = self.embeddings_service.generate_embeddings_batch(
                        batch
                    )
                    processed_chunks.extend(embedded_chunks)

                    # push to FAISS
                    vectors = np.array([c["embedding"] for c in embedded_chunks])
                    self.vector_db.add_batch(vectors, embedded_chunks)

                    # reset batch
                    batch = []

            except ValueError as e:
                print(f"Skipping chunk due to validation error: {e}")

        # process any leftover batch
        if batch:
            embedded_chunks = self.embeddings_service.generate_embeddings_batch(batch)
            processed_chunks.extend(embedded_chunks)

            vectors = np.array([c["embedding"] for c in embedded_chunks])
            self.vector_db.add_batch(vectors, embedded_chunks)

        # persist index + manifest
        self.vector_db.save(model_name=self.model.getModelName())

        print("Embedding pipeline completed.")

        return processed_chunks
