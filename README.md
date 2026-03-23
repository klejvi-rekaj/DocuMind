# DocuMind: High-Performance RAG Analysis Platform

DocuMind is a professional Retrieval-Augmented Generation (RAG) platform designed for the precise analysis of PDF documents. By integrating a FastAPI backend with a Next.js frontend, the system provides a seamless interface for document ingestion, management, and interactive AI-driven research.

---

## Technical Architecture

The platform utilizes a decoupled architecture to ensure high performance and modular scalability.

### Backend (FastAPI)

| Component | Technology |
|---|---|
| Framework | FastAPI (Python 3.10+) |
| Parsing | Memory-efficient PDF processing via pdfplumber |
| Vector Storage | FAISS (Facebook AI Similarity Search) for optimized similarity indexing |
| AI Orchestration | Custom RAG pipeline utilizing Large Language Models for context-aware querying |

### Frontend (Next.js)

| Component | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS and shadcn/ui components |
| State Management | Real-time source selection and asynchronous chat streaming |

---

## Core Functionalities

- **Dynamic Document Ingestion** — Support for multi-PDF uploads with immediate vector store indexing.
- **Granular Source Control** — Integrated sidebar allowing users to toggle specific documents as active context for the AI.
- **Research Studio UI** — An asymmetric layout optimized for simultaneous document overview and interactive dialogue.
- **Optimized Stream Processing** — Character-by-character response delivery for low-latency user interaction.

---

## Installation and Configuration

### Prerequisites

- Node.js v18 or higher
- Python v3.10 or higher
- Git

### Backend Configuration

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Initialize a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the environment:
   - **Windows:** `venv\Scripts\activate`
   - **Unix/macOS:** `source venv/bin/activate`

4. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```

5. Create a `.env` file and configure your environment variables (API keys and database configurations).

6. Launch the development server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Configuration

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Execute the development server:
   ```bash
   npm run dev
   ```

---

## Directory Structure

```
DocuMind/
├── backend/
│   ├── app/
│   │   ├── api/          # Document upload and query handling
│   │   ├── services/     # RAG logic and AI utility services
│   │   └── models/       # Data validation schemas
│   └── data/             # Protected storage for uploads and indices
├── frontend/
│   ├── app/              # Application routes and pages
│   ├── components/       # Interface components
│   └── lib/              # Utility functions and type definitions
└── .gitignore            # Multi-environment exclusion rules
```

---

## License

Copyright 2026 Klejvi Rekaj. All rights reserved.
