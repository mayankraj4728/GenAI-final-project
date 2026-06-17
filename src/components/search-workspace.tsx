"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  Sparkles,
  CornerDownLeft,
  ArrowUpRight,
  Loader2,
} from "lucide-react";

import type { SearchHit } from "@/lib/types";
import { formatRelativeDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

function HitSnippet({ text, query }: { text: string; query: string }) {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);
  if (terms.length === 0) return <>{text}</>;

  const pattern = new RegExp(
    `(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi"
  );
  const termSet = new Set(terms);
  const parts = text.split(pattern);
  return (
    <>
      {parts.map((part, i) =>
        termSet.has(part.toLowerCase()) ? (
          <mark
            key={i}
            className="rounded bg-brand/15 px-0.5 font-medium text-brand"
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

const SAMPLE_QUERIES = [
  "What did we decide about the vector store migration?",
  "Who owns the onboarding wizard redesign?",
  "When are we launching semantic search?",
  "What are the open questions about re-embedding the archive?",
  "Why is time-to-first-value so high?",
];

export function SearchWorkspace() {
  const [query, setQuery] = React.useState("");
  const [submitted, setSubmitted] = React.useState("");
  const [results, setResults] = React.useState<SearchHit[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const reqId = React.useRef(0);

  const run = React.useCallback(async (q: string) => {
    const trimmed = q.trim();
    setQuery(q);
    setSubmitted(trimmed);
    if (!trimmed) {
      setResults([]);
      return;
    }
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (id !== reqId.current) return; // a newer search superseded this one
      if (!res.ok) {
        setError(data.error ?? "Search failed.");
        setResults([]);
      } else {
        setResults(data.results ?? []);
      }
    } catch {
      if (id === reqId.current) setError("Could not reach the search service.");
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") run(query);
          }}
          placeholder="Ask anything across your meetings…"
          className="h-14 rounded-xl pl-12 pr-28 text-base shadow-sm"
        />
        <kbd className="absolute right-4 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded border border-border bg-muted px-2 py-1 text-xs text-muted-foreground sm:inline-flex">
          <CornerDownLeft className="size-3" /> Enter
        </kbd>
      </div>

      {!submitted ? (
        <div className="space-y-4">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="size-4 text-brand" />
            Try a natural-language question
          </p>
          <div className="flex flex-col gap-2">
            {SAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => run(q)}
                className="group flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left text-sm transition-colors hover:border-brand/40 hover:bg-accent/40"
              >
                <span>{q}</span>
                <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-brand" />
              </button>
            ))}
          </div>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-brand" />
          Searching the archive…
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/[0.03] px-4 py-6 text-center text-sm text-destructive">
          {error}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {results.length > 0 ? (
              <>
                <span className="font-medium text-foreground">
                  {results.length}
                </span>{" "}
                passage{results.length === 1 ? "" : "s"} matched{" "}
                <span className="font-medium text-foreground">
                  “{submitted}”
                </span>
              </>
            ) : (
              <>
                No passages matched “{submitted}”. Try rephrasing or broadening
                your question.
              </>
            )}
          </p>

          <div className="space-y-3">
            {results.map((hit) => (
              <Link
                key={hit.segmentId}
                href={`/meetings/${hit.meetingId}?tab=transcript`}
                className="block"
              >
                <Card className="group gap-0 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-brand/30">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium transition-colors group-hover:text-brand">
                        {hit.meetingTitle}
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">
                        {hit.speakerLabel}
                      </span>
                    </div>
                    <RelevancePill score={hit.score} />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                    <HitSnippet text={hit.snippet} query={submitted} />
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatRelativeDate(hit.date)}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RelevancePill({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
      <span className="hidden sm:inline">match</span>
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 font-medium tabular-nums",
          pct >= 80
            ? "bg-success/10 text-success"
            : pct >= 65
              ? "bg-brand/10 text-brand"
              : "bg-muted text-muted-foreground"
        )}
      >
        {pct}%
      </span>
    </span>
  );
}
