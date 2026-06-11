"use client";

import * as React from "react";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import {
  UploadCloud,
  FileAudio,
  X,
  Radio,
  Mic,
  CheckCircle2,
  Loader2,
  Sparkles,
  ArrowRight,
  AudioLines,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Stage = {
  key: string;
  label: string;
  detail: string;
};

const STAGES: Stage[] = [
  { key: "upload", label: "Uploading audio", detail: "Securely transferring your recording" },
  { key: "transcribe", label: "Transcribing speech", detail: "Whisper large-v3 · handling technical vocabulary" },
  { key: "diarise", label: "Identifying speakers", detail: "Separating and labelling each voice" },
  { key: "actions", label: "Extracting action items", detail: "Finding commitments, owners & deadlines" },
  { key: "summary", label: "Generating summary", detail: "Decisions, discussion points & next steps" },
  { key: "index", label: "Indexing for search", detail: "Embedding into the searchable archive" },
];

const SUPPORTED = "MP3, WAV, M4A, FLAC, MP4 · up to 2 hours";

type Phase = "idle" | "processing" | "done";

export function UploadWorkspace() {
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [file, setFile] = React.useState<File | null>(null);
  const [activeStage, setActiveStage] = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  const [sourceLabel, setSourceLabel] = React.useState("");
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  React.useEffect(() => () => clearTimers(), []);

  const startProcessing = (label: string) => {
    setSourceLabel(label);
    setPhase("processing");
    setActiveStage(0);
    setProgress(0);

    const perStage = 950; // ms per pipeline stage (demo pacing)
    STAGES.forEach((_, i) => {
      timers.current.push(
        setTimeout(() => {
          setActiveStage(i);
          setProgress(Math.round(((i + 1) / STAGES.length) * 100));
        }, i * perStage)
      );
    });
    timers.current.push(
      setTimeout(() => {
        setPhase("done");
        toast.success("Meeting processed", {
          description: "Transcript, summary, and action items are ready.",
        });
      }, STAGES.length * perStage)
    );
  };

  const onDrop = React.useCallback((accepted: File[]) => {
    if (accepted.length === 0) return;
    setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple: false,
    noClick: true,
    accept: {
      "audio/*": [".mp3", ".wav", ".m4a", ".flac", ".aac", ".ogg"],
      "video/mp4": [".mp4"],
    },
  });

  const reset = () => {
    clearTimers();
    setPhase("idle");
    setFile(null);
    setActiveStage(0);
    setProgress(0);
    setSourceLabel("");
  };

  if (phase !== "idle") {
    return (
      <ProcessingView
        phase={phase}
        sourceLabel={sourceLabel}
        activeStage={activeStage}
        progress={progress}
        onReset={reset}
      />
    );
  }

  return (
    <Tabs defaultValue="upload" className="gap-6">
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="upload" className="gap-2">
          <UploadCloud className="size-4" />
          Upload recording
        </TabsTrigger>
        <TabsTrigger value="live" className="gap-2">
          <Radio className="size-4" />
          Join live
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upload">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="gap-0 p-2 lg:col-span-2">
            <div
              {...getRootProps()}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-16 text-center transition-colors",
                isDragActive
                  ? "border-brand bg-brand/5"
                  : "border-border bg-muted/30"
              )}
            >
              <input {...getInputProps()} />
              <div
                className={cn(
                  "flex size-14 items-center justify-center rounded-2xl transition-colors",
                  isDragActive
                    ? "bg-brand text-brand-foreground"
                    : "bg-brand/10 text-brand"
                )}
              >
                <UploadCloud className="size-7" />
              </div>
              <p className="mt-4 text-base font-medium">
                {isDragActive
                  ? "Drop to upload"
                  : "Drag & drop your meeting audio"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                or click to browse — {SUPPORTED}
              </p>
              <Button onClick={open} className="mt-5" type="button">
                <FileAudio className="size-4" />
                Choose file
              </Button>

              {file && (
                <div className="mt-6 flex w-full max-w-md items-center gap-3 rounded-lg border border-border bg-card p-3 text-left">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <AudioLines className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / (1024 * 1024)).toFixed(1)} MB · ready to
                      process
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    aria-label="Remove file"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 px-3 py-3">
              <p className="text-xs text-muted-foreground">
                Your audio is processed privately and never used for training.
              </p>
              <Button
                disabled={!file}
                onClick={() => file && startProcessing(file.name)}
              >
                <Sparkles className="size-4" />
                Process meeting
              </Button>
            </div>
          </Card>

          <WhatYouGetCard />
        </div>
      </TabsContent>

      <TabsContent value="live">
        <div className="grid gap-6 lg:grid-cols-3">
          <LiveCapture onStart={startProcessing} className="lg:col-span-2" />
          <WhatYouGetCard />
        </div>
      </TabsContent>
    </Tabs>
  );
}

