// Domain types for the Meeting Intelligence platform.
// These mirror the shape a real transcription + RAG backend would return,
// so the UI can be wired to live data later with minimal changes.

export type MeetingStatus = "processing" | "ready" | "failed";
export type MeetingSource = "upload" | "live";

/** A diarised speaker. `name` is assigned by the user post-processing. */
export interface Speaker {
  /** Stable id, e.g. "spk_1" */
  id: string;
  /** Auto-generated diarisation label, e.g. "Speaker 1" */
  label: string;
  /** Human name assigned by the user (optional) */
  name?: string;
  /** Index 1-5 into the chart color palette, for consistent coloring */
  colorIndex: 1 | 2 | 3 | 4 | 5;
  initials: string;
}

export interface TranscriptSegment {
  id: string;
  speakerId: string;
  /** Start time in seconds from the beginning of the recording */
  start: number;
  end: number;
  text: string;
  /** Model confidence 0-1 for this segment (optional) */
  confidence?: number;
}

export type ActionItemStatus = "open" | "completed";
export type ActionItemPriority = "high" | "medium" | "low";

export interface ActionItem {
  id: string;
  task: string;
  /** Speaker id of the owner, if attributable */
  ownerId?: string;
  /** Free-text owner name (fallback when not a known speaker) */
  ownerName?: string;
  /** Human-readable deadline as stated, e.g. "Friday", "Apr 30" */
  deadline?: string;
  status: ActionItemStatus;
  priority: ActionItemPriority;
  /** Segment this commitment was extracted from, for traceability */
  sourceSegmentId?: string;
}

export interface MeetingSummary {
  attendees: string[];
  keyDecisions: string[];
  discussionPoints: string[];
  openQuestions: string[];
  nextSteps: string[];
}

export interface Meeting {
  id: string;
  title: string;
  /** ISO datetime of when the meeting took place */
  date: string;
  durationSec: number;
  status: MeetingStatus;
  source: MeetingSource;
  participants: Speaker[];
  /** Recurring topic tags surfaced from the content */
  tags: string[];
  /** One-line gist used in list/search views */
  gist: string;
  summary: MeetingSummary;
  transcript: TranscriptSegment[];
  actionItems: ActionItem[];
  /** Transcription word error rate (0-1) on the demo audio, if measured */
  wer?: number;
}

/** A semantic search hit across the archive. */
export interface SearchHit {
  meetingId: string;
  meetingTitle: string;
  date: string;
  segmentId: string;
  speakerLabel: string;
  snippet: string;
  /** Cosine similarity 0-1 */
  score: number;
}
