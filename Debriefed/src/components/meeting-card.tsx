import Link from "next/link";
import { Clock, CheckSquare, CalendarDays } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Meeting } from "@/lib/types";
import { formatDuration, formatRelativeDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MeetingStatusBadge } from "@/components/meeting-status-badge";
import { ParticipantAvatars } from "@/components/participant-avatars";

export function MeetingCard({
  meeting,
  className,
}: {
  meeting: Meeting;
  className?: string;
}) {
  const openItems = meeting.actionItems.filter(
    (a) => a.status === "open"
  ).length;
  const isProcessing = meeting.status === "processing";

  const body = (
    <Card
      className={cn(
        "group h-full gap-0 p-5 transition-all",
        !isProcessing &&
          "hover:-translate-y-0.5 hover:shadow-md hover:ring-brand/30",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3
          className={cn(
            "font-heading text-[15px] font-semibold leading-snug tracking-tight",
            !isProcessing && "transition-colors group-hover:text-brand"
          )}
        >
          {meeting.title}
        </h3>
        <MeetingStatusBadge status={meeting.status} className="shrink-0" />
      </div>

      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {meeting.gist}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-3.5" />
          {formatRelativeDate(meeting.date)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5" />
          {formatDuration(meeting.durationSec)}
        </span>
        {!isProcessing && (
          <span className="inline-flex items-center gap-1.5">
            <CheckSquare className="size-3.5" />
            {openItems} open
          </span>
        )}
      </div>

      {meeting.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {meeting.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="capitalize">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between pt-4">
        {meeting.participants.length > 0 ? (
          <ParticipantAvatars participants={meeting.participants} />
        ) : (
          <span className="text-xs text-muted-foreground">
            Awaiting diarisation
          </span>
        )}
      </div>
    </Card>
  );

  if (isProcessing) {
    return <div className="cursor-default">{body}</div>;
  }

  return (
    <Link href={`/meetings/${meeting.id}`} className="block">
      {body}
    </Link>
  );
}
