import "server-only";
import { writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { GoogleGenAI, Type, createPartFromUri } from "@google/genai";
import type {
  ActionItemPriority,
  MeetingSummary,
  Speaker,
  TranscriptSegment,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Client + model config
// ---------------------------------------------------------------------------

const TRANSCRIBE_MODEL =
  process.env.GEMINI_TRANSCRIBE_MODEL ?? "gemini-2.5-flash";
const ANALYZE_MODEL = process.env.GEMINI_ANALYZE_MODEL ?? "gemini-2.5-flash";
const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL ?? "gemini-embedding-001";

/** Embedding vector length we store. Smaller = faster cosine + smaller store. */
const EMBED_DIM = 768;

/** Files larger than this are sent via the Files API instead of inline. */
const INLINE_LIMIT_BYTES = 15 * 1024 * 1024;

let client: GoogleGenAI | null = null;

export function geminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

function getClient(): GoogleGenAI {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env.local and restart the dev server."
    );
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

// ---------------------------------------------------------------------------
// Speaker palette helpers
// ---------------------------------------------------------------------------

const COLOR_CYCLE: Speaker["colorIndex"][] = [1, 2, 3, 4, 5];

function initialsFor(name: string, fallbackLabel: string): string {
  const source = name.trim();
  if (source) {
    return source
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  const num = fallbackLabel.replace(/[^0-9]/g, "");
  return num || "S";
}

// ---------------------------------------------------------------------------
// 1. Transcription + speaker diarisation (audio in -> structured segments)
// ---------------------------------------------------------------------------

const TRANSCRIPT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    durationSec: {
      type: Type.NUMBER,
      description: "Total length of the recording in seconds.",
    },
    speakers: {
      type: Type.ARRAY,
      description: "Distinct speakers detected, in order of first appearance.",
      items: {
        type: Type.OBJECT,
        properties: {
          label: {
            type: Type.STRING,
            description: 'Diarisation label, e.g. "Speaker 1".',
          },
          name: {
            type: Type.STRING,
            description:
              "Real name if confidently stated in the audio, otherwise empty string.",
          },
        },
        required: ["label", "name"],
      },
    },
    segments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          speaker: {
            type: Type.STRING,
            description: 'Speaker label this line belongs to, e.g. "Speaker 1".',
          },
          start: { type: Type.NUMBER, description: "Start time in seconds." },
          end: { type: Type.NUMBER, description: "End time in seconds." },
          text: { type: Type.STRING },
          confidence: {
            type: Type.NUMBER,
            description: "Transcription confidence 0-1.",
          },
        },
        required: ["speaker", "start", "end", "text"],
      },
    },
  },
  required: ["durationSec", "speakers", "segments"],
};

const TRANSCRIBE_PROMPT = `You are an expert meeting transcription and speaker diarisation engine.
Transcribe the attached meeting audio accurately, preserving technical vocabulary, product names, and acronyms.
Diarise the conversation: detect each distinct speaker and attribute every line to one of them.
- Label speakers "Speaker 1", "Speaker 2", ... in the order they first speak.
- If a speaker clearly states their own name or is addressed by name, set that name; otherwise leave name as an empty string.
- Split the transcript into natural segments (roughly one speaker turn each) with accurate start/end timestamps in seconds.
- Do not invent content. Transcribe only what is spoken.
Return strictly the JSON described by the schema.`;

export interface TranscriptionResult {
  durationSec: number;
  speakers: Speaker[];
  segments: TranscriptSegment[];
}

interface RawTranscript {
  durationSec: number;
  speakers: { label: string; name: string }[];
  segments: {
    speaker: string;
    start: number;
    end: number;
    text: string;
    confidence?: number;
  }[];
}

