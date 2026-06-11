# 🎙️ Debriefed — AI Meeting Intelligence Platform

> From meeting chaos to structured decisions — every call becomes a searchable knowledge asset.

Debriefed turns a meeting recording into a structured, actionable document: a speaker-labelled
transcript, a structured summary, an action-item checklist, and a searchable archive — all in
under two minutes.

This repository contains the **frontend web application** (the UI layer of the project). It is
built to be wired to a real transcription + RAG backend with minimal changes — every screen reads
from a small, well-typed data layer that can later be swapped for live API calls.

---

## ✨ What's built

All six core features from the assignment have a dedicated, polished home in the UI:

| Feature | Where it lives in the app |
| --- | --- |
| **Audio Transcription** | Upload page with a drag-and-drop dropzone and a live processing pipeline (Upload → Transcribe → Diarise → Extract → Summarise → Index). The transcript itself renders on the meeting detail page with timestamps. |
| **Speaker Diarisation** | Transcript tab — each speaker is colour-coded, and labels can be **renamed inline** (click a speaker chip). Renames flow through to the transcript and the analytics. |
| **Action Item Extraction** | Action Items tab — a checkable list grouped into *Open* / *Completed*, each with owner, deadline, and priority, plus a completion progress bar. |
| **Structured Summary** | Summary tab — attendees, key decisions, discussion points, open questions, and next steps. |
| **Searchable Archive** | A dedicated natural-language Search page (with highlighted snippets and relevance scores) plus a filterable Meetings archive. |
| **Meeting Analytics** | Analytics page — speaking time per participant, meeting frequency over time, action-item completion rate, and recurring topics. |

### Pages / routes

| Route | Description |
| --- | --- |
| `/` | **Dashboard** — overview stats, processing banner, recent meetings, and an action-item snapshot. |
| `/upload` | **New meeting** — upload a recording or capture live, with a simulated processing pipeline. |
| `/meetings` | **Archive** — searchable, filterable, sortable grid of all meetings. |
| `/meetings/[id]` | **Meeting detail** — tabbed view: Summary · Transcript · Action Items · Analytics. |
| `/search` | **Semantic search** — ask questions in plain language across every transcript. |
| `/analytics` | **Analytics** — trends across participation, follow-through, and recurring themes. |

---

## 🛠️ Tech stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (`radix-vega` style) for the component system
- **Recharts** for data visualisation
- **lucide-react** for icons
- **next-themes** for light/dark mode
- **react-dropzone** for file uploads
- **sonner** for toast notifications

---

## 🚀 Getting started

```bash
# from the project root
cd Debriefed

# install dependencies (first time only)
npm install

# start the dev server
npm run dev
```

Then open **http://localhost:5000**.

### Available scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server on port **5000** (hot reload). |
| `npm run build` | Create an optimised production build. |
| `npm run start` | Serve the production build on port **5000**. |
| `npm run lint` | Run ESLint. |

---

## 📁 Project structure

```
Debriefed/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout — fonts, theme provider, toaster, metadata
│   │   ├── globals.css             # Design tokens (colors, radii), theme, custom utilities
│   │   ├── not-found.tsx           # 404 page
│   │   └── (app)/                  # Route group sharing the sidebar shell
│   │       ├── layout.tsx          # Wraps pages in the AppShell
│   │       ├── page.tsx            # Dashboard
│   │       ├── upload/page.tsx
│   │       ├── meetings/page.tsx
│   │       ├── meetings/[id]/page.tsx
│   │       ├── search/page.tsx
│   │       └── analytics/page.tsx
│   │
│   ├── components/
│   │   ├── ui/                     # shadcn/ui primitives (button, card, tabs, …)
│   │   ├── app-shell.tsx           # Sidebar + responsive topbar (⌘K, mobile drawer)
│   │   ├── theme-provider.tsx      # next-themes wrapper
│   │   ├── theme-toggle.tsx        # Light/dark toggle
│   │   ├── logo.tsx
│   │   ├── page-header.tsx
│   │   ├── stat-card.tsx
│   │   ├── meeting-card.tsx
│   │   ├── meeting-status-badge.tsx
│   │   ├── participant-avatars.tsx
│   │   ├── action-item-row.tsx     # Checkable action item (reused on dashboard + detail)
│   │   ├── meetings-archive.tsx    # Client-side filter / sort / search
│   │   ├── meeting-detail.tsx      # Summary / Transcript / Actions / Analytics tabs
│   │   ├── upload-workspace.tsx    # Dropzone, live capture, processing pipeline
│   │   ├── search-workspace.tsx    # Semantic search UI
│   │   └── analytics-dashboard.tsx # Charts (Recharts)
│   │
│   ├── hooks/
│   │   └── use-mounted.ts          # SSR-safe client-mount detection
│   │
│   └── lib/
│       ├── types.ts                # Domain types (Meeting, Speaker, ActionItem, …)
│       ├── mock-data.ts            # Demo meetings, transcripts, summaries, action items
│       ├── analytics.ts            # Derived analytics (speaking time, frequency, …)
│       ├── search.ts               # Mock semantic search over the archive
│       ├── format.ts               # Date / duration / timestamp formatting helpers
│       └── nav.ts                  # Sidebar navigation config
│
├── components.json                 # shadcn/ui configuration
└── package.json
```

---

## 🔌 Wiring up a real backend

The UI is intentionally decoupled from where data comes from. Everything is driven by the
**data layer** in [`src/lib/`](src/lib/):

- **`types.ts`** defines the shapes (`Meeting`, `Speaker`, `TranscriptSegment`, `ActionItem`,
  `MeetingSummary`, `SearchHit`) — these mirror what a real backend would return.
- **`mock-data.ts`** currently supplies demo data. Replace its exports (`MEETINGS`, `getMeeting`,
  `READY_MEETINGS`) with calls to your API.
- **`search.ts`** holds a lightweight token-overlap stand-in for semantic search. Swap
  `semanticSearch()` for an embeddings + vector-store query.
- **`analytics.ts`** computes all analytics from the meeting list, so it works unchanged once
  real meetings flow in.

Because pages and components consume these functions rather than hardcoded values, connecting the
real transcription/diarisation/RAG services should require **no changes to the UI components**.

---

## 🎨 Design notes

- A refined **indigo brand accent** over neutral surfaces; full **light & dark mode**.
- A consistent **per-speaker colour palette** used across avatars, the transcript, and charts.
- Built mobile-first: the sidebar collapses into a drawer, and the topbar exposes a `⌘K` search.
- Design tokens live as CSS variables in [`globals.css`](src/app/globals.css), so the whole theme
  can be re-skinned from one place.

---

## 📌 Status

This is the **frontend** of the AI Meeting Intelligence Platform. Transcription, diarisation,
action-item extraction, summarisation, and semantic search are represented in the UI with
realistic mock data and a clean integration seam, ready for the backend services to be plugged in.
