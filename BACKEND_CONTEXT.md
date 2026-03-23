# DocuMind Backend Context

This file is the backend handoff note for any future AI coding agent working in this repository.

## What the backend is

- Stack: FastAPI + SQLite + FAISS + local Qwen generation.
- Role: accept PDF uploads, extract text, index document chunks, answer chat questions with retrieval, and persist conversation memory.
- Root backend folder: `C:\Users\workstation\Documents\DocuMind\backend`

## Key backend files

- `backend/app/main.py`
  - FastAPI entrypoint.
  - Starts the API without eagerly loading the LLM.
- `backend/app/api/upload.py`
  - `POST /api/upload`
  - Accepts PDF uploads, saves them to disk, schedules background extraction/indexing, returns `file_id`, page count, and title.
- `backend/app/api/query.py`
  - `POST /api/query`
  - Main chat endpoint using intent classification, query rewriting, hybrid retrieval, fallback summaries, and SSE streaming.
  - `GET /api/query/history/{notebook_id}`
  - Restores persisted messages and summary for notebook chat reloads.
- `backend/app/services/ai_utils.py`
  - Local Qwen loading and generation.
  - Heuristic intent classification and query rewriting.
  - Acknowledgement/insult short-circuit handling.
  - Rolling conversation summary updates.
- `backend/app/services/rag_utils.py`
  - Chunking, embeddings, FAISS search, keyword search, hybrid merge, lightweight reranking, document summary fallback.
- `backend/app/services/pdf_utils.py`
  - PDF extraction and metadata helpers.
- `backend/app/db.py`
  - SQLite persistence for `conversations` and `documents`.
- `backend/app/models/schemas.py`
  - Pydantic request/response models.
- `backend/app/config.py`
  - Environment-backed settings. Secrets should stay here via env vars only.

## Current backend behavior

### Query pipeline

`POST /api/query` currently does this:

1. Loads conversation history from SQLite using `notebook_id` when present.
2. Classifies the user message with fast heuristics into intents like:
   - `summarize_document`
   - `summarize_section`
   - `follow_up_question`
   - `vague_query`
   - `define_term`
   - `methodology_question`
   - `results_question`
   - `compare_documents`
   - `find_specific_information`
   - `acknowledgement`
3. Rewrites short or vague prompts using:
   - the rolling conversation summary
   - uploaded document titles
4. Runs hybrid retrieval:
   - FAISS vector search
   - keyword/BM25-style search
   - lightweight lexical reranking
5. Uses document summaries as fallback when search is low-confidence or empty.
6. Streams the final answer over SSE.
7. Saves messages and periodically refreshes the conversation summary in SQLite.

### Follow-up handling

- Vague prompts like `what is this`, `summarize`, `explain`, `i still don't understand`, and `i dont understand this material` are treated as vague/follow-up intents.
- Follow-up prompts can inject the previous assistant answer into retrieval context.
- Prompts like `give examples for each` rely on the rolling conversation summary to stay on topic.

### Acknowledgement handling

These should not hit retrieval anymore:

- `ok`, `okay`, `thanks`, `thank you`, `got it`
- `no`, `nope`, `nah`, `no thanks`
- slang/frustration like `wtf`, `fuckoff`, `you are useless`

They return short recovery/acknowledgement responses from `build_acknowledgement_response()`.

### Document fallback behavior

- Each uploaded document gets a stored summary during background processing.
- If retrieval is weak, the backend prefers that stored summary over saying it lacks context.

## Persistence

### SQLite

- Database path: `backend/data/documind.db`
- Tables:
  - `conversations`
    - `id`, `messages`, `summary`, `updated_at`
  - `documents`
    - `id`, `title`, `summary`, `metadata`, `updated_at`

### Conversation identity

- Primary key for chat persistence is `notebook_id` when available.
- Fallback key is derived from sorted `file_ids`.

### Document metadata

- Upload/background processing stores:
  - `title`
  - `summary`
  - metadata such as page count and original filename

## Models and retrieval

### Generation model

- Local chat model: `Qwen/Qwen2.5-0.5B-Instruct`
- Loaded lazily from `ai_utils.py`
- This keeps startup lighter but makes the first real generation slower.

### Embeddings

- Preferred remote embedding path: Gemini embedding model if `GEMINI_API_KEY` exists.
- Local fallback: `sentence-transformers/all-MiniLM-L6-v2`

### Retrieval notes

- FAISS metadata is persisted next to the index.
- Current rerank path is intentionally lightweight.
- A heavier cross-encoder was removed from the live request path because it made responses too slow.

## Important endpoints

### `POST /api/upload`

- Accepts `multipart/form-data`
- Validates `application/pdf`
- Saves PDF to disk
- Schedules background extraction and indexing

### `POST /api/query`

Request body:

```json
{
  "file_ids": ["..."],
  "question": "what is this",
  "top_k": 8,
  "notebook_id": "..."
}
```

- Response is streamed as `text/event-stream`
- Emits:
  - `sources`
  - `message`
  - `error`
  - `[DONE]`

### `GET /api/query/history/{notebook_id}`

- Used by the frontend on notebook load to restore chat history and summary.

## Startup commands

Backend dev server:

```powershell
cd C:\Users\workstation\Documents\DocuMind\backend
cmd /c .\.venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000 --reload
```

If `8000` is busy, use `8001` and point the frontend env to that port.

## Environment and secrets

- Secrets must stay in env files, not code.
- `backend/app/config.py` should read env-backed settings only.
- Hardcoded JWT fallback was already removed.

Likely backend env values include:

- `GEMINI_API_KEY`
- `JWT_SECRET`
- path/config values for uploads and FAISS storage

## Known constraints and gotchas

- First Qwen response can be slow due to lazy model load.
- Background upload processing means upload success does not guarantee indexing has fully finished yet.
- Notebook deletion is currently a frontend state deletion only; backend document/index cleanup is not yet wired.
- Chat persistence is real in SQLite, but notebook list persistence is still frontend-local.
- Some older comments/specs in the repo may describe earlier OpenAI/Gemini-first behavior; current answering is centered on local Qwen plus current retrieval code.

## Safe places to extend next

- improve follow-up rewriting heuristics
- tighten retrieval thresholds
- add backend notebook deletion and document cleanup
- add tests for intent classification and query rewriting
- add stronger upload/indexing status reporting

