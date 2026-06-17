# 🎙️ Debriefed — AI Meeting Intelligence Platform

> From meeting chaos to structured decisions — every call becomes a searchable knowledge asset.

Turn a meeting recording into a structured, searchable knowledge asset: a
speaker-labelled transcript, a structured summary, an action-item checklist, a
semantic search archive, and analytics — all powered by the **Google Gemini API**.

Built with Next.js 16 (App Router) + Tailwind. No external database or
transcription service required: Gemini handles transcription, diarisation,
analysis, and embeddings; data persists to a local JSON file store.

## Features (maps to the assignment)

| Requirement | How it's implemented |
|---|---|
| **Audio transcription** | Gemini 2.5 transcribes uploaded audio (`gemini-2.5-flash`), preserving technical vocabulary. |
| **Speaker diarisation** | Gemini labels speakers (Speaker 1, 2, …); you can rename them in the transcript view (persisted). |
| **Action item extraction** | Structured JSON output: task, owner, deadline, priority. Checkable + persisted. |
| **Structured summary** | Attendees, key decisions, discussion points, open questions, next steps. |
| **Searchable archive** | Natural-language semantic search via `gemini-embedding-001` + cosine similarity. |
| **Meeting analytics** | Speaking time, meeting frequency, action-item completion rate, recurring topics. |

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Add your Gemini API key.** Get one (free tier available) at
   <https://aistudio.google.com/apikey>, then put it in `.env.local`:

   ```bash
   GEMINI_API_KEY=your_key_here
   ```

3. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open <http://localhost:5000>.

The archive is seeded with 5 demo meetings so search/analytics look populated
immediately. Real uploads are added on top.

## How processing works

1. `POST /api/meetings` accepts an audio file (multipart `audio` field), creates
   the meeting in a `processing` state, and returns immediately.
2. In the background the pipeline runs: **transcribe + diarise → summarise +
   extract action items → embed segments for search.**
3. The UI polls `GET /api/meetings/[id]` until status becomes `ready` (or
   `failed`), then shows the full result.

> Because processing runs in the background of the Node server, run the app with
> `npm run dev` or `npm run build && npm run start` (a long-running server).
> Short audio clips finish in well under 2 minutes.

## API routes

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/meetings` | List all meetings |
| `POST` | `/api/meetings` | Upload audio, start processing |
| `GET` | `/api/meetings/[id]` | Fetch one meeting (polled while processing) |
| `PATCH` | `/api/meetings/[id]` | Rename speakers, toggle action items, rename meeting |
| `DELETE` | `/api/meetings/[id]` | Remove a meeting |
| `GET` | `/api/search?q=` | Semantic search across the archive |

## Architecture

```
src/
  app/
    (app)/...            server components — read the store directly
    api/...              route handlers (the backend)
  components/...         client UI (upload, search, transcript, etc.)
  lib/
    types.ts             shared domain types
    analytics.ts         pure analytics helpers
    mock-data.ts         demo meetings used to seed the store
    server/
      gemini.ts          Gemini: transcribe/diarise, analyse, embed
      store.ts           JSON file store (data/store.json) + seeding
      pipeline.ts        orchestration: audio -> ready meeting
      search.ts          semantic search (embeddings + keyword fallback)
```

The store lives in `data/store.json` (gitignored, created on first run). Delete
it to reset the archive back to the seed.

## Notes

- **No API key?** The app still renders and search degrades gracefully to
  keyword matching; uploads return a clear error until a key is set.
- **Live capture** records from your microphone (`MediaRecorder`) and runs the
  recording through the same pipeline. For best transcription quality, uploading
  an MP3/WAV/M4A file is recommended.
- Model IDs are overridable via `GEMINI_TRANSCRIBE_MODEL`,
  `GEMINI_ANALYZE_MODEL`, `GEMINI_EMBED_MODEL` (see `.env.example`).
