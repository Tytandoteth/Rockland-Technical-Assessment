# Add Neon Postgres — Quick Deploy Guide
**Estimated time: 5-8 minutes**

## Step 1: Install dependency (30 sec)
```bash
cd rockland
npm install @neondatabase/serverless
```

## Step 2: Add DATABASE_URL to .env.local (30 sec)
Add to `.env.local`:
```
DATABASE_URL=postgresql://neondb_owner:npg_rJ4NGFZWpd6o@ep-late-hall-anm29yyi-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## Step 3: Create tables + seed data (30 sec)
```bash
psql $DATABASE_URL -f _prepared/schema.sql
psql $DATABASE_URL -f _prepared/seed.sql
```

## Step 4: Copy files into place (1 min)
```bash
cp _prepared/db.ts lib/db.ts
cp _prepared/pipeline-db.ts lib/pipeline-db.ts
mkdir -p app/api/pipeline
cp _prepared/api-pipeline-route.ts app/api/pipeline/route.ts
```

## Step 5: Update fallback-grants.ts to query DB (2 min)
In `app/api/grants/route.ts`, add database fallback:
```typescript
import { getDb, isDatabaseConfigured } from "@/lib/db";

// In the catch block, before FALLBACK_GRANTS:
if (isDatabaseConfigured()) {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM grants WHERE source = 'synthetic' ORDER BY deadline ASC`;
    const dbGrants = rows.map(row => ({
      id: row.id,
      title: row.title,
      agency: row.agency,
      deadline: row.deadline?.toISOString().split("T")[0] || "",
      amountMin: row.amount_min || undefined,
      amountMax: row.amount_max || undefined,
      eligibilityText: row.eligibility_text || undefined,
      summary: row.summary || undefined,
      url: row.url || undefined,
      source: "fallback" as const,
      rawTags: row.raw_tags || undefined,
    }));
    if (dbGrants.length > 0) {
      const assessments = dbGrants.map(g => scoreGrant(g, profile, scoringKeywords));
      const sorted = sortByFitScore(dbGrants, assessments);
      return NextResponse.json({ grants: sorted.grants, assessments: sorted.assessments, source: "fallback", totalResults: sorted.grants.length });
    }
  } catch (e) { console.error("DB fallback failed:", e); }
}
```

## Step 6: Add DATABASE_URL to Vercel (1 min)
```bash
vercel env add DATABASE_URL production
# Paste the connection string when prompted
vercel --prod
```

## Step 7: Verify
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM grants;"
# Should return 10

curl -s http://localhost:3000/api/pipeline | jq .
# Should return { items: [] }
```

---

## What This Gives You
- **3 tables:** grants (10 synthetic rows), pipeline_items, clinic_profiles
- **Server-side pipeline API:** GET/POST/PATCH/DELETE at `/api/pipeline`
- **DB-backed fallback:** When Grants.gov is down, queries synthetic grants from Postgres instead of hardcoded array
- **Hybrid persistence:** localStorage still works client-side for instant UX; DB is the source of truth
- **Zero breaking changes:** Everything still works without DATABASE_URL set (graceful degradation)
