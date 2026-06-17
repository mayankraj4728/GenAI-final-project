import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { ActionItemStatus } from "@/lib/types";
import {
  deleteMeeting,
  getMeeting,
  updateMeeting,
} from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const meeting = await getMeeting(id);
  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }
  return NextResponse.json({ meeting });
}

interface PatchBody {
  /** Rename a meeting. */
  title?: string;
  /** Map of speakerId -> new display name. */
  speakerNames?: Record<string, string>;
  /** Toggle an action item's completion state. */
  actionItem?: { id: string; status: ActionItemStatus };
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const meeting = await getMeeting(id);
  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.title === "string" && body.title.trim()) {
    meeting.title = body.title.trim();
  }

  if (body.speakerNames) {
    for (const sp of meeting.participants) {
      const next = body.speakerNames[sp.id];
      if (typeof next === "string" && next.trim()) {
        const name = next.trim();
        // Update the owner name on any action item that referenced this speaker.
        for (const ai of meeting.actionItems) {
          if (ai.ownerId === sp.id) ai.ownerName = name;
        }
        sp.name = name;
        sp.initials = name
          .split(/\s+/)
          .map((p) => p[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();
      }
    }
  }

  if (body.actionItem) {
    const ai = meeting.actionItems.find((a) => a.id === body.actionItem!.id);
    if (ai) ai.status = body.actionItem.status;
  }

  const updated = await updateMeeting(id, {
    title: meeting.title,
    participants: meeting.participants,
    actionItems: meeting.actionItems,
  });

  return NextResponse.json({ meeting: updated });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const ok = await deleteMeeting(id);
  if (!ok) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
