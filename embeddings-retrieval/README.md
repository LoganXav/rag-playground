# Embeddings Pipeline

This project implements an embeddings pipeline, designed as a learning exercise to understand and experiment with text embeddings, vector databases, and semantic search concepts.

## Project Overview

The core of this project is the `EmbeddingsPipeline` which defines the process of generating text embeddings from various a given file of chunks and storing them in a vector database for efficient retrieval.

## Learning Objectives

This project serves as a hands-on learning experience to explore:

- **Text Embeddings:** Understanding how sentence transformers convert text into numerical representations (vectors).
- **Vector Databases:** Learning about specialized databases (like FAISS) designed to store and query high-dimensional vectors efficiently.
- **Similarity Search:** Implementing and understanding algorithms for finding the most similar vectors.

## Getting Started

### Prerequisites

- Python 3.8+
- `pip` (Python package installer)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/LoganXav/modular-rag-pipeline.git
   cd modular-rag-pipeline/embeddings
   ```

2. **Create and activate a virtual environment:**

   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

### Running the Pipeline

To start both the embeddings and querying pipelines, execute the `main.py` script:

```bash
python main.py
```

This will initiate the process defined within the `EmbeddingsPipeline` class, which typically involves:

1. Loading or processing raw data.
2. Generating embeddings for the text chunks.
3. Storing these embeddings in the configured vector database.

After the embeddings pipeline is complete, the querying pipeline will start, allowing you to enter queries and retrieve relevant information. Type 'exit' to quit the querying pipeline.

## Querying the Embeddings

Once the `main.py` script is running and the querying pipeline has started, you can enter your search queries at the prompt:

```
Enter your query> your search query here
```

The system will return a list of search results, including a similarity score, the page numbers where the content was found, and a snippet of the relevant content.

## Project Structure

- `main.py`: The entry point for the application, initializing and starting the `EmbeddingsPipeline`.
- `embeddings_pipeline.py`: (Assumed) Contains the main logic for the embeddings pipeline, orchestrating the different services.
- `services/`: Directory containing various services responsible for different parts of the pipeline (e.g., `chunks_service.py`, `embeddings_service.py`, `vector_db_service.py`).
- `data/`: Stores raw data, processed chunks, and the vector database index.
- `requirements.txt`: Lists all Python dependencies for the project.

## Contributing

As a learning project, contributions are welcome! Feel free to fork the repository, experiment with different embedding models, vector databases, or data processing techniques, and submit pull requests.

## License

This project is open-source and available under the MIT License.