export async function transcribeAndDiarize(
  audio: Buffer,
  mimeType: string
): Promise<TranscriptionResult> {
  const ai = getClient();

  let audioPart;
  let tempPath: string | null = null;

  if (audio.byteLength <= INLINE_LIMIT_BYTES) {
    audioPart = {
      inlineData: { mimeType, data: audio.toString("base64") },
    };
  } else {
    // Large file: upload via the Files API, then reference by URI.
    tempPath = join(tmpdir(), `debriefed-${randomUUID()}`);
    await writeFile(tempPath, audio);
    let uploaded = await ai.files.upload({
      file: tempPath,
      config: { mimeType },
    });
    // Wait until the file is processed and ACTIVE.
    while (uploaded.state === "PROCESSING") {
      await new Promise((r) => setTimeout(r, 2000));
      uploaded = await ai.files.get({ name: uploaded.name! });
    }
    if (uploaded.state === "FAILED") {
      throw new Error("Gemini failed to process the uploaded audio file.");
    }
    audioPart = createPartFromUri(uploaded.uri!, uploaded.mimeType!);
  }

  try {
    const response = await ai.models.generateContent({
      model: TRANSCRIBE_MODEL,
      contents: [
        { role: "user", parts: [audioPart, { text: TRANSCRIBE_PROMPT }] },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: TRANSCRIPT_SCHEMA,
        temperature: 0.1,
      },
    });

    const raw = parseJson<RawTranscript>(response.text);
    return normaliseTranscript(raw);
  } finally {
    if (tempPath) await unlink(tempPath).catch(() => {});
  }
}

function normaliseTranscript(raw: RawTranscript): TranscriptionResult {
  // Build a stable speaker list keyed by label.
  const labelToSpeaker = new Map<string, Speaker>();
  const speakers: Speaker[] = [];

  const ensureSpeaker = (label: string, name?: string): Speaker => {
    const key = label || `Speaker ${labelToSpeaker.size + 1}`;
    let s = labelToSpeaker.get(key);
    if (!s) {
      const idx = labelToSpeaker.size;
      const cleanName = (name ?? "").trim();
      s = {
        id: `spk_${idx + 1}`,
        label: key,
        name: cleanName || undefined,
        colorIndex: COLOR_CYCLE[idx % COLOR_CYCLE.length],
        initials: initialsFor(cleanName, key),
      };
      labelToSpeaker.set(key, s);
      speakers.push(s);
    } else if (!s.name && name?.trim()) {
      s.name = name.trim();
      s.initials = initialsFor(s.name, s.label);
    }
    return s;
  };

  for (const sp of raw.speakers ?? []) ensureSpeaker(sp.label, sp.name);

  const segments: TranscriptSegment[] = (raw.segments ?? []).map((seg, i) => {
    const speaker = ensureSpeaker(seg.speaker);
    return {
      id: `seg_${i + 1}`,
      speakerId: speaker.id,
      start: Math.max(0, Math.round(seg.start ?? 0)),
      end: Math.max(0, Math.round(seg.end ?? 0)),
      text: (seg.text ?? "").trim(),
      confidence:
        typeof seg.confidence === "number" ? seg.confidence : undefined,
    };
  });

  const lastEnd = segments.reduce((m, s) => Math.max(m, s.end), 0);
  const durationSec = Math.max(raw.durationSec ?? 0, lastEnd);

  return { durationSec, speakers, segments };
}

// ---------------------------------------------------------------------------
// 2. Structured analysis: summary, action items, title, tags, gist
// ---------------------------------------------------------------------------

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A concise, descriptive meeting title (max ~8 words).",
    },
    gist: {
      type: Type.STRING,
      description: "A single-sentence summary of the meeting's outcome.",
    },
    tags: {
      type: Type.ARRAY,
      description: "3-6 lowercase topic tags.",
      items: { type: Type.STRING },
    },
    summary: {
      type: Type.OBJECT,
      properties: {
        attendees: { type: Type.ARRAY, items: { type: Type.STRING } },
        keyDecisions: { type: Type.ARRAY, items: { type: Type.STRING } },
        discussionPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
        openQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
        nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: [
        "attendees",
        "keyDecisions",
        "discussionPoints",
        "openQuestions",
        "nextSteps",
      ],
    },
    actionItems: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          task: { type: Type.STRING },
          ownerName: {
            type: Type.STRING,
            description: "Person responsible, or empty string if unassigned.",
          },
          ownerLabel: {
            type: Type.STRING,
            description:
              'Speaker label of the owner if attributable, e.g. "Speaker 2", else empty.',
          },
          deadline: {
            type: Type.STRING,
            description: 'Deadline as stated, e.g. "Friday", or empty string.',
          },
          priority: {
            type: Type.STRING,
            enum: ["high", "medium", "low"],
          },
        },
        required: ["task", "ownerName", "ownerLabel", "deadline", "priority"],
      },
    },
  },
  required: ["title", "gist", "tags", "summary", "actionItems"],
};

