# DocuMind Frontend Context

This file is the frontend handoff note for any future AI coding agent working in this repository.

## What the frontend is

- Stack: Next.js App Router + TypeScript + Tailwind v4 styles in `globals.css`.
- Role: notebook dashboard, upload flow, notebook chat UI, and notebook-local persistence.
- Root frontend folder: `C:\Users\workstation\Documents\DocuMind\frontend`

## Current product shape

- The app is a dark "Chroma / Linear-inspired" workspace.
- Light mode legacy styling should not be reintroduced.
- The old Studio sidebar and old web-search controls were intentionally removed.

## Key frontend files

- `frontend/app/layout.tsx`
  - Global shell and overflow behavior.
  - Uses the dark theme and prevents horizontal overflow.
- `frontend/app/globals.css`
  - Tailwind v4 theme tokens and global component styles.
  - Defines the dark palette, surface cards, shimmer buttons, texture, and top-right glow.
- `frontend/app/page.tsx`
  - Notebook landing page / dashboard.
  - Uses a 12-column bento grid.
  - Includes create notebook and delete notebook flows.
- `frontend/components/CreateNotebookModal.tsx`
  - Dark modal for creating notebooks and uploading files.
- `frontend/components/ResearchStudioShell.tsx`
  - Main notebook view shell.
  - Two-panel layout only: Sources + Chat.
  - The old Studio panel should stay gone.
- `frontend/components/ChatStream.tsx`
  - Chat UI, SSE streaming, local history cache, backend history restore.
- `frontend/components/ui/dialog.tsx`
  - Dialog primitives used by modal/confirm flows.
- `frontend/hooks/useNotebooks.ts`
  - Notebook list state, local storage persistence, upload flow, delete flow.

## Current visual system

- Background: deep charcoal `#0b0b0b`
- Surface cards: dark glass with 1px borders
- Headings: Geist-style font stack with `tracking-tight`
- Buttons: shimmer or subtle top-border highlight
- A subtle radial glow sits near the top-right of the shell

Important classes from `globals.css`:

- `.surface-card`
- `.shimmer-button`
- `.app-shell-glow`
- `.paper-texture`

## Current page behavior

### Landing page

- File: `frontend/app/page.tsx`
- Purpose:
  - show notebook library
  - create notebook
  - delete notebook with confirmation
- Layout:
  - 12-column bento grid
  - dark dashboard styling
- Persistence:
  - notebook list is stored in `localStorage`
  - key: `documind_notebooks`

### Notebook page

- Main shell: `ResearchStudioShell.tsx`
- Left panel:
  - sources list
  - add sources button
- Right panel:
  - chat interface only
- There should be no Studio panel, web toggle, or search-the-web input anywhere in this view.

## Chat behavior

### `ChatStream.tsx`

- User messages align right.
- Assistant messages align left.
- Assistant bubbles use a subtle filled dark style.
- User bubbles use a bordered developer-tool style.
- The input composer stays sticky at the bottom.
- The message list is the intended scroll area.

### Persistence

- On notebook load:
  1. restore local `localStorage` chat cache immediately
  2. then request backend history from `/api/query/history/{notebookId}`
- Local storage key:
  - `chat_history_${notebookId}`

### Backend connection

- Uses `NEXT_PUBLIC_API_URL`
- Falls back to `http://localhost:8000`
- Query endpoint: `POST /api/query`
- History endpoint: `GET /api/query/history/{notebookId}`

## Notebook creation flow

### `useNotebooks.ts`

- `createNotebook(title, files)`
  - uploads each PDF to backend `POST /api/upload`
  - collects `file_id`s
  - builds a local notebook object
  - stores notebook list in local storage
- `deleteNotebook(notebookId)`
  - removes notebook from frontend state/local storage only
  - does not yet clean backend uploads, FAISS entries, or SQLite records

Notebook objects currently hold:

- `id`
- `title`
- `dateLabel`
- `sourceCount`
- `pastelIndex`
- `fileIds`
- `filenames`

## Overflow and layout rules

These were recently cleaned up and should stay consistent:

- avoid `w-[100vw]`; prefer `w-full`
- keep `overflow-x-hidden` on the global shell
- landing page should scroll vertically
- chat page should avoid app-wide horizontal scroll
- notebook view should keep the composer visible while messages scroll

If overflow bugs come back, check first:

- `frontend/app/layout.tsx`
- `frontend/app/page.tsx`
- `frontend/components/ResearchStudioShell.tsx`
- `frontend/components/ChatStream.tsx`
- `frontend/app/globals.css`

## Startup commands

Frontend dev server:

```powershell
cd C:\Users\workstation\Documents\DocuMind\frontend
$env:NEXT_PUBLIC_API_URL="http://127.0.0.1:8000"
cmd /c npm.cmd run dev
```

If backend runs on `8001`, update `NEXT_PUBLIC_API_URL` before starting dev.

## Things intentionally removed

Do not re-add these unless the product direction changes:

- Studio right-hand sidebar
- Audio Overview / Slide deck / Mind Map cards
- Web / Fast Research toggles
- Search-the-web bar
- non-functional top-right header icons like Share, Settings, Grid, Avatar
- old light-mode dashboard/chat styling

## Known constraints and gotchas

- Notebook list is local-only today; page refresh survives, but another machine/browser will not.
- Backend chat history is persistent, but notebook metadata is not yet backend-backed.
- Uploading multiple PDFs waits for all upload requests before routing into the notebook.
- First chat response may feel slow if the backend is loading Qwen.
- Some older repo docs describe a lighter editorial UI; the current source of truth is this dark Chroma-style shell.

## Safe places to extend next

- backend-backed notebook CRUD
- upload progress UI improvements
- add-source flow from inside notebook
- richer source selection UI
- better note-saving behavior for assistant messages

