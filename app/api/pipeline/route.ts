import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isDatabaseConfigured } from "@/lib/db";
import {
  getPipelineForUser,
  upsertPipelineItem,
  updatePipelineItemForUser,
  removePipelineItemForUser,
} from "@/lib/pipeline-db";
import type { PipelineItem } from "@/lib/types";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ items: [], source: "localStorage" as const });
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ items: [], source: "localStorage" as const });
    }

    const items = await getPipelineForUser(userId);
    return NextResponse.json({ items, source: "database" as const });
  } catch (error) {
    console.error("Failed to fetch pipeline:", error);
    return NextResponse.json({
      items: [],
      source: "localStorage" as const,
      error: "Database unavailable",
    });
  }
}

export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: true, source: "localStorage" as const });
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: true, source: "localStorage" as const });
    }

    const item = (await request.json()) as PipelineItem;
    if (!item?.grantId || !item?.grantTitle || !item?.status) {
      return NextResponse.json({ error: "Invalid pipeline item" }, { status: 400 });
    }

    await upsertPipelineItem(userId, item);
    return NextResponse.json({ success: true, source: "database" as const });
  } catch (error) {
    console.error("Failed to save pipeline item:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: true, source: "localStorage" as const });
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: true, source: "localStorage" as const });
    }

    const body = (await request.json()) as {
      grantId?: string;
      status?: PipelineItem["status"];
      nextStep?: string;
      note?: string;
    };
    if (!body.grantId) {
      return NextResponse.json({ error: "Missing grantId" }, { status: 400 });
    }

    await updatePipelineItemForUser(userId, body.grantId, {
      status: body.status,
      nextStep: body.nextStep,
      note: body.note,
    });
    return NextResponse.json({ success: true, source: "database" as const });
  } catch (error) {
    console.error("Failed to update pipeline item:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: true, source: "localStorage" as const });
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: true, source: "localStorage" as const });
    }

    const body = (await request.json()) as { grantId?: string };
    if (!body.grantId) {
      return NextResponse.json({ error: "Missing grantId" }, { status: 400 });
    }

    await removePipelineItemForUser(userId, body.grantId);
    return NextResponse.json({ success: true, source: "database" as const });
  } catch (error) {
    console.error("Failed to remove pipeline item:", error);
    return NextResponse.json({ error: "Failed to remove" }, { status: 500 });
  }
}
