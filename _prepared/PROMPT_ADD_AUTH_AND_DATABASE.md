# Prompt: Add Clerk Auth + Neon Postgres (Full Stack)

Paste this into Claude Code to execute everything at once:

---

Add Clerk authentication AND Neon Postgres database in one pass. The database is already provisioned and seeded.

## 1. Install dependencies
```bash
npm install @clerk/nextjs @neondatabase/serverless
```

## 2. Add DATABASE_URL to `.env.local`
Append this line to `.env.local` (keep the existing OPENAI_API_KEY):
```
DATABASE_URL=postgresql://neondb_owner:npg_rJ4NGFZWpd6o@ep-late-hall-anm29yyi-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## 3. Copy prepared files into place
```bash
# Clerk middleware
cp _prepared/middleware.ts middleware.ts

# Clerk + ErrorBoundary layout
cp _prepared/layout-with-clerk.tsx app/layout.tsx

# Neon database client
cp _prepared/db.ts lib/db.ts

# Pipeline API route (with Clerk auth + Neon)
mkdir -p app/api/pipeline
cp _prepared/api-pipeline-route-with-auth.ts app/api/pipeline/route.ts
```

## 4. Update `app/api/grants/route.ts` — DB-backed fallback

Add these imports at the top:
```typescript
import { getDb, isDatabaseConfigured } from "@/lib/db";
```

In the catch block, BEFORE the existing `FALLBACK_GRANTS` usage, add a database fallback attempt:
```typescript
// Try database synthetic data first
if (isDatabaseConfigured()) {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM grants WHERE source = 'synthetic' ORDER BY deadline ASC`;
    const dbGrants: GrantOpportunity[] = rows.map(row => ({
      id: row.id as string,
      title: row.title as string,
      agency: row.agency as string,
      deadline: row.deadline ? (row.deadline as Date).toISOString().split("T")[0] : "",
      amountMin: (row.amount_min as number) || undefined,
      amountMax: (row.amount_max as number) || undefined,
      eligibilityText: (row.eligibility_text as string) || undefined,
      summary: (row.summary as string) || undefined,
      url: (row.url as string) || undefined,
      source: "fallback" as const,
      rawTags: (row.raw_tags as string[]) || undefined,
    }));
    if (dbGrants.length > 0) {
      const dbAssessments = dbGrants.map(g => scoreGrant(g, profile, scoringKeywords));
      const sorted = sortByFitScore(dbGrants, dbAssessments);
      const result: GrantsApiResponse = {
        grants: sorted.grants,
        assessments: sorted.assessments,
        source: "fallback",
        totalResults: sorted.grants.length,
      };
      return NextResponse.json(result);
    }
  } catch (dbError) {
    console.error("DB fallback also failed:", dbError);
  }
}
```

Keep the existing `FALLBACK_GRANTS` code below as a final fallback.

## 5. Update `app/page.tsx` — sync pipeline to server

Add these fire-and-forget sync calls to the pipeline handlers. The pattern is: localStorage stays the fast path, DB is the durable backup. Don't await — just fire and catch silently.

In `handleSaveToPipeline`, after `setPipeline(updated)`, add:
```typescript
// Sync to server (fire-and-forget)
fetch("/api/pipeline", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(item),
}).catch(() => {});
```

In `handleUpdateStatus`, after `setPipeline(updated)`, add:
```typescript
fetch("/api/pipeline", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ grantId, status }),
}).catch(() => {});
```

In `handleRemoveFromPipeline`, after `setPipeline(updated)`, add:
```typescript
fetch("/api/pipeline", {
  method: "DELETE",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ grantId }),
}).catch(() => {});
```

## 6. Update docs

In `ARCHITECTURE.md`, update the Persistence section:
- Pipeline items are now persisted to both localStorage (instant UX) and Neon Postgres (durable, per-user)
- Synthetic grant data is seeded in the database (10 grants across 3 tables)
- Clerk auth provides user-scoped pipeline data via `user_id` column
- Auth runs in keyless mode for zero-config demo

In `KEY_DECISIONS.md`, add a new decision #7:
```markdown
## 7. Clerk Auth + Neon Postgres: Added Late, Zero Breaking Changes

We added authentication (Clerk) and a real database (Neon Postgres) as a late addition without breaking any existing functionality. The approach:

- **Clerk keyless mode:** No API keys or dashboard setup needed. Auth UI appears automatically.
- **Neon Postgres:** 3 tables (grants, pipeline_items, clinic_profiles) with 10 synthetic grants seeded.
- **Hybrid persistence:** localStorage remains the fast path for instant UI updates. Database syncs fire-and-forget in the background, scoped per Clerk userId.
- **Graceful degradation:** If DATABASE_URL isn't set or auth isn't available, everything falls back to the original localStorage-only behavior. Zero breaking changes.

This demonstrates that the architecture was designed to evolve — adding auth and a database required no refactoring of the core scoring, normalization, or UI logic.
```

Commit message: `feat: add Clerk auth and Neon Postgres with per-user pipeline persistence`