export interface AnalysisResult {
  title: string;
  gist: string;
  tags: string[];
  summary: MeetingSummary;
  actionItems: {
    task: string;
    ownerName?: string;
    ownerLabel?: string;
    deadline?: string;
    priority: ActionItemPriority;
  }[];
}

interface RawAnalysis {
  title: string;
  gist: string;
  tags: string[];
  summary: MeetingSummary;
  actionItems: {
    task: string;
    ownerName: string;
    ownerLabel: string;
    deadline: string;
    priority: ActionItemPriority;
  }[];
}

export async function analyzeMeeting(
  transcriptText: string
): Promise<AnalysisResult> {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: ANALYZE_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Analyse the following speaker-labelled meeting transcript.

Produce:
1. A concise title and a one-sentence gist of the outcome.
2. 3-6 lowercase topic tags.
3. A structured summary with: attendees (real names where known, else speaker labels), key decisions, discussion points, open questions, and next steps.
4. Action items: every explicitly stated commitment, with the task, the owner (name if known, plus their speaker label), a deadline if mentioned, and a priority.

Only extract commitments that are actually stated. Do not invent tasks, decisions, or attendees. Return strictly the JSON described by the schema.

TRANSCRIPT:
${transcriptText}`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA,
      temperature: 0.2,
    },
  });

  const raw = parseJson<RawAnalysis>(response.text);

  return {
    title: raw.title?.trim() || "Untitled meeting",
    gist: raw.gist?.trim() || "",
    tags: (raw.tags ?? []).map((t) => t.toLowerCase().trim()).filter(Boolean),
    summary: {
      attendees: raw.summary?.attendees ?? [],
      keyDecisions: raw.summary?.keyDecisions ?? [],
      discussionPoints: raw.summary?.discussionPoints ?? [],
      openQuestions: raw.summary?.openQuestions ?? [],
      nextSteps: raw.summary?.nextSteps ?? [],
    },
    actionItems: (raw.actionItems ?? []).map((a) => ({
      task: a.task?.trim() ?? "",
      ownerName: a.ownerName?.trim() || undefined,
      ownerLabel: a.ownerLabel?.trim() || undefined,
      deadline: a.deadline?.trim() || undefined,
      priority: (["high", "medium", "low"] as const).includes(a.priority)
        ? a.priority
        : "medium",
    })),
  };
}

// ---------------------------------------------------------------------------
// 3. Embeddings (for semantic search over the archive)
// ---------------------------------------------------------------------------

/** Embed a batch of documents. Returns one vector per input text. */
export async function embedDocuments(texts: string[]): Promise<number[][]> {
  return embedBatch(texts, "RETRIEVAL_DOCUMENT");
}

/** Embed a single search query. */
export async function embedQuery(text: string): Promise<number[]> {
  const [vec] = await embedBatch([text], "RETRIEVAL_QUERY");
  return vec;
}

async function embedBatch(
  texts: string[],
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY"
): Promise<number[][]> {
  if (texts.length === 0) return [];
  const ai = getClient();
  const out: number[][] = [];

  // The API accepts batches; chunk to stay well within limits.
  const CHUNK = 100;
  for (let i = 0; i < texts.length; i += CHUNK) {
    const chunk = texts.slice(i, i + CHUNK).map((t) => t.slice(0, 8000));
    const res = await ai.models.embedContent({
      model: EMBED_MODEL,
      contents: chunk,
      config: { taskType, outputDimensionality: EMBED_DIM },
    });
    for (const e of res.embeddings ?? []) out.push(e.values ?? []);
  }
  return out;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseJson<T>(text: string | undefined): T {
  if (!text) throw new Error("Gemini returned an empty response.");
  try {
    return JSON.parse(text) as T;
  } catch {
    // Strip markdown fences if the model wrapped the JSON.
    const cleaned = text
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();
    return JSON.parse(cleaned) as T;
  }
}
