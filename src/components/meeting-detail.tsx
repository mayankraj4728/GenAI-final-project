"use client";

import * as React from "react";
import {
  FileText,
  ListChecks,
  BarChart3,
  AlignLeft,
  Users,
  Gavel,
  MessageSquare,
  HelpCircle,
  ArrowRightCircle,
  Search,
  Pencil,
  Check,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import type { Meeting, Speaker } from "@/lib/types";
import { formatTimestamp, formatDuration } from "@/lib/format";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ActionItemRow } from "@/components/action-item-row";

const TABS = ["summary", "transcript", "actions", "analytics"] as const;
type TabKey = (typeof TABS)[number];

export function MeetingDetail({
  meeting,
  initialTab,
  meetingId,
}: {
  meeting: Meeting;
  initialTab?: string;
  meetingId: string;
}) {
  const startTab: TabKey = TABS.includes(initialTab as TabKey)
    ? (initialTab as TabKey)
    : "summary";

  // Editable speaker names, keyed by speaker id.
  const [names, setNames] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(
      meeting.participants.map((p) => [p.id, p.name ?? p.label])
    )
  );

  // Update local state immediately, then persist the rename to the backend.
  const renameSpeaker = React.useCallback(
    (id: string, name: string) => {
      setNames((prev) => ({ ...prev, [id]: name }));
      fetch(`/api/meetings/${meetingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ speakerNames: { [id]: name } }),
      }).catch(() => {});
    },
    [meetingId]
  );

  const speakerById = React.useMemo(
    () => new Map(meeting.participants.map((p) => [p.id, p])),
    [meeting.participants]
  );

  const displayName = (id: string) => names[id] ?? speakerById.get(id)?.label ?? "Unknown";

  const openCount = meeting.actionItems.filter(
    (a) => a.status === "open"
  ).length;

  return (
    <Tabs defaultValue={startTab} className="gap-6">
      <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
        <TabsTrigger value="summary" className="gap-2">
          <FileText className="size-4" />
          Summary
        </TabsTrigger>
        <TabsTrigger value="transcript" className="gap-2">
          <AlignLeft className="size-4" />
          Transcript
        </TabsTrigger>
        <TabsTrigger value="actions" className="gap-2">
          <ListChecks className="size-4" />
          Action items
          {openCount > 0 && (
            <span className="ml-0.5 rounded-full bg-warning/15 px-1.5 text-[10px] font-semibold text-warning">
              {openCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="analytics" className="gap-2">
          <BarChart3 className="size-4" />
          Analytics
        </TabsTrigger>
      </TabsList>

      <TabsContent value="summary">
        <SummaryTab meeting={meeting} />
      </TabsContent>

      <TabsContent value="transcript">
        <TranscriptTab
          meeting={meeting}
          displayName={displayName}
          names={names}
          onRename={renameSpeaker}
        />
      </TabsContent>

      <TabsContent value="actions">
        <ActionsTab meeting={meeting} meetingId={meetingId} />
      </TabsContent>

      <TabsContent value="analytics">
        <MeetingAnalyticsTab meeting={meeting} displayName={displayName} />
      </TabsContent>
    </Tabs>
  );
}

/* -------------------------------------------------------------------------- */
/* Summary                                                                     */
/* -------------------------------------------------------------------------- */

function SummaryTab({ meeting }: { meeting: Meeting }) {
  const { summary } = meeting;

  return (
    <div className="space-y-5">
      <Card className="gap-0 border-brand/20 bg-brand/[0.03] p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-brand">
          In one line
        </p>
        <p className="mt-1.5 text-[15px] leading-relaxed text-foreground">
          {meeting.gist}
        </p>
      </Card>

      <Card className="gap-0 p-5">
        <SectionHeader icon={Users} title="Attendees" tone="muted" />
        <div className="mt-3 flex flex-wrap gap-2">
          {summary.attendees.map((a, i) => (
            <span
              key={a}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-3 text-sm"
            >
              <span
                className="flex size-6 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                style={{ backgroundColor: `var(--chart-${(i % 5) + 1})` }}
              >
                {a
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              {a}
            </span>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <SummaryList
          icon={Gavel}
          title="Key decisions"
          tone="success"
          items={summary.keyDecisions}
        />
        <SummaryList
          icon={ArrowRightCircle}
          title="Next steps"
          tone="brand"
          items={summary.nextSteps}
        />
        <SummaryList
          icon={MessageSquare}
          title="Discussion points"
          tone="muted"
          items={summary.discussionPoints}
        />
        <SummaryList
          icon={HelpCircle}
          title="Open questions"
          tone="warning"
          items={summary.openQuestions}
        />
      </div>
    </div>
  );
}

const TONE: Record<string, string> = {
  brand: "bg-brand/10 text-brand",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning",
  muted: "bg-muted text-muted-foreground",
};

function SectionHeader({
  icon: Icon,
  title,
  tone,
  count,
}: {
  icon: typeof Users;
  title: string;
  tone: string;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded-lg",
          TONE[tone]
        )}
      >
        <Icon className="size-4" />
      </span>
      <h3 className="font-heading text-sm font-semibold">{title}</h3>
      {count != null && (
        <span className="text-xs text-muted-foreground">{count}</span>
      )}
    </div>
  );
}

function SummaryList({
  icon,
  title,
  tone,
  items,
}: {
  icon: typeof Users;
  title: string;
  tone: string;
  items: string[];
}) {
  return (
    <Card className="h-full gap-0 p-5">
      <SectionHeader icon={icon} title={title} tone={tone} count={items.length} />
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2.5">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
              <span
                className={cn(
                  "mt-1.5 size-1.5 shrink-0 rounded-full",
                  tone === "brand" && "bg-brand",
                  tone === "success" && "bg-success",
                  tone === "warning" && "bg-warning",
                  tone === "muted" && "bg-muted-foreground/40"
                )}
              />
              <span className="text-foreground/90">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">None recorded.</p>
      )}
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Transcript                                                                  */
/* -------------------------------------------------------------------------- */

function TranscriptTab({
  meeting,
  displayName,
  names,
  onRename,
}: {
  meeting: Meeting;
  displayName: (id: string) => string;
  names: Record<string, string>;
  onRename: (id: string, name: string) => void;
}) {
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();

  const segments = meeting.transcript.filter(
    (s) => !q || s.text.toLowerCase().includes(q)
  );

  const copyTranscript = () => {
    const text = meeting.transcript
      .map(
        (s) =>
          `[${formatTimestamp(s.start)}] ${displayName(s.speakerId)}: ${s.text}`
      )
      .join("\n\n");
    navigator.clipboard?.writeText(text);
    toast.success("Transcript copied to clipboard");
  };

  return (
    <div className="space-y-5">
      {/* Speaker legend / rename */}
      <Card className="gap-0 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Speakers — click a name to rename
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {meeting.participants.map((p) => (
            <SpeakerChip
              key={p.id}
              speaker={p}
              value={names[p.id] ?? p.label}
              onChange={(val) => onRename(p.id, val)}
            />
          ))}
        </div>
      </Card>

      {/* Search + actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search within this transcript…"
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={copyTranscript}>
          <Copy className="size-4" />
          Copy transcript
        </Button>
      </div>

      <Card className="gap-0 p-2">
        {segments.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            No lines match “{query}”.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {segments.map((seg) => {
              const speaker = meeting.participants.find(
                (p) => p.id === seg.speakerId
              );
              return (
                <div key={seg.id} className="flex gap-3 px-3 py-4">
                  <span
                    className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                    style={{
                      backgroundColor: speaker
                        ? `var(--chart-${speaker.colorIndex})`
                        : "var(--muted-foreground)",
                    }}
                  >
                    {speaker?.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-semibold"
                        style={{
                          color: speaker
                            ? `var(--chart-${speaker.colorIndex})`
                            : undefined,
                        }}
                      >
                        {displayName(seg.speakerId)}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground tabular-nums">
                        {formatTimestamp(seg.start)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/90">
                      <Highlight text={seg.text} query={q} />
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function SpeakerChip({
  speaker,
  value,
  onChange,
}: {
  speaker: Speaker;
  value: string;
  onChange: (val: string) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const save = () => {
    const v = draft.trim();
    if (v && v !== value) {
      onChange(v);
      toast.success(`Renamed to “${v}”`);
    }
    setEditing(false);
  };

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-2 text-sm"
      style={{ borderColor: `color-mix(in oklch, var(--chart-${speaker.colorIndex}) 35%, transparent)` }}
    >
      <span
        className="flex size-6 items-center justify-center rounded-full text-[10px] font-semibold text-white"
        style={{ backgroundColor: `var(--chart-${speaker.colorIndex})` }}
      >
        {speaker.initials}
      </span>
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              setDraft(value);
              setEditing(false);
            }
          }}
          className="w-24 bg-transparent text-sm outline-none"
        />
      ) : (
        <button
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
          className="group inline-flex items-center gap-1"
        >
          {value}
          {editing ? (
            <Check className="size-3 text-muted-foreground" />
          ) : (
            <Pencil className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          )}
        </button>
      )}
    </span>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-warning/30 px-0.5 text-foreground">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Action items                                                                */
/* -------------------------------------------------------------------------- */

function ActionsTab({
  meeting,
  meetingId,
}: {
  meeting: Meeting;
  meetingId: string;
}) {
  const open = meeting.actionItems.filter((a) => a.status === "open");
  const done = meeting.actionItems.filter((a) => a.status === "completed");
  const total = meeting.actionItems.length;
  const rate = total ? Math.round((done.length / total) * 100) : 0;

  return (
    <div className="space-y-5">
      <Card className="gap-0 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-heading text-sm font-semibold">
              {done.length} of {total} completed
            </p>
            <p className="text-xs text-muted-foreground">
              Extracted commitments with owners and deadlines
            </p>
          </div>
          <span className="font-heading text-2xl font-semibold tabular-nums">
            {rate}%
          </span>
        </div>
        <Progress value={rate} className="mt-4 h-2" />
      </Card>

      {open.length > 0 && (
        <div>
          <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Open · {open.length}
          </p>
          <Card className="gap-0 p-1.5">
            <div className="divide-y divide-border">
              {open.map((item) => (
                <ActionItemRow key={item.id} item={item} meetingId={meetingId} />
              ))}
            </div>
          </Card>
        </div>
      )}

      {done.length > 0 && (
        <div>
          <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Completed · {done.length}
          </p>
          <Card className="gap-0 p-1.5">
            <div className="divide-y divide-border">
              {done.map((item) => (
                <ActionItemRow key={item.id} item={item} meetingId={meetingId} />
              ))}
            </div>
          </Card>
        </div>
      )}

      {total === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No action items were extracted from this meeting.
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Per-meeting analytics                                                       */
/* -------------------------------------------------------------------------- */

function MeetingAnalyticsTab({
  meeting,
  displayName,
}: {
  meeting: Meeting;
  displayName: (id: string) => string;
}) {
  const totals = new Map<string, number>();
  for (const seg of meeting.transcript) {
    totals.set(
      seg.speakerId,
      (totals.get(seg.speakerId) ?? 0) + (seg.end - seg.start)
    );
  }
  const grand = [...totals.values()].reduce((a, b) => a + b, 0) || 1;

  const rows = meeting.participants
    .map((p) => {
      const seconds = totals.get(p.id) ?? 0;
      return { speaker: p, seconds, pct: Math.round((seconds / grand) * 100) };
    })
    .sort((a, b) => b.seconds - a.seconds);

  const segmentCount = meeting.transcript.length;
  const wordCount = meeting.transcript.reduce(
    (sum, s) => sum + s.text.split(/\s+/).length,
    0
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat label="Talk time" value={formatDuration(grand)} />
        <MiniStat label="Speakers" value={String(meeting.participants.length)} />
        <MiniStat label="Exchanges" value={String(segmentCount)} />
        <MiniStat label="Words" value={wordCount.toLocaleString()} />
      </div>

      <Card className="gap-0 p-5">
        <SectionHeader
          icon={BarChart3}
          title="Speaking time distribution"
          tone="brand"
        />
        <div className="mt-4 space-y-4">
          {rows.map(({ speaker, seconds, pct }) => (
            <div key={speaker.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span
                  className="font-medium"
                  style={{ color: `var(--chart-${speaker.colorIndex})` }}
                >
                  {displayName(speaker.id)}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {formatDuration(seconds)} · {pct}%
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: `var(--chart-${speaker.colorIndex})`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Balance insight */}
        <div className="mt-5 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          {rows[0] && rows[0].pct > 55 ? (
            <>
              <span className="font-medium text-foreground">
                {displayName(rows[0].speaker.id)}
              </span>{" "}
              led most of the conversation ({rows[0].pct}%). Consider whether
              quieter voices had room to contribute.
            </>
          ) : (
            <>Conversation was well balanced across participants.</>
          )}
        </div>
      </Card>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="gap-0 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-heading text-xl font-semibold tabular-nums">
        {value}
      </p>
    </Card>
  );
}
