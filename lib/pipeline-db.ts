import { getDb, isDatabaseConfigured } from "./db";
import type { PipelineItem } from "./types";

function mapRow(row: Record<string, unknown>): PipelineItem {
  const deadline = row.grant_deadline;
  let grantDeadline: string | undefined;
  if (deadline instanceof Date) {
    grantDeadline = deadline.toISOString().split("T")[0];
  } else if (typeof deadline === "string") {
    grantDeadline = deadline.split("T")[0];
  }

  const savedAt = row.saved_at;
  const savedAtIso =
    savedAt instanceof Date
      ? savedAt.toISOString()
      : typeof savedAt === "string"
        ? savedAt
        : new Date().toISOString();

  return {
    id: row.id as string,
    grantId: row.grant_id as string,
    grantTitle: row.grant_title as string,
    grantDeadline,
    grantUrl: (row.grant_url as string) || undefined,
    status: row.status as PipelineItem["status"],
    nextStep: (row.next_step as string) || undefined,
    note: (row.note as string) || undefined,
    savedAt: savedAtIso,
  };
}

export async function getPipelineForUser(
  userId: string
): Promise<PipelineItem[]> {
  if (!isDatabaseConfigured()) return [];
  const sql = getDb();
  const rows = await sql`
    SELECT id, user_id, grant_id, grant_title, grant_deadline, grant_url,
           status, next_step, note, saved_at, updated_at
    FROM pipeline_items
    WHERE user_id = ${userId}
    ORDER BY saved_at DESC
  `;
  return rows.map((row) =>
    mapRow(row as unknown as Record<string, unknown>)
  );
}

export async function upsertPipelineItem(
  userId: string,
  item: PipelineItem
): Promise<void> {
  if (!isDatabaseConfigured()) return;
  const sql = getDb();
  await sql`
    INSERT INTO pipeline_items (
      id, user_id, grant_id, grant_title, grant_deadline, grant_url,
      status, next_step, note, saved_at, updated_at
    )
    VALUES (
      ${item.id},
      ${userId},
      ${item.grantId},
      ${item.grantTitle},
      ${item.grantDeadline ?? null},
      ${item.grantUrl ?? null},
      ${item.status},
      ${item.nextStep ?? null},
      ${item.note ?? null},
      ${item.savedAt}::timestamptz,
      NOW()
    )
    ON CONFLICT (user_id, grant_id) DO UPDATE SET
      grant_title = EXCLUDED.grant_title,
      grant_deadline = EXCLUDED.grant_deadline,
      grant_url = EXCLUDED.grant_url,
      status = EXCLUDED.status,
      next_step = EXCLUDED.next_step,
      note = EXCLUDED.note,
      saved_at = EXCLUDED.saved_at,
      updated_at = NOW()
  `;
}

export async function updatePipelineItemForUser(
  userId: string,
  grantId: string,
  updates: Partial<Pick<PipelineItem, "status" | "nextStep" | "note">>
): Promise<void> {
  if (!isDatabaseConfigured()) return;
  const sql = getDb();
  const status = updates.status ?? null;
  const nextStep = updates.nextStep ?? null;
  const note =
    updates.note !== undefined ? updates.note : null;
  await sql`
    UPDATE pipeline_items
    SET
      status = COALESCE(${status}, status),
      next_step = COALESCE(${nextStep}, next_step),
      note = COALESCE(${note}, note),
      updated_at = NOW()
    WHERE grant_id = ${grantId} AND user_id = ${userId}
  `;
}

export async function removePipelineItemForUser(
  userId: string,
  grantId: string
): Promise<void> {
  if (!isDatabaseConfigured()) return;
  const sql = getDb();
  await sql`
    DELETE FROM pipeline_items
    WHERE grant_id = ${grantId} AND user_id = ${userId}
  `;
}
