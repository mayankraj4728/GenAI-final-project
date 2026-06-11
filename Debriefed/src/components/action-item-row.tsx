"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarClock, User } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ActionItem, ActionItemPriority } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";

const PRIORITY_DOT: Record<ActionItemPriority, string> = {
  high: "bg-destructive",
  medium: "bg-warning",
  low: "bg-muted-foreground/40",
};

const PRIORITY_LABEL: Record<ActionItemPriority, string> = {
  high: "High priority",
  medium: "Medium priority",
  low: "Low priority",
};

export function ActionItemRow({
  item,
  context,
  href,
  className,
}: {
  item: ActionItem;
  /** Optional meeting title shown beneath the task (for cross-meeting views) */
  context?: string;
  /** Where the context link points */
  href?: string;
  className?: string;
}) {
  const [done, setDone] = React.useState(item.status === "completed");

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50",
        className
      )}
    >
      <Checkbox
        checked={done}
        onCheckedChange={(v) => setDone(Boolean(v))}
        className="mt-0.5"
        aria-label={done ? "Mark as not done" : "Mark as done"}
      />

      <div className="min-w-0 flex-1 space-y-1">
        <p
          className={cn(
            "text-sm leading-snug transition-colors",
            done && "text-muted-foreground line-through"
          )}
        >
          {item.task}
        </p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span
            className="inline-flex items-center gap-1"
            title={PRIORITY_LABEL[item.priority]}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                PRIORITY_DOT[item.priority]
              )}
            />
            {item.ownerName ? (
              <span className="inline-flex items-center gap-1 font-medium text-foreground/70">
                <User className="size-3" />
                {item.ownerName}
              </span>
            ) : (
              "Unassigned"
            )}
          </span>

          {item.deadline && (
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="size-3" />
              {item.deadline}
            </span>
          )}

          {context &&
            (href ? (
              <Link
                href={href}
                className="truncate text-brand hover:underline"
              >
                {context}
              </Link>
            ) : (
              <span className="truncate">{context}</span>
            ))}
        </div>
      </div>
    </div>
  );
}
