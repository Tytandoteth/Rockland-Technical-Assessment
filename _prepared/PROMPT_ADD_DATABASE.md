# Prompt: Add Neon Postgres Database

Paste this into Claude Code to execute:

---

Add Neon Postgres as a database backend. The database is already provisioned and seeded. Here's what to do:

## 1. Install the Neon serverless driver
```bash
npm install @neondatabase/serverless
```

## 2. Add to `.env.local`
```
DATABASE_URL=postgresql://neondb_owner:npg_rJ4NGFZWpd6o@ep-late-hall-anm29yyi-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## 3. Copy prepared files into place
```bash
cp _prepared/db.ts lib/db.ts
cp _prepared/pipeline-db.ts lib/pipeline-db.ts
mkdir -p app/api/pipeline
cp _prepared/api-pipeline-route.ts app/api/pipeline/route.ts
```

## 4. Update `app/api/grants/route.ts`
In the catch block (fallback path), before using `FALLBACK_GRANTS`, add a database query attempt:
- Import `getDb` and `isDatabaseConfigured` from `@/lib/db`
- If database is configured, query `SELECT * FROM grants WHERE source = 'synthetic'`
- Map rows to `GrantOpportunity[]` (snake_case → camelCase: `amount_min` → `amountMin`, `eligibility_text` → `eligibilityText`, etc.)
- Score them and return as fallback
- If DB query fails, fall through to the existing `FALLBACK_GRANTS` hardcoded array

## 5. Update `app/page.tsx` pipeline handlers to also sync to the server
For each pipeline mutation (save, update status, remove), after the existing localStorage call, also fire-and-forget a fetch to `/api/pipeline`:
- `handleSaveToPipeline`: also `POST` the item to `/api/pipeline`
- `handleUpdateStatus`: also `PATCH` to `/api/pipeline` with `{ grantId, status }`
- `handleRemoveFromPipeline`: also `DELETE` to `/api/pipeline` with `{ grantId }`

Use fire-and-forget pattern (no await, catch silently) so localStorage remains the fast path and DB is the durable backup.

## 6. Update docs
In `ARCHITECTURE.md`, update the Persistence section to mention Neon Postgres:
- Pipeline items are persisted to both localStorage (fast) and Neon Postgres (durable)
- Synthetic grant data is seeded in the database (10 grants)
- Database schema includes 3 tables: grants, pipeline_items, clinic_profiles

In `KEY_DECISIONS.md`, update decision #5 to mention we added Neon Postgres for production persistence while keeping localStorage for instant client-side UX.

Commit message: `feat: add Neon Postgres for pipeline persistence and synthetic data`
