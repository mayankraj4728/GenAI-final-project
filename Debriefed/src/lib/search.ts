import { READY_MEETINGS } from "./mock-data";
import type { SearchHit } from "./types";
import { speakerDisplayName } from "./format";

// A lightweight stand-in for semantic search. A real implementation would
// embed the query and rank transcript chunks by cosine similarity against a
// vector store. Here we approximate relevance with token overlap + a small
// synonym map, which is enough to make the UI feel real and demoable.

const SYNONYMS: Record<string, string[]> = {
  search: ["semantic", "query", "retrieval", "find", "vector", "embedding"],
  hiring: ["headcount", "engineer", "req", "recruit", "role"],
  onboarding: ["activation", "wizard", "first value", "import"],
  infrastructure: ["pipeline", "deploy", "queue", "latency", "postgres"],
  budget: ["funding", "spend", "marketing", "cost"],
  decision: ["decided", "approve", "lock", "commit", "agreed"],
  deadline: ["friday", "thursday", "week", "sprint", "freeze"],
};

function expand(token: string): string[] {
  const out = [token];
  for (const [key, syns] of Object.entries(SYNONYMS)) {
    if (token === key) out.push(...syns);
    else if (syns.includes(token)) out.push(key, ...syns);
  }
  return out;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Suggested queries surfaced in the empty state. */
export const SAMPLE_QUERIES = [
  "What did we decide about the vector store migration?",
  "Who owns the onboarding wizard redesign?",
  "When are we launching semantic search?",
  "What are the open questions about re-embedding the archive?",
  "Why is time-to-first-value so high?",
];

export function semanticSearch(query: string, limit = 12): SearchHit[] {
  const queryTokens = tokenize(query).flatMap(expand);
  if (queryTokens.length === 0) return [];
  const querySet = new Set(queryTokens);

  const hits: SearchHit[] = [];

  for (const meeting of READY_MEETINGS) {
    for (const seg of meeting.transcript) {
      const segTokens = tokenize(seg.text);
      if (segTokens.length === 0) continue;
      let overlap = 0;
      for (const t of segTokens) if (querySet.has(t)) overlap += 1;
      if (overlap === 0) continue;

      // Normalise: reward density of matches, lightly penalise long segments.
      const score = Math.min(
        0.99,
        0.45 + (overlap / Math.sqrt(segTokens.length)) * 0.5
      );

      const speaker = meeting.participants.find((p) => p.id === seg.speakerId);
      hits.push({
        meetingId: meeting.id,
        meetingTitle: meeting.title,
        date: meeting.date,
        segmentId: seg.id,
        speakerLabel: speaker ? speakerDisplayName(speaker) : "Unknown",
        snippet: seg.text,
        score,
      });
    }
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}
