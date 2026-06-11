import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MeetingStatus } from "@/lib/types";

const CONFIG: Record<
  MeetingStatus,
  { label: string; className: string; icon: typeof CheckCircle2; spin?: boolean }
> = {
  ready: {
    label: "Ready",
    icon: CheckCircle2,
    className: "bg-success/10 text-success ring-success/20",
  },
  processing: {
    label: "Processing",
    icon: Loader2,
    className: "bg-brand/10 text-brand ring-brand/20",
    spin: true,
  },
  failed: {
    label: "Failed",
    icon: AlertCircle,
    className: "bg-destructive/10 text-destructive ring-destructive/20",
  },
};

export function MeetingStatusBadge({
  status,
  className,
}: {
  status: MeetingStatus;
  className?: string;
}) {
  const cfg = CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        cfg.className,
        className
      )}
    >
      <Icon className={cn("size-3", cfg.spin && "animate-spin")} />
      {cfg.label}
    </span>
  );
}
