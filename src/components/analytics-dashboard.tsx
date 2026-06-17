"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import {
  CalendarClock,
  Clock,
  ListChecks,
  Users,
  TrendingUp,
} from "lucide-react";

import type {
  ArchiveOverview,
  SpeakingTimeRow,
  ActionItemStats,
  TopicRow,
} from "@/lib/analytics";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { useMounted } from "@/hooks/use-mounted";

const axisTick = { fill: "var(--muted-foreground)", fontSize: 12 };

function ChartTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: { value: number; payload: Record<string, unknown> }[];
  label?: string;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-muted-foreground">
        {payload[0].value}
        {unit ? ` ${unit}` : ""}
      </p>
    </div>
  );
}

export interface AnalyticsData {
  overview: ArchiveOverview;
  speaking: SpeakingTimeRow[];
  aiStats: ActionItemStats;
  frequency: { weekStart: string; label: string; count: number }[];
  topics: TopicRow[];
}

export function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
  const mounted = useMounted();
  const { overview, speaking, aiStats, frequency, topics } = data;

  const speakingData = speaking.map((s) => ({
    name: s.name.split(" ")[0],
    fullName: s.name,
    minutes: Math.round(s.seconds / 60),
    colorIndex: s.colorIndex,
  }));

  const maxTopic = Math.max(...topics.map((t) => t.count), 1);

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Meetings"
          value={overview.totalMeetings}
          sublabel="In the archive"
          icon={CalendarClock}
          accent="brand"
        />
        <StatCard
          label="Hours captured"
          value={(overview.totalDurationSec / 3600).toFixed(1)}
          sublabel="Total recorded time"
          icon={Clock}
          accent="muted"
        />
        <StatCard
          label="Completion rate"
          value={`${aiStats.completionRate}%`}
          sublabel={`${aiStats.completed}/${aiStats.total} action items`}
          icon={ListChecks}
          accent="success"
        />
        <StatCard
          label="Participants"
          value={overview.uniqueParticipants}
          sublabel="Unique voices"
          icon={Users}
          accent="warning"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Meeting frequency */}
        <Card className="gap-0 p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-sm font-semibold">
                Meeting frequency
              </h3>
              <p className="text-xs text-muted-foreground">
                Recorded meetings per week
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-success">
              <TrendingUp className="size-3.5" />
              Active
            </span>
          </div>
          <div className="mt-4 h-56">
            {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={frequency}
                margin={{ top: 8, right: 0, bottom: 0, left: -20 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="label"
                  tick={axisTick}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={axisTick}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                  content={<ChartTooltip unit="meetings" />}
                />
                <Bar
                  dataKey="count"
                  fill="var(--chart-1)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={44}
                />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Completion gauge */}
        <Card className="gap-0 p-5">
          <h3 className="font-heading text-sm font-semibold">
            Action item completion
          </h3>
          <p className="text-xs text-muted-foreground">
            Across all meetings
          </p>
          <div className="relative mx-auto mt-2 h-48 w-48">
            {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                data={[{ name: "done", value: aiStats.completionRate }]}
                startAngle={90}
                endAngle={-270}
                innerRadius="74%"
                outerRadius="100%"
              >
                <PolarAngleAxis
                  type="number"
                  domain={[0, 100]}
                  angleAxisId={0}
                  tick={false}
                />
                <RadialBar
                  background={{ fill: "var(--muted)" }}
                  dataKey="value"
                  cornerRadius={20}
                  fill="var(--chart-1)"
                />
              </RadialBarChart>
            </ResponsiveContainer>
            )}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-heading text-3xl font-semibold tabular-nums">
                {aiStats.completionRate}%
              </span>
              <span className="text-xs text-muted-foreground">complete</span>
            </div>
          </div>
          <div className="mt-2 flex justify-center gap-5 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-chart-1" />
              {aiStats.completed} done
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-muted-foreground/40" />
              {aiStats.open} open
            </span>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Speaking time */}
        <Card className="gap-0 p-5">
          <h3 className="font-heading text-sm font-semibold">
            Speaking time by participant
          </h3>
          <p className="text-xs text-muted-foreground">
            Total minutes spoken across the archive
          </p>
          <div className="mt-4 h-72">
            {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={speakingData}
                margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
              >
                <CartesianGrid
                  horizontal={false}
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  type="number"
                  tick={axisTick}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={axisTick}
                  tickLine={false}
                  axisLine={false}
                  width={64}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                  content={<ChartTooltip unit="min" />}
                />
                <Bar dataKey="minutes" radius={[0, 6, 6, 0]} maxBarSize={28}>
                  {speakingData.map((d) => (
                    <Cell
                      key={d.fullName}
                      fill={`var(--chart-${d.colorIndex})`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Recurring topics */}
        <Card className="gap-0 p-5">
          <h3 className="font-heading text-sm font-semibold">
            Recurring topics
          </h3>
          <p className="text-xs text-muted-foreground">
            What your team keeps coming back to
          </p>
          <div className="mt-4 space-y-3">
            {topics.map((t, i) => (
              <div key={t.topic} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium capitalize">{t.topic}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {t.count} meeting{t.count === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(t.count / maxTopic) * 100}%`,
                      backgroundColor: `var(--chart-${(i % 5) + 1})`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
