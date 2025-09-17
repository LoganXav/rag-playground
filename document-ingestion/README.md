# Document Ingestion Service: Deconstructing RAG Pre-processing

This `document-ingestion` service explores the foundational mechanics of a Retrieval Augmented Generation (RAG) pipeline. As part of a larger collection, the goal here is to show an important document pre-processing stage in a larger more robust AI system.

## Understanding RAG from the Ground Up

When working with RAG systems, it's easy to rely on high-level frameworks that abstract away much of the complexity. While incredibly powerful, I wanted to peel back the layers and truly explore what happens _under the hood_. This project is my attempt to build, from first principles, the essential document ingestion steps that prepare raw data for effective retrieval and generation.

## Demystifying Document Pre-processing

These are some of the several critical pre-processing operations, each designed to tackle a specific challenge in preparing documents for a RAG pipeline:

1. **PDF Parsing**: This extracts text content from PDF documents. This step is crucial because raw PDFs come in many formats, and getting clean, readable text is the first hurdle. Frameworks like Langchain's `PDFLoader` or LlamaIndex's `SimpleDirectoryReader` handle this seamlessly, but here, we see what goes into robustly extracting that information.

2. **Text Normalization**: After extraction, text is often messy. Normalization helps to clean and standardize the text—removing extraneous characters, fixing encoding issues, and ensuring consistent formatting. This is important because downstream models expect clean input.

3. **Chunking**: Large documents are unwieldy for RAG models. Chunking mechanism break down documents into smaller, contextually relevant pieces taking into consideration things like the chunkSize, overlap etc. This is where you see the direct parallel with tools like Langchain's `RecursiveCharacterTextSplitter` or LlamaIndex's `SentenceSplitter`.

4. **Page Metadata Extraction**: Focuses on extracting and associating metadata like page numbers with each chunk. This enriches the data, making retrieval more intelligent. Explicitly handling it here shows how crucial contextual information is for improving search relevance.

5. **Checksum Generation**: To ensure data integrity and efficient change detection, I implemented checksum generation for both raw documents and their processed chunks. This is a practical engineering concern for any data pipeline, ensuring that I'm not re-processing unchanged files and that data remains consistent over time.

