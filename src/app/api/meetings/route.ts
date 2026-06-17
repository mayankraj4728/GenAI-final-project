import { NextResponse } from "next/server";
import { geminiConfigured } from "@/lib/server/gemini";
import {
  createMeeting,
  listMeetings,
  newMeetingId,
} from "@/lib/server/store";
import { makeProcessingMeeting, processRecording } from "@/lib/server/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Allow long-running processing on platforms that honour it.
export const maxDuration = 300;

export async function GET() {
  const meetings = await listMeetings();
  return NextResponse.json({ meetings });
}

export async function POST(request: Request) {
  if (!geminiConfigured()) {
    return NextResponse.json(
      {
        error:
          "GEMINI_API_KEY is not set. Add it to .env.local and restart the server.",
      },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data with an 'audio' file." },
      { status: 400 }
    );
  }

  const file = form.get("audio");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing 'audio' file in the request." },
      { status: 400 }
    );
  }

  const sourceRaw = form.get("source");
  const source = sourceRaw === "live" ? "live" : "upload";
  const titleRaw = form.get("title");
  const title =
    typeof titleRaw === "string" && titleRaw.trim()
      ? titleRaw.trim()
      : deriveTitle(file.name, source);

  const mimeType = file.type || "audio/mpeg";
  const buffer = Buffer.from(await file.arrayBuffer());

  if (buffer.byteLength === 0) {
    return NextResponse.json(
      { error: "The uploaded audio file is empty." },
      { status: 400 }
    );
  }

  const id = newMeetingId();
  const meeting = makeProcessingMeeting(id, title, source);
  await createMeeting(meeting);

  // Process in the background; the client polls GET /api/meetings/[id].
  processRecording(id, buffer, mimeType).catch((err) =>
    console.error(`[api] background processing crashed for ${id}:`, err)
  );

  return NextResponse.json({ id, status: "processing" }, { status: 202 });
}

function deriveTitle(filename: string, source: "upload" | "live"): string {
  if (source === "live") {
    return `Live capture — ${new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })}`;
  }
  const base = filename.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  return base || "Untitled recording";
}
