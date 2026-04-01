// lib/pipeline-db.ts — Server-side pipeline persistence via Neon Postgres
// Replaces localStorage pipeline for production use
import { getDb, isDatabaseConfigured } from "./db";
import { PipelineItem } from "./types";

export async function getPipelineFromDb(): Promise<PipelineItem[]> {
  if (!isDatabaseConfigured()) return [];
  const sql = getDb();
  const rows = await sql`
    SELECT id, grant_id, grant_title, grant_deadline, grant_url,
           status, next_step, note, saved_at
    FROM pipeline_items
    ORDER BY saved_at DESC
  `;
  return rows.map((row) => ({
    id: row.id,
    grantId: row.grant_id,
    grantTitle: row.grant_title,
    grantDeadline: row.grant_deadline?.toISOString().split("T")[0] || undefined,
    grantUrl: row.grant_url || undefined,
    status: row.status as PipelineItem["status"],
    nextStep: row.next_step || undefined,
    note: row.note || undefined,
    savedAt: row.saved_at?.toISOString() || new Date().toISOString(),
  }));
}

export async function savePipelineItemToDb(item: PipelineItem): Promise<void> {
  if (!isDatabaseConfigured()) return;
  const sql = getDb();
  await sql`
    INSERT INTO pipeline_items (id, grant_id, grant_title, grant_deadline, grant_url, status, next_step, note, saved_at)
    VALUES (${item.id}, ${item.grantId}, ${item.grantTitle}, ${item.grantDeadline || null}, ${item.grantUrl || null}, ${item.status}, ${item.nextStep || null}, ${item.note || null}, ${item.savedAt})
    ON CONFLICT (id) DO NOTHING
  `;
}

export async function updatePipelineItemInDb(
  grantId: string,
  updates: Partial<Pick<PipelineItem, "status" | "nextStep" | "note">>
): Promise<void> {
  if (!isDatabaseConfigured()) return;
  const sql = getDb();
  await sql`
    UPDATE pipeline_items
    SET status = COALESCE(${updates.status || null}, status),
        next_step = COALESCE(${updates.nextStep || null}, next_step),
        note = COALESCE(${updates.note || null}, note),
        updated_at = NOW()
    WHERE grant_id = ${grantId}
  `;
}

export async function removePipelineItemFromDb(grantId: string): Promise<void> {
  if (!isDatabaseConfigured()) return;
  const sql = getDb();
  await sql`DELETE FROM pipeline_items WHERE grant_id = ${grantId}`;
}
