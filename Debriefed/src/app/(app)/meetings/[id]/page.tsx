import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, Gauge, Loader2 } from "lucide-react";

import { getMeeting, MEETINGS } from "@/lib/mock-data";
import { formatDateTime, formatDuration } from "@/lib/format";
import { MeetingStatusBadge } from "@/components/meeting-status-badge";
import { ParticipantAvatars } from "@/components/participant-avatars";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MeetingDetail } from "@/components/meeting-detail";

export function generateStaticParams() {
  return MEETINGS.map((m) => ({ id: m.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const meeting = getMeeting(id);
  return { title: meeting?.title ?? "Meeting" };
}

export default async function MeetingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const meeting = getMeeting(id);
  if (!meeting) notFound();

  const isProcessing = meeting.status === "processing";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/meetings"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All meetings
      </Link>

      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance">
                {meeting.title}
              </h1>
              <MeetingStatusBadge status={meeting.status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4" />
                {formatDateTime(meeting.date)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" />
                {formatDuration(meeting.durationSec)}
              </span>
              {meeting.wer != null && (
                <span className="inline-flex items-center gap-1.5">
                  <Gauge className="size-4" />
                  {(100 - meeting.wer * 100).toFixed(1)}% accuracy
                </span>
              )}
            </div>
          </div>
          {meeting.participants.length > 0 && (
            <ParticipantAvatars participants={meeting.participants} max={6} />
          )}
        </div>

        {meeting.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {meeting.tags.map((t) => (
              <Badge key={t} variant="outline" className="capitalize">
                {t}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {isProcessing ? (
        <Card className="gap-0 p-10">
          <div className="flex flex-col items-center text-center">
            <span className="flex size-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Loader2 className="size-6 animate-spin" />
            </span>
            <p className="mt-4 font-heading text-lg font-semibold">
              Still processing
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              We&apos;re transcribing, diarising and summarising this recording.
              The full transcript and summary will appear here automatically.
            </p>
          </div>
        </Card>
      ) : (
        <MeetingDetail meeting={meeting} initialTab={tab} />
      )}
    </div>
  );
}
