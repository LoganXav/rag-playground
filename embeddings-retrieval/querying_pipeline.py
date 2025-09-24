from model import EmbeddingModel
from services.vector_db_service import VectorDBService
from services.embeddings_service import EmbeddingsService


class QueryingPipeline:
    def __init__(self):
        self.model = EmbeddingModel()
        self.embeddings_service = EmbeddingsService(self.model)

        self.vector_db_service = VectorDBService(
            dim=self.model.getDimensions(), index_type="flat"
        )
        self.vector_db_service.load()

    def query(self, query_text, k=5):
        # Generate embedding for the query text
        query_embedding = self.embeddings_service.generate_embedding(query_text)

        # Search the vector database with the query embedding
        results = self.vector_db_service.search(query_embedding, k=k)

        return results
