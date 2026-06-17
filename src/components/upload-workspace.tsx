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
  AlertCircle,
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

type Phase = "idle" | "processing" | "done" | "error";

export function UploadWorkspace() {
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [file, setFile] = React.useState<File | null>(null);
  const [activeStage, setActiveStage] = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  const [sourceLabel, setSourceLabel] = React.useState("");
  const [meetingId, setMeetingId] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState("");
  const stageTimer = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimer = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = React.useCallback(() => {
    if (stageTimer.current) clearInterval(stageTimer.current);
    if (pollTimer.current) clearInterval(pollTimer.current);
    stageTimer.current = null;
    pollTimer.current = null;
  }, []);

  React.useEffect(() => () => clearTimers(), [clearTimers]);

  const startProcessing = React.useCallback(
    async (audio: Blob, label: string, source: "upload" | "live") => {
      clearTimers();
      setSourceLabel(label);
      setPhase("processing");
      setActiveStage(0);
      setProgress(5);
      setMeetingId(null);
      setErrorMsg("");

      // Visually advance through the pipeline stages while we wait, capping
      // short of the final step until the backend confirms completion.
      stageTimer.current = setInterval(() => {
        setActiveStage((s) => Math.min(s + 1, STAGES.length - 2));
        setProgress((p) => Math.min(p + 12, 90));
      }, 2500);

      try {
        const form = new FormData();
        const filename = source === "live" ? "live-capture.webm" : label;
        form.append("audio", audio, filename);
        form.append("source", source);
        form.append("title", source === "live" ? "" : label.replace(/\.[^.]+$/, ""));

        const res = await fetch("/api/meetings", {
          method: "POST",
          body: form,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed.");

        const id: string = data.id;
        setMeetingId(id);

        // Poll until the meeting is ready (or failed).
        pollTimer.current = setInterval(async () => {
          try {
            const r = await fetch(`/api/meetings/${id}`, { cache: "no-store" });
            if (!r.ok) return;
            const { meeting } = await r.json();
            if (meeting?.status === "ready") {
              clearTimers();
              setActiveStage(STAGES.length - 1);
              setProgress(100);
              setPhase("done");
              toast.success("Meeting processed", {
                description: "Transcript, summary, and action items are ready.",
              });
            } else if (meeting?.status === "failed") {
              clearTimers();
              setErrorMsg(meeting.gist || "Processing failed.");
              setPhase("error");
              toast.error("Processing failed");
            }
          } catch {
            /* transient network error — keep polling */
          }
        }, 3000);
      } catch (err) {
        clearTimers();
        setErrorMsg(err instanceof Error ? err.message : "Upload failed.");
        setPhase("error");
        toast.error("Upload failed");
      }
    },
    [clearTimers]
  );

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
    setMeetingId(null);
    setErrorMsg("");
  };

  if (phase !== "idle") {
    return (
      <ProcessingView
        phase={phase}
        sourceLabel={sourceLabel}
        activeStage={activeStage}
        progress={progress}
        meetingId={meetingId}
        errorMsg={errorMsg}
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
                onClick={() => file && startProcessing(file, file.name, "upload")}
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

/** Pick an audio mime type the browser can record. */
function pickRecorderMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t));
}

function LiveCapture({
  onStart,
  className,
}: {
  onStart: (audio: Blob, label: string, source: "live") => void;
  className?: string;
}) {
  const [recording, setRecording] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const [url, setUrl] = React.useState("");
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);

  React.useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [recording]);

  const startRecording = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      toast.error("Microphone capture isn't supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickRecorderMime();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        if (blob.size > 0) onStart(blob, "Live capture", "live");
        else toast.error("No audio was captured. Try again.");
      };
      recorder.start();
      recorderRef.current = recorder;
      setElapsed(0);
      setRecording(true);
    } catch {
      toast.error("Microphone permission was denied.");
    }
  };

  const stopRecording = () => {
    setRecording(false);
    recorderRef.current?.stop();
    recorderRef.current = null;
  };

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
              onClick={stopRecording}
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
              <Button onClick={startRecording} className="shrink-0">
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
  meetingId,
  errorMsg,
  onReset,
}: {
  phase: Phase;
  sourceLabel: string;
  activeStage: number;
  progress: number;
  meetingId: string | null;
  errorMsg: string;
  onReset: () => void;
}) {
  const done = phase === "done";
  const failed = phase === "error";

  if (failed) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="gap-0 p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <span className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <AlertCircle className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-lg font-semibold">
                Couldn&apos;t process this recording
              </h2>
              <p className="truncate text-sm text-muted-foreground">
                {sourceLabel}
              </p>
            </div>
          </div>
          <p className="mt-5 rounded-lg bg-destructive/[0.05] p-3 text-sm text-destructive">
            {errorMsg}
          </p>
          <Button variant="outline" onClick={onReset} className="mt-6 w-full">
            Try again
          </Button>
        </Card>
      </div>
    );
  }

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
            <Button asChild className="flex-1" disabled={!meetingId}>
              <Link href={meetingId ? `/meetings/${meetingId}` : "/meetings"}>
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