function WhatYouGetCard() {
  const items = [
    "Speaker-labelled transcript with timestamps",
    "Structured summary — decisions, discussion, next steps",
    "Action item checklist with owners & deadlines",
    "Searchable across your entire meeting archive",
  ];
  return (
    <Card className="gap-0 p-5">
      <p className="font-heading text-sm font-semibold">
        What you&apos;ll get back
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Usually ready in under 2 minutes.
      </p>
      <ul className="mt-4 space-y-3">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2.5 text-sm">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
            <span className="text-muted-foreground">{it}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function LiveCapture({
  onStart,
  className,
}: {
  onStart: (label: string) => void;
  className?: string;
}) {
  const [recording, setRecording] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const [url, setUrl] = React.useState("");

  React.useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [recording]);

  return (
    <Card className={cn("gap-0 p-6", className)}>
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="relative flex size-20 items-center justify-center">
          {recording && (
            <span className="absolute inset-0 animate-ping rounded-full bg-destructive/20" />
          )}
          <span
            className={cn(
              "flex size-20 items-center justify-center rounded-full transition-colors",
              recording
                ? "bg-destructive/10 text-destructive"
                : "bg-brand/10 text-brand"
            )}
          >
            <Mic className="size-8" />
          </span>
        </div>

        {recording ? (
          <>
            <div className="mt-5 flex items-end gap-1" aria-hidden>
              {[10, 18, 28, 16, 22, 12, 26, 14].map((h, i) => (
                <span
                  key={i}
                  className="w-1 origin-bottom rounded-full bg-brand/70"
                  style={{
                    height: h,
                    animation: `equalize 1s ease-in-out ${i * 0.12}s infinite`,
                  }}
                />
              ))}
            </div>
            <p className="mt-4 font-heading text-2xl font-semibold tabular-nums">
              {formatDuration(elapsed)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Recording live · capturing audio
            </p>
            <Button
              variant="destructive"
              className="mt-5"
              onClick={() => onStart("Live capture")}
            >
              Stop & process
            </Button>
          </>
        ) : (
          <>
            <p className="mt-5 text-base font-medium">Capture a live meeting</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Paste a meeting link to have Debriefed join, or start capturing audio
              from this device.
            </p>
            <div className="mt-5 flex w-full max-w-md flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Paste meeting URL (optional)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <Button onClick={() => setRecording(true)} className="shrink-0">
                <Radio className="size-4" />
                Start capture
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

function ProcessingView({
  phase,
  sourceLabel,
  activeStage,
  progress,
  onReset,
}: {
  phase: Phase;
  sourceLabel: string;
  activeStage: number;
  progress: number;
  onReset: () => void;
}) {
  const done = phase === "done";

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="gap-0 p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <span
            className={cn(
              "flex size-12 items-center justify-center rounded-xl",
              done ? "bg-success/10 text-success" : "bg-brand/10 text-brand"
            )}
          >
            {done ? (
              <CheckCircle2 className="size-6" />
            ) : (
              <Loader2 className="size-6 animate-spin" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-lg font-semibold">
              {done ? "All done" : "Processing your meeting"}
            </h2>
            <p className="truncate text-sm text-muted-foreground">
              {sourceLabel}
            </p>
          </div>
          <span className="font-heading text-lg font-semibold tabular-nums text-muted-foreground">
            {progress}%
          </span>
        </div>

        <Progress value={progress} className="mt-5 h-2" />

        <ul className="mt-6 space-y-1">
          {STAGES.map((stage, i) => {
            const state =
              done || i < activeStage
                ? "complete"
                : i === activeStage
                  ? "active"
                  : "pending";
            return (
              <li
                key={stage.key}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                  state === "active" && "bg-brand/5"
                )}
              >
                <span className="flex size-6 shrink-0 items-center justify-center">
                  {state === "complete" ? (
                    <CheckCircle2 className="size-5 text-success" />
                  ) : state === "active" ? (
                    <Loader2 className="size-5 animate-spin text-brand" />
                  ) : (
                    <span className="size-2 rounded-full bg-muted-foreground/30" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      state === "pending" && "text-muted-foreground"
                    )}
                  >
                    {stage.label}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {stage.detail}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        {done && (
          <div className="mt-6 flex flex-col gap-2 border-t border-border pt-6 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href="/meetings/mtg_roadmap_q3">
                View meeting
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button variant="outline" onClick={onReset} className="flex-1">
              Process another
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
