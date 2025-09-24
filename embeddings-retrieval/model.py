from sentence_transformers import SentenceTransformer


class EmbeddingModel:
    def __init__(self):
        self.model_name = "all-MiniLM-L6-v2"
        self.model = SentenceTransformer(self.model_name)

    def getDimensions(self):
        return self.model.get_sentence_embedding_dimension()

    def getModelName(self):
        return self.model_name

    def encodeEmbeddingsBatch(
        self, texts, batch_size=64, convert_to_numpy=True, show_progress_bar=False
    ):
        return self.model.encode(
            texts,
            batch_size=batch_size,
            convert_to_numpy=convert_to_numpy,
            show_progress_bar=show_progress_bar,
        )

    def encode(self, text, convert_to_numpy=True):
        return self.model.encode(text, convert_to_numpy=convert_to_numpy)
