import type { Metadata } from "next";
  git log --oneline --all --graph --decorate -10



import { listMeetings } from "@/lib/server/store";
import {
  actionItemStats,
  archiveOverview,
  meetingFrequency,
  recurringTopics,
  speakingTimeByPerson,
} from "@/lib/analytics";
import { PageHeader } from "@/components/page-header";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";

export const metadata: Metadata = {
  title: "Analytics",
};

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const meetings = await listMeetings();
  const ready = meetings.filter((m) => m.status === "ready");

  const data = {
    overview: archiveOverview(meetings),
    speaking: speakingTimeByPerson(ready),
    aiStats: actionItemStats(meetings),
    frequency: meetingFrequency(meetings),
    topics: recurringTopics(meetings),
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        title="Analytics"
        description="Trends across your meetings — participation, follow-through, and recurring themes."
      />
      <AnalyticsDashboard data={data} />
    </div>
  );
}
