import "server-only";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type { Meeting } from "@/lib/types";
import { MEETINGS } from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// A tiny JSON-file store. Meetings + per-segment embedding vectors live in
// data/store.json. Vectors are kept separate so they never get serialised down
// to the client. The store is seeded from the demo meetings on first run.
// ---------------------------------------------------------------------------

const DATA_DIR = join(process.cwd(), "data");
const STORE_PATH = join(DATA_DIR, "store.json");

interface StoreShape {
  meetings: Meeting[];
  /** meetingId -> segmentId -> embedding vector */
  vectors: Record<string, Record<string, number[]>>;
}

// Survive Next.js dev HMR by caching on globalThis.
const globalForStore = globalThis as unknown as {
  __debriefedStore?: StoreShape;
  __debriefedWriteChain?: Promise<void>;
};

function seed(): StoreShape {
  // Deep clone the demo meetings so runtime edits never mutate the module.
  // Skip any placeholder still in "processing" — with no audio it can never
  // finish, and would spin forever in the UI.
  return {
    meetings: structuredClone(MEETINGS.filter((m) => m.status === "ready")),
    vectors: {},
  };
}

async function load(): Promise<StoreShape> {
  if (globalForStore.__debriefedStore) return globalForStore.__debriefedStore;

  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as StoreShape;
    globalForStore.__debriefedStore = {
      meetings: parsed.meetings ?? [],
      vectors: parsed.vectors ?? {},
    };
  } catch {
    // No store yet (or unreadable) — seed it and persist.
    globalForStore.__debriefedStore = seed();
    await persist();
  }
  return globalForStore.__debriefedStore!;
}

/** Serialise the in-memory store to disk, one write at a time. */
async function persist(): Promise<void> {
  const run = async () => {
    const store = globalForStore.__debriefedStore;
    if (!store) return;
    await mkdir(DATA_DIR, { recursive: true });
    const tmp = `${STORE_PATH}.${randomUUID()}.tmp`;
    await writeFile(tmp, JSON.stringify(store), "utf8");
    await rename(tmp, STORE_PATH); // atomic replace
  };
  // Chain writes so concurrent saves don't interleave / corrupt the file.
  const prev = globalForStore.__debriefedWriteChain ?? Promise.resolve();
  const next = prev.then(run, run);
  globalForStore.__debriefedWriteChain = next;
  return next;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function listMeetings(): Promise<Meeting[]> {
  const store = await load();
  // Newest first.
  return [...store.meetings].sort(
    (a, b) => +new Date(b.date) - +new Date(a.date)
  );
}

export async function getMeeting(id: string): Promise<Meeting | undefined> {
  const store = await load();
  return store.meetings.find((m) => m.id === id);
}

export async function createMeeting(meeting: Meeting): Promise<Meeting> {
  const store = await load();
  store.meetings.push(meeting);
  await persist();
  return meeting;
}

/** Replace a meeting in place (used when processing completes). */
export async function replaceMeeting(meeting: Meeting): Promise<void> {
  const store = await load();
  const i = store.meetings.findIndex((m) => m.id === meeting.id);
  if (i === -1) store.meetings.push(meeting);
  else store.meetings[i] = meeting;
  await persist();
}

/** Shallow-merge a patch into a meeting and persist. */
export async function updateMeeting(
  id: string,
  patch: Partial<Meeting>
): Promise<Meeting | undefined> {
  const store = await load();
  const m = store.meetings.find((x) => x.id === id);
  if (!m) return undefined;
  Object.assign(m, patch);
  await persist();
  return m;
}

export async function deleteMeeting(id: string): Promise<boolean> {
  const store = await load();
  const before = store.meetings.length;
  store.meetings = store.meetings.filter((m) => m.id !== id);
  delete store.vectors[id];
  const removed = store.meetings.length < before;
  if (removed) await persist();
  return removed;
}

// ---- Embedding vectors -----------------------------------------------------

export async function setVectors(
  meetingId: string,
  vectors: Record<string, number[]>
): Promise<void> {
  const store = await load();
  store.vectors[meetingId] = vectors;
  await persist();
}

export async function getVectors(
  meetingId: string
): Promise<Record<string, number[]> | undefined> {
  const store = await load();
  return store.vectors[meetingId];
}

export async function getAllVectors(): Promise<
  Record<string, Record<string, number[]>>
> {
  const store = await load();
  return store.vectors;
}

export function newMeetingId(): string {
  return `mtg_${randomUUID().slice(0, 8)}`;
}
