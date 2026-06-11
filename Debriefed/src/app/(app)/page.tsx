import Link from "next/link";
import {
  Plus,
  CalendarClock,
  Clock,
  ListChecks,
  Gauge,
  ArrowRight,
  Loader2,
} from "lucide-react";

import { MEETINGS } from "@/lib/mock-data";
import { archiveOverview, actionItemStats } from "@/lib/analytics";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { MeetingCard } from "@/components/meeting-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ActionItemRow } from "@/components/action-item-row";

export default function DashboardPage() {
  const overview = archiveOverview();
  const aiStats = actionItemStats();

  const recent = MEETINGS.filter((m) => m.status === "ready").slice(0, 4);
  const processing = MEETINGS.filter((m) => m.status === "processing");

  // Pull the open, high/medium action items across the archive for a snapshot.
  const openItems = MEETINGS.flatMap((m) =>
    m.actionItems
      .filter((a) => a.status === "open")
      .map((a) => ({ item: a, meeting: m }))
  ).slice(0, 5);

  const hoursCaptured = (overview.totalDurationSec / 3600).toFixed(1);
  const werPct =
    overview.avgWer != null ? (overview.avgWer * 100).toFixed(1) : "—";

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        title="Welcome back, John"
        description="Here's what your team has been talking about."
      >
        <Button asChild>
          <Link href="/upload">
            <Plus className="size-4" />
            New meeting
          </Link>
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Meetings"
          value={overview.totalMeetings}
          sublabel={`${overview.readyMeetings} processed`}
          icon={CalendarClock}
          accent="brand"
        />
        <StatCard
          label="Hours captured"
          value={hoursCaptured}
          sublabel="Across the archive"
          icon={Clock}
          accent="muted"
        />
        <StatCard
          label="Open action items"
          value={aiStats.open}
          sublabel={`${aiStats.completionRate}% completion rate`}
          icon={ListChecks}
          accent="warning"
        />
        <StatCard
          label="Transcription accuracy"
          value={werPct === "—" ? "—" : `${(100 - Number(werPct)).toFixed(1)}%`}
          sublabel={`${werPct}% word error rate`}
          icon={Gauge}
          accent="success"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent meetings */}
        <div className="space-y-4 lg:col-span-2">
          {processing.length > 0 && (
            <Card className="gap-0 border-brand/30 bg-brand/[0.03] p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <Loader2 className="size-4 animate-spin" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    Processing {processing.length} meeting
                    {processing.length > 1 ? "s" : ""}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {processing.map((m) => m.title).join(", ")} — transcribing &
                    summarising
                  </p>
                </div>
                <span className="hidden text-xs font-medium tabular-nums text-brand sm:block">
                  ~1 min left
                </span>
              </div>
              <Progress value={64} className="mt-3 h-1.5" />
            </Card>
          )}

          <div className="flex items-center justify-between">
            <h2 className="font-heading text-base font-semibold">
              Recent meetings
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/meetings">
                View all
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {recent.map((m) => (
              <MeetingCard key={m.id} meeting={m} />
            ))}
          </div>
        </div>

        {/* Action items snapshot */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-base font-semibold">
              Action items
            </h2>
            <span className="text-xs text-muted-foreground tabular-nums">
              {aiStats.completed}/{aiStats.total} done
            </span>
          </div>

          <Card className="gap-0 p-2">
            <div className="px-3 pb-2 pt-3">
              <Progress value={aiStats.completionRate} className="h-2" />
              <p className="mt-2 text-xs text-muted-foreground">
                {aiStats.completionRate}% of commitments completed
              </p>
            </div>
            <div className="flex flex-col">
              {openItems.map(({ item, meeting }) => (
                <ActionItemRow
                  key={item.id}
                  item={item}
                  href={`/meetings/${meeting.id}?tab=actions`}
                  context={meeting.title}
                />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
