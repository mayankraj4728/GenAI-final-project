import "server-only";
import type { SearchHit } from "@/lib/types";
import { speakerDisplayName } from "@/lib/format";
import {
  cosineSimilarity,
  embedQuery,
  geminiConfigured,
} from "./gemini";
import { embedMeetingSegments } from "./pipeline";
import { getAllVectors, listMeetings } from "./store";

// ---------------------------------------------------------------------------
// Semantic search across the whole archive. Primary path embeds the query and
// ranks transcript segments by cosine similarity against stored vectors. If a
// meeting has no vectors yet (e.g. a seeded demo meeting), we embed it on the
// fly. If no API key is configured at all, we fall back to keyword overlap so
// the UI still returns something useful.
// ---------------------------------------------------------------------------

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2)
  );
}

export async function semanticSearch(
  query: string,
  limit = 12
): Promise<SearchHit[]> {
  const q = query.trim();
  if (!q) return [];

  const meetings = (await listMeetings()).filter((m) => m.status === "ready");

  if (!geminiConfigured()) {
    return keywordSearch(q, meetings, limit);
  }

  // Make sure every ready meeting has embeddings (embed seeded ones lazily).
  let vectorsByMeeting = await getAllVectors();
  for (const m of meetings) {
    if (!vectorsByMeeting[m.id] && m.transcript.length > 0) {
      try {
        await embedMeetingSegments(m.id, m.transcript);
      } catch (err) {
        console.error(`[search] failed to embed ${m.id}:`, err);
      }
    }
  }
  vectorsByMeeting = await getAllVectors();

  let queryVec: number[];
  try {
    queryVec = await embedQuery(q);
  } catch (err) {
    console.error("[search] query embedding failed, using keywords:", err);
    return keywordSearch(q, meetings, limit);
  }

  const hits: SearchHit[] = [];
  for (const m of meetings) {
    const vectors = vectorsByMeeting[m.id];
    for (const seg of m.transcript) {
      const vec = vectors?.[seg.id];
      if (!vec) continue;
      const score = cosineSimilarity(queryVec, vec);
      if (score <= 0) continue;
      const speaker = m.participants.find((p) => p.id === seg.speakerId);
      hits.push({
        meetingId: m.id,
        meetingTitle: m.title,
        date: m.date,
        segmentId: seg.id,
        speakerLabel: speaker ? speakerDisplayName(speaker) : "Unknown",
        snippet: seg.text,
        score,
      });
    }
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}

function keywordSearch(
  query: string,
  meetings: Awaited<ReturnType<typeof listMeetings>>,
  limit: number
): SearchHit[] {
  const queryTokens = tokenize(query);
  if (queryTokens.size === 0) return [];

  const hits: SearchHit[] = [];
  for (const m of meetings) {
    for (const seg of m.transcript) {
      const segTokens = tokenize(seg.text);
      let overlap = 0;
      for (const t of segTokens) if (queryTokens.has(t)) overlap += 1;
      if (overlap === 0) continue;
      const score = Math.min(
        0.95,
        0.4 + (overlap / Math.sqrt(segTokens.size || 1)) * 0.5
      );
      const speaker = m.participants.find((p) => p.id === seg.speakerId);
      hits.push({
        meetingId: m.id,
        meetingTitle: m.title,
        date: m.date,
        segmentId: seg.id,
        speakerLabel: speaker ? speakerDisplayName(speaker) : "Unknown",
        snippet: seg.text,
        score,
      });
    }
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}
