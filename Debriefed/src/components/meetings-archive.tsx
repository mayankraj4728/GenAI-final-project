"use client";

import * as React from "react";
import { Search, SlidersHorizontal, Inbox } from "lucide-react";

import type { Meeting } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MeetingCard } from "@/components/meeting-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortKey = "newest" | "oldest" | "longest" | "actions";

export function MeetingsArchive({ meetings }: { meetings: Meeting[] }) {
  const [query, setQuery] = React.useState("");
  const [topic, setTopic] = React.useState("all");
  const [sort, setSort] = React.useState<SortKey>("newest");

  const topics = React.useMemo(() => {
    const set = new Set<string>();
    meetings.forEach((m) => m.tags.forEach((t) => set.add(t)));
    return [...set].sort();
  }, [meetings]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = meetings.filter((m) => {
      const matchesTopic = topic === "all" || m.tags.includes(topic);
      if (!matchesTopic) return false;
      if (!q) return true;
      const haystack = [
        m.title,
        m.gist,
        ...m.tags,
        ...m.participants.map((p) => p.name ?? p.label),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });

    result = [...result].sort((a, b) => {
      switch (sort) {
        case "oldest":
          return +new Date(a.date) - +new Date(b.date);
        case "longest":
          return b.durationSec - a.durationSec;
        case "actions":
          return b.actionItems.length - a.actionItems.length;
        case "newest":
        default:
          return +new Date(b.date) - +new Date(a.date);
      }
    });
    return result;
  }, [meetings, query, topic, sort]);

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by title, topic, or participant…"
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={topic} onValueChange={setTopic}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All topics</SelectItem>
              {topics.map((t) => (
                <SelectItem key={t} value={t} className="capitalize">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="w-[150px]">
              <SlidersHorizontal className="size-4 text-muted-foreground" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="longest">Longest</SelectItem>
              <SelectItem value="actions">Most action items</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active filter summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length} meeting{filtered.length === 1 ? "" : "s"}
          {topic !== "all" && (
            <>
              {" "}
              in{" "}
              <Badge variant="secondary" className="capitalize">
                {topic}
              </Badge>
            </>
          )}
        </p>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((m) => (
            <MeetingCard key={m.id} meeting={m} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Inbox className="size-6" />
          </span>
          <p className="mt-4 text-sm font-medium">No meetings found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try a different search or topic filter.
          </p>
        </div>
      )}
    </div>
  );
}
