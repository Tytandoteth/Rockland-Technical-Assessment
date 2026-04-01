// app/api/pipeline/route.ts — Server-side pipeline API with Clerk auth
// Each user gets their own pipeline, keyed by Clerk userId
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import { PipelineItem } from "@/lib/types";

function mapRow(row: Record<string, unknown>): PipelineItem {
  return {
    id: row.id as string,
    grantId: row.grant_id as string,
    grantTitle: row.grant_title as string,
    grantDeadline: row.grant_deadline
      ? (row.grant_deadline as Date).toISOString().split("T")[0]
      : undefined,
    grantUrl: (row.grant_url as string) || undefined,
    status: row.status as PipelineItem["status"],
    nextStep: (row.next_step as string) || undefined,
    note: (row.note as string) || undefined,
    savedAt: row.saved_at
      ? (row.saved_at as Date).toISOString()
      : new Date().toISOString(),
  };
}

// GET — fetch pipeline items for the current user
export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ items: [], source: "localStorage" });
  }

  try {
    const { userId } = await auth();
    const sql = getDb();

    // If not signed in, return empty (client falls back to localStorage)
    if (!userId) {
      return NextResponse.json({ items: [], source: "localStorage" });
    }

    const rows = await sql`
      SELECT * FROM pipeline_items
      WHERE user_id = ${userId}
      ORDER BY saved_at DESC
    `;
    return NextResponse.json({ items: rows.map(mapRow), source: "database" });
  } catch (error) {
    console.error("Failed to fetch pipeline:", error);
    return NextResponse.json({ items: [], source: "localStorage", error: "Database unavailable" });
  }
}

// POST — save a new pipeline item
export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: true, source: "localStorage" });
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: true, source: "localStorage" });
    }

    const item: PipelineItem = await request.json();
    const sql = getDb();

    await sql`
      INSERT INTO pipeline_items (id, user_id, grant_id, grant_title, grant_deadline, grant_url, status, next_step, note, saved_at)
      VALUES (${item.id}, ${userId}, ${item.grantId}, ${item.grantTitle}, ${item.grantDeadline || null}, ${item.grantUrl || null}, ${item.status}, ${item.nextStep || null}, ${item.note || null}, ${item.savedAt})
      ON CONFLICT (id) DO NOTHING
    `;
    return NextResponse.json({ success: true, source: "database" });
  } catch (error) {
    console.error("Failed to save pipeline item:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

// PATCH — update status/note
export async function PATCH(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: true, source: "localStorage" });
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: true, source: "localStorage" });
    }

    const { grantId, ...updates } = await request.json();
    if (!grantId) {
      return NextResponse.json({ error: "Missing grantId" }, { status: 400 });
    }

    const sql = getDb();
    await sql`
      UPDATE pipeline_items
      SET status = COALESCE(${updates.status || null}, status),
          next_step = COALESCE(${updates.nextStep || null}, next_step),
          note = COALESCE(${updates.note || null}, note),
          updated_at = NOW()
      WHERE grant_id = ${grantId} AND user_id = ${userId}
    `;
    return NextResponse.json({ success: true, source: "database" });
  } catch (error) {
    console.error("Failed to update pipeline item:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// DELETE — remove a pipeline item
export async function DELETE(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: true, source: "localStorage" });
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: true, source: "localStorage" });
    }

    const { grantId } = await request.json();
    if (!grantId) {
      return NextResponse.json({ error: "Missing grantId" }, { status: 400 });
    }

    const sql = getDb();
    await sql`DELETE FROM pipeline_items WHERE grant_id = ${grantId} AND user_id = ${userId}`;
    return NextResponse.json({ success: true, source: "database" });
  } catch (error) {
    console.error("Failed to remove pipeline item:", error);
    return NextResponse.json({ error: "Failed to remove" }, { status: 500 });
  }
}
