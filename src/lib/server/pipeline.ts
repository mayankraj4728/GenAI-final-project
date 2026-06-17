import "server-only";
import type { ActionItem, Meeting, Speaker } from "@/lib/types";
import {
  analyzeMeeting,
  embedDocuments,
  transcribeAndDiarize,
} from "./gemini";
import { setVectors, updateMeeting } from "./store";

// ---------------------------------------------------------------------------
// Orchestrates the full processing pipeline for one uploaded recording:
//   audio -> transcript + diarisation -> structured analysis -> embeddings
// Each meeting is created as "processing" first, then filled in here.
// ---------------------------------------------------------------------------

export async function processRecording(
  meetingId: string,
  audio: Buffer,
  mimeType: string
): Promise<void> {
  try {
    // 1. Transcribe + diarise.
    const { durationSec, speakers, segments } = await transcribeAndDiarize(
      audio,
      mimeType
    );

    if (segments.length === 0) {
      throw new Error("No speech could be transcribed from this recording.");
    }

    const speakerByLabel = new Map(speakers.map((s) => [s.label, s]));
    const transcriptText = segments
      .map((seg) => {
        const sp = speakers.find((s) => s.id === seg.speakerId);
        const who = sp?.name || sp?.label || "Unknown";
        return `${who}: ${seg.text}`;
      })
      .join("\n");

    // 2. Structured analysis (summary, action items, tags, title, gist).
    const analysis = await analyzeMeeting(transcriptText);

    const actionItems: ActionItem[] = analysis.actionItems.map((a, i) => {
      const owner = a.ownerLabel
        ? speakerByLabel.get(a.ownerLabel)
        : a.ownerName
          ? speakers.find(
              (s) => s.name?.toLowerCase() === a.ownerName!.toLowerCase()
            )
          : undefined;
      return {
        id: `ai_${i + 1}`,
        task: a.task,
        ownerId: owner?.id,
        ownerName: a.ownerName || owner?.name,
        deadline: a.deadline,
        status: "open",
        priority: a.priority,
      };
    });

    // Confidence-based accuracy proxy (no ground truth to measure true WER).
    const confs = segments
      .map((s) => s.confidence)
      .filter((c): c is number => typeof c === "number");
    const wer =
      confs.length > 0
        ? Math.max(0, 1 - confs.reduce((a, b) => a + b, 0) / confs.length)
        : undefined;

    const ready: Partial<Meeting> = {
      status: "ready",
      durationSec,
      participants: speakers,
      transcript: segments,
      actionItems,
      summary: analysis.summary,
      tags: analysis.tags,
      gist: analysis.gist,
      title: analysis.title,
      wer,
    };

    const current = await updateMeeting(meetingId, ready);
    if (!current) {
      // Meeting vanished mid-flight; nothing more to do.
      return;
    }

    // 3. Embed each segment for semantic search.
    await embedMeetingSegments(meetingId, segments);
  } catch (err) {
    console.error(`[pipeline] processing failed for ${meetingId}:`, err);
    await updateMeeting(meetingId, {
      status: "failed",
      gist:
        err instanceof Error
          ? `Processing failed: ${err.message}`
          : "Processing failed.",
    });
  }
}

/** Embed every transcript segment of a meeting and store the vectors. */
export async function embedMeetingSegments(
  meetingId: string,
  segments: { id: string; text: string }[]
): Promise<void> {
  const usable = segments.filter((s) => s.text.trim().length > 0);
  if (usable.length === 0) return;
  const vectors = await embedDocuments(usable.map((s) => s.text));
  const map: Record<string, number[]> = {};
  usable.forEach((seg, i) => {
    if (vectors[i]) map[seg.id] = vectors[i];
  });
  await setVectors(meetingId, map);
}

/** Build a Meeting record in the "processing" state for a fresh upload. */
export function makeProcessingMeeting(
  id: string,
  title: string,
  source: Meeting["source"]
): Meeting {
  return {
    id,
    title,
    date: new Date().toISOString(),
    durationSec: 0,
    status: "processing",
    source,
    participants: [] as Speaker[],
    tags: [],
    gist: "Transcribing and analysing… your structured summary will be ready shortly.",
    summary: {
      attendees: [],
      keyDecisions: [],
      discussionPoints: [],
      openQuestions: [],
      nextSteps: [],
    },
    transcript: [],
    actionItems: [],
  };
}
