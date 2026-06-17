import { MEETINGS, READY_MEETINGS } from "./mock-data";
import type { Meeting } from "./types";
import { speakerDisplayName } from "./format";

export interface SpeakingTimeRow {
  name: string;
  colorIndex: number;
  /** Total seconds spoken across all meetings */
  seconds: number;
  /** Number of meetings attended */
  meetings: number;
}

/** Aggregate speaking time per person across the whole archive. */
export function speakingTimeByPerson(
  meetings: Meeting[] = READY_MEETINGS
): SpeakingTimeRow[] {
  const map = new Map<string, SpeakingTimeRow>();

  for (const meeting of meetings) {
    const attended = new Set<string>();
    for (const seg of meeting.transcript) {
      const speaker = meeting.participants.find((p) => p.id === seg.speakerId);
      if (!speaker) continue;
      const name = speakerDisplayName(speaker);
      const existing = map.get(name) ?? {
        name,
        colorIndex: speaker.colorIndex,
        seconds: 0,
        meetings: 0,
      };
      existing.seconds += seg.end - seg.start;
      map.set(name, existing);
      attended.add(name);
    }
    for (const name of attended) {
      const row = map.get(name);
      if (row) row.meetings += 1;
    }
  }

  return [...map.values()].sort((a, b) => b.seconds - a.seconds);
}

/** Speaking-time split for a single meeting, as percentages. */
export function speakingShareForMeeting(meeting: Meeting) {
  const totals = new Map<string, number>();
  for (const seg of meeting.transcript) {
    totals.set(
      seg.speakerId,
      (totals.get(seg.speakerId) ?? 0) + (seg.end - seg.start)
    );
  }
  const grand = [...totals.values()].reduce((a, b) => a + b, 0) || 1;
  return meeting.participants
    .map((p) => {
      const seconds = totals.get(p.id) ?? 0;
      return {
        speaker: p,
        seconds,
        pct: Math.round((seconds / grand) * 100),
      };
    })
    .sort((a, b) => b.seconds - a.seconds);
}

export interface ActionItemStats {
  total: number;
  completed: number;
  open: number;
  /** 0-100 */
  completionRate: number;
}

export function actionItemStats(
  meetings: Meeting[] = MEETINGS
): ActionItemStats {
  let total = 0;
  let completed = 0;
  for (const m of meetings) {
    for (const ai of m.actionItems) {
      total += 1;
      if (ai.status === "completed") completed += 1;
    }
  }
  return {
    total,
    completed,
    open: total - completed,
    completionRate: total ? Math.round((completed / total) * 100) : 0,
  };
}

/** Meeting count grouped into ISO week buckets, oldest → newest. */
export function meetingFrequency(meetings: Meeting[] = MEETINGS) {
  const byWeek = new Map<string, number>();
  for (const m of meetings) {
    const d = new Date(m.date);
    // Bucket by the Monday of that week.
    const day = (d.getDay() + 6) % 7; // 0 = Monday
    const monday = new Date(d);
    monday.setDate(d.getDate() - day);
    const key = monday.toISOString().slice(0, 10);
    byWeek.set(key, (byWeek.get(key) ?? 0) + 1);
  }
  return [...byWeek.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([weekStart, count]) => ({
      weekStart,
      label: new Date(weekStart).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      count,
    }));
}

export interface TopicRow {
  topic: string;
  count: number;
}

/** Recurring topics ranked by how many meetings they appear in. */
export function recurringTopics(meetings: Meeting[] = MEETINGS): TopicRow[] {
  const counts = new Map<string, number>();
  for (const m of meetings) {
    for (const tag of m.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count);
}

export interface ArchiveOverview {
  totalMeetings: number;
  readyMeetings: number;
  processingMeetings: number;
  totalDurationSec: number;
  totalActionItems: number;
  openActionItems: number;
  uniqueParticipants: number;
  avgWer: number | null;
}

export function archiveOverview(meetings: Meeting[] = MEETINGS): ArchiveOverview {
  const people = new Set<string>();
  let totalDurationSec = 0;
  let totalActionItems = 0;
  let openActionItems = 0;
  let werSum = 0;
  let werCount = 0;

  for (const m of meetings) {
    totalDurationSec += m.durationSec;
    for (const p of m.participants) people.add(p.name ?? `${m.id}:${p.id}`);
    for (const ai of m.actionItems) {
      totalActionItems += 1;
      if (ai.status === "open") openActionItems += 1;
    }
    if (typeof m.wer === "number") {
      werSum += m.wer;
      werCount += 1;
    }
  }

  return {
    totalMeetings: meetings.length,
    readyMeetings: meetings.filter((m) => m.status === "ready").length,
    processingMeetings: meetings.filter((m) => m.status === "processing").length,
    totalDurationSec,
    totalActionItems,
    openActionItems,
    uniqueParticipants: people.size,
    avgWer: werCount ? werSum / werCount : null,
  };
}
