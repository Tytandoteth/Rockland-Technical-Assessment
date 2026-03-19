# Architecture — Rockland Grant Discovery

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 16 (App Router) | Server + client in one deployment, route handlers as API |
| Language | TypeScript | Type safety for data normalization, cheap insurance |
| Styling | Tailwind CSS | Fast to prototype, no CSS-in-JS overhead |
| Deployment | Vercel | Zero-config for Next.js, instant deploys |
| Storage | localStorage | Zero setup, sufficient for single-user demo |
| External API | Grants.gov v1 | Public, no auth required, real grant data |

## Why Vercel + Next.js Only

The assessment requires a deployed prototype in 3 hours. A single-surface Next.js architecture eliminates:
- Separate backend deployment (no FastAPI, no Railway)
- Database provisioning (no Neon, no Supabase)
- Cross-origin configuration
- Multiple deployment targets

Next.js route handlers serve as the backend. localStorage handles persistence. One `vercel --prod` command deploys everything.

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
       └─ confidenceNotes
```

## Persistence Approach

| Data | Storage | Why |
|------|---------|-----|
| Pipeline items | `localStorage` key: `rockland-pipeline` | Persists across refreshes, zero setup |
| Clinic profile | Hardcoded default | Editable profile is a stretch goal |
| Grant data | Fetched fresh on load | No stale data, real API requirement satisfied |

### Pipeline Item Lifecycle

```
User clicks "Save to Pipeline"
  → PipelineItem created with status "To Review"
  → Saved to localStorage
  → Next step pre-populated from scoring recommendation
  → User can change status: To Review → Interested → Applying → Submitted
  → User can remove from pipeline
```

## Tradeoffs

| Decision | Tradeoff | Would Revisit |
|----------|----------|---------------|
| localStorage | No multi-device sync, no backup | Yes — Postgres + auth in production |
| Server-side scoring only | Can't re-score without re-fetching | Maybe — could cache normalized grants |
| No individual grant detail API | Search endpoint returns limited fields | Yes — use opportunity detail endpoint for richer data |
| Heuristic scoring | No learning, no personalization | Maybe — could add lightweight ML with usage data |
| Single search query | May miss grants in other categories | Yes — could fan out multiple queries |
