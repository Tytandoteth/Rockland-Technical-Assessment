// app/api/pipeline/route.ts — Server-side pipeline API
// Provides GET/POST/PATCH/DELETE for pipeline items backed by Neon Postgres
import { NextRequest, NextResponse } from "next/server";
import {
  getPipelineFromDb,
  savePipelineItemToDb,
  updatePipelineItemInDb,
  removePipelineItemFromDb,
} from "@/lib/pipeline-db";

// GET — fetch all pipeline items
export async function GET() {
  try {
    const items = await getPipelineFromDb();
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Failed to fetch pipeline:", error);
    return NextResponse.json({ items: [], error: "Database unavailable" });
  }
}

// POST — save a new pipeline item
export async function POST(request: NextRequest) {
  try {
    const item = await request.json();
    await savePipelineItemToDb(item);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save pipeline item:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

// PATCH — update status/note on a pipeline item
export async function PATCH(request: NextRequest) {
  try {
    const { grantId, ...updates } = await request.json();
    if (!grantId) {
      return NextResponse.json({ error: "Missing grantId" }, { status: 400 });
    }
    await updatePipelineItemInDb(grantId, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update pipeline item:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// DELETE — remove a pipeline item
export async function DELETE(request: NextRequest) {
  try {
    const { grantId } = await request.json();
    if (!grantId) {
      return NextResponse.json({ error: "Missing grantId" }, { status: 400 });
    }
    await removePipelineItemFromDb(grantId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove pipeline item:", error);
    return NextResponse.json({ error: "Failed to remove" }, { status: 500 });
  }
}
