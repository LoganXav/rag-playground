from querying_pipeline import QueryingPipeline
from embeddings_pipeline import EmbeddingsPipeline


def main():
    embedding_pipeline = EmbeddingsPipeline()
    embedding_pipeline.start()
    query_pipeline = QueryingPipeline()
    print("Querying pipeline started. Type 'exit' to quit.")

    while True:
        query_text = input("Enter your query> ")
        if query_text.lower() == "exit":
            break

        results = query_pipeline.query(query_text)
        if results:
            print("\nSearch Results:")
            for i, result in enumerate(results):
                content = result.get("metadata", {}).get("text", "No content available")
                score = result.get("score", "N/A")
                pages = result.get("metadata", {}).get("pageNumbers", [])

                print(
                    f"  {i + 1}. Score: {score:.4f}, Pages: {' '.join(map(str, pages)) if pages else ''}, Content: {content[:500]}..."
                )  # Truncate content for display
        else:
            print("No results found.")


if __name__ == "__main__":
    main()
