# Architecture — Rockland Grant Discovery

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 16 (App Router) | Server + client in one deployment, route handlers as API |
| Language | TypeScript | Type safety for data normalization, cheap insurance |
| Styling | Tailwind CSS | Fast to prototype, no CSS-in-JS overhead |
| Deployment | Vercel | Zero-config for Next.js, instant deploys |
| Auth (optional) | Clerk | Multi-user sign-in; `userId` scopes server data |
| Storage (signed out) | localStorage | Pipeline + profile without any backend setup |
| Storage (signed in) | Neon Postgres via `@neondatabase/serverless` | Per-user `pipeline_items` + `clinic_profiles` (JSONB) |
| External API | Grants.gov v1 | Public, no auth required, real grant data |

## Why Vercel + Next.js Only

The assessment requires a deployed prototype in 3 hours. A single-surface Next.js architecture eliminates:
- Separate backend deployment (no FastAPI, no Railway)
- Database provisioning (no Neon, no Supabase)
- Cross-origin configuration
- Multiple deployment targets

Next.js route handlers serve as the backend. **Signed-out** users persist pipeline and profile in **localStorage** only. **Signed-in** users with `DATABASE_URL` set use **Neon Postgres** as source of truth for pipeline and profile (`GET`/`POST`/`PATCH`/`DELETE` `/api/pipeline`, `GET`/`PUT` `/api/profile`). One `vercel --prod` command deploys everything.

## Route Handler Design

### `POST /api/grants`

Single endpoint that does everything server-side:

1. **Receive** clinic profile from client (or use default)
2. **Fetch** from Grants.gov v1 API (`POST https://api.grants.gov/v1/api/search2`)
   - Health category (`fundingCategories: "HL"`)
   - Posted + forecasted status (`oppStatuses: "forecasted|posted"`)
   - 50 results
3. **Normalize** Grants.gov response → internal `GrantOpportunity[]` model
   - Parse MM/DD/YYYY dates to ISO
   - Decode HTML entities
   - Construct Grants.gov detail URLs
4. **Score** each grant against clinic profile
   - Keyword overlap with focus areas (up to 40 pts)
   - FQHC/community health signals (up to 20 pts)
   - Agency relevance — HRSA, SAMHSA, CDC bonus (up to 15 pts)
   - Population/topic relevance (up to 15 pts)
   - Eligibility signals (up to 10 pts)
   - Deadline proximity (up to 10 pts)
5. **Sort** by fit score descending, return top 25
6. **Fallback** to local sample data if API fails (10s timeout)

### `POST /api/grants/detail`

Per-grant enrichment using Grants.gov's `fetchOpportunity` endpoint:

1. **Receive** grant ID from client
2. **Fetch** from `POST https://api.grants.gov/v1/api/fetchOpportunity`
3. **Extract** from `forecast` (for forecasted grants) or `synopsis` (for posted grants):
   - Full description (HTML stripped)
   - Estimated funding + per-award calculation
   - Award ceiling/floor
   - Eligible applicant types
   - Estimated posting/response/award dates
   - Agency contact name, email, phone
   - Program title from CFDA listing
4. **Return** enriched detail object

This endpoint is called on-demand when the user selects a grant, not batch-fetched. This keeps initial load fast while providing rich data when the user wants to dig deeper.

### `POST /api/summarize`

AI-powered grant recommendation:

1. **Receive** grant + clinic profile + heuristic assessment
2. **If OPENAI_API_KEY set:** Call gpt-4o-mini with structured prompt (8s timeout)
3. **If no key or API fails:** Return heuristic-generated recommendation
4. **Return** summary text + source tag ("ai" or "heuristic")

### `POST /api/profile/summarize`

Onboarding profile refinement via AI:

1. **Receive** raw clinic input from the onboarding wizard (name, state, type, focus areas, patient description, current grants, biggest need)
2. **If OPENAI_API_KEY set:** Call gpt-4o-mini to generate scoring-optimized keywords, a structured patient population summary, and a profile summary
3. **If no key or API fails:** Build keywords directly from the raw focus area selections
4. **Return** refined profile with `focusAreas`, `patientPopulationNotes`, `scoringKeywords[]`, and `profileSummary`

The `scoringKeywords` array (10-15 terms) is stored with the profile (localStorage when signed out, or JSON in `clinic_profiles` when signed in) and passed to the grants route to boost scoring relevance beyond the user's raw focus area selections.

### `/api/pipeline` (GET, POST, PATCH, DELETE)

Clerk-authenticated pipeline sync:

1. **`auth()`** provides `userId`; if missing or `DATABASE_URL` unset, responses indicate `source: "localStorage"` so the client keeps local-only behavior.
2. **GET** — list rows for `user_id = userId`, ordered by `saved_at`.
3. **POST** — upsert a `PipelineItem`; **`ON CONFLICT (user_id, grant_id)`** updates fields so duplicate saves are idempotent.
4. **PATCH** — update `status`, `next_step`, and/or `note` for a `grant_id` owned by the user.
5. **DELETE** — remove row for `grant_id` + `user_id`.

### `/api/profile` (GET, PUT)

1. **GET** — return stored JSON profile for the signed-in user, or `{ profile: null }` if none.
2. **PUT** — validate required `ClinicProfile` fields (`id`, `clinicName`, `state`, `clinicType`, `focusAreas[]`); upsert into `clinic_profiles.profile` (JSONB).

Schema migration: run [`db/migrations/001_init.sql`](./db/migrations/001_init.sql) in the Neon SQL editor.

### `POST /api/brief`

One-page markdown brief for CFO / leadership handoff (local-first, no new persistence):

1. **Receive** `grant`, `assessment`, optional `profile`, optional `enrichedDetail` (same shape as the client-side enrichment payload)
2. **Compose** markdown server-side using shared `analyzeEligibility()` so eligibility tier/verdict match the product logic
3. **Return** `{ markdown, filename }` for copy-to-clipboard and `.md` download in the UI

### `POST /api/sam/verify`

Optional SAM.gov **spike** — does not block Grants.gov discovery:

1. **Receive** `{ uei }` (12-character Unique Entity ID)
2. **If `SAM_API_KEY` is unset:** Return `{ status: "unconfigured", message }` (HTTP 200) so the UI can show a clear “not configured” state
3. **If configured:** `GET` SAM Entity Information API v3 (`entity-information/v3/entities`) with `ueiSAM` + `api_key`
4. **Return** `{ status: "ok", uei, found, message, recordCount? }` or `{ status: "unavailable", message }` on HTTP/network errors

Unknowns: API tier limits, response shape drift, and whether “public record exists” equals “eligible to apply” — documented as a signal only.

### Why Server-Side Scoring

- Single round trip: client gets pre-scored, sorted results
- Scoring logic stays co-located with data fetching
- No CORS issues calling Grants.gov from the browser
- Fallback logic is transparent to the client

## Data Normalization Flow

```
Grants.gov API Response
  └─ data.oppHits[]
       ├─ id, number, title
       ├─ agency, agencyCode
       ├─ openDate (MM/DD/YYYY)
       ├─ closeDate (MM/DD/YYYY)
       └─ cfdaList[]
            │
            ▼
     normalizeGrant()
            │
            ▼
     GrantOpportunity
       ├─ id, title, agency
       ├─ deadline (YYYY-MM-DD)
       ├─ url (constructed)
       ├─ source: "grants.gov"
       └─ summary, eligibilityText (when available)
            │
            ▼
     scoreGrant(grant, profile)
            │
            ▼
     GrantAssessment
       ├─ fitScore (0-100)
       ├─ fitLabel (High/Medium/Low)
       ├─ fitReason (human-readable)
       ├─ riskFlags[]
       ├─ recommendedAction
       ├─ confidenceNotes
       └─ scoringSource ("search" | "enriched") after detail load + re-score
```

## Persistence Approach

| Data | Storage | Why |
|------|---------|-----|
| Pipeline items (signed out) | `localStorage` key: `rockland-pipeline` | Same as before; no Clerk/DB required |
| Pipeline items (signed in + DB) | Postgres table `pipeline_items` | Scoped by Clerk `user_id`; survives refresh and device |
| Clinic profile (signed out) | `localStorage` key: `rockland-clinic-profile` | Wizard + Edit; includes `scoringKeywords` and wizard extras |
| Clinic profile (signed in + DB) | Postgres table `clinic_profiles` (`profile` JSONB) | Single row per user; wizard `PUT`s after submit |
| Grant data | Fetched fresh on load | No stale data, real API requirement satisfied |

### Pipeline Item Lifecycle

```
User clicks "Save to Pipeline"
  → PipelineItem created with status "To Review"
  → Saved to localStorage (signed out) or POST `/api/pipeline` then refetch (signed in)
  → Next step pre-populated from scoring recommendation
  → User can change status: To Review → Interested → Applying → Submitted
  → User can remove from pipeline
  → Per-item notes: blur-save with unchanged guard + short “Saved” feedback
  → Pipeline view: summary strip (counts by status, overdue, due in 14 days) and deadline grouping (Overdue / Due 14d / Later / No deadline)
```

## List & detail UX (roadmap wave)

- **Eligibility filter chips** on the grant list (`All`, FQHC Eligible, Likely, Verify, Unlikely) use `eligibilityTierForGrant()` / `analyzeEligibility()` on search-hit fields; counts reflect the full result set.
- **List cards** show a compact eligibility badge alongside fit; assessments are matched by `grantId` (not list index).
- **Grant detail** shows provenance for fit scoring (`search` vs `enriched`) and for eligibility source (typed applicant types vs listing text).
- **Brief export** is generated via `/api/brief` and consumed entirely client-side (clipboard + download).

## Tradeoffs

| Decision | Tradeoff | Would Revisit |
|----------|----------|---------------|
| localStorage (signed out) | No multi-device sync | Mitigated by optional Clerk + Neon for signed-in users |
| Server-side scoring only | Can't re-score without re-fetching | Maybe — could cache normalized grants |
| No individual grant detail API | Search endpoint returns limited fields | Yes — use opportunity detail endpoint for richer data |
| Heuristic scoring | No learning, no personalization | Maybe — could add lightweight ML with usage data |
| Single search query | May miss grants in other categories | Yes — could fan out multiple queries |
