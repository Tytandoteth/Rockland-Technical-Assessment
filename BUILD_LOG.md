# Build Log — Rockland Grant Discovery

## Timeline

### 0:00–0:20 — Scope & Architecture
- Reviewed assessment requirements, transcript themes, technical constraints
- Decided on single-surface Next.js architecture (no separate backend, no external DB)
- Chose Grants.gov v1 API — public, no auth, REST/JSON
- Defined internal data model: ClinicProfile, GrantOpportunity, GrantAssessment, PipelineItem
- Designed transparent heuristic scoring approach (keyword overlap, agency relevance, deadline proximity)

### 0:20–0:35 — Scaffold & Foundation
- Created Next.js 16 app with TypeScript + Tailwind + App Router
- Wrote all type definitions (`lib/types.ts`)
- Created default FQHC clinic profile (`lib/clinic-profile.ts`)
- Built realistic fallback grant data (10 grants) for API failure scenarios (`lib/fallback-grants.ts`)
- Implemented localStorage pipeline helpers (`lib/pipeline.ts`)

### 0:35–0:55 — Scoring & Normalization
- Implemented fit scoring heuristic (`lib/scoring.ts`)
  - Focus area keyword matching (40 pts)
  - FQHC/community health signals (20 pts)
  - Agency relevance bonus for HRSA, SAMHSA, CDC (15 pts)
  - Population/topic keywords (15 pts)
  - Eligibility signals (10 pts)
  - Deadline proximity (10 pts)
- Built Grants.gov response normalizer (`lib/normalize.ts`)
  - Date format conversion (MM/DD/YYYY → ISO)
  - HTML entity decoding
  - URL construction for grant detail links

### 0:55–1:15 — API Route Handler
- Built `/api/grants` route handler
- **Issue:** Initial attempt used comma-separated `oppStatuses` — returned 0 results
- **Fix:** Grants.gov uses pipe separator (`"forecasted|posted"`)
- **Issue:** Keyword search returned 0 results even with broad terms
- **Fix:** Used `fundingCategories: "HL"` (Health) for reliable filtering
- Confirmed real API data flowing with correct format

### 1:15–1:50 — UI Components
- Built all components in parallel:
  - `FitBadge` — color-coded High/Medium/Low badges with score
  - `DeadlineBadge` — urgency indicators (red for <7 days, amber for <30 days)
  - `GrantCard` — compact card with fit badge, title, agency, deadline, amount
  - `GrantList` — scrollable list with loading skeletons and fallback notice
  - `GrantDetail` — full detail panel with fit reasoning, risk flags, next step
  - `Pipeline` — status tracker with clickable status buttons
  - `ClinicProfile` — focus areas and patient population display

### 1:50–2:05 — Main Page Wiring
- Built main page with 3-panel layout (clinic profile + grant list | detail/pipeline)
- Tab switching between Grant Detail and Pipeline views
- Auto-select first grant on load
- Pipeline save → auto-switch to pipeline tab
- Click pipeline item → switch back to detail tab

### 2:05–2:20 — Polish & Bug Fixes
- Fixed HTML entity rendering (`&middot;` → `·`)
- Fixed HTML entities in grant titles from API (`&ndash;` → `–`)
- Cleaned up globals.css (removed dark mode, added line-clamp utilities)
- Updated layout metadata
- Verified desktop layout at 1440px width

### 2:20–2:40 — Deploy & Documentation
- Committed to git, pushed to GitHub
- Deployed to Vercel (production)
- Wrote README, PRODUCT_REQUIREMENTS, ARCHITECTURE, KEY_DECISIONS, BUILD_LOG, AI_REFLECTION

### 2:40–3:20 — Finalization Phase

#### AI Summary Integration
- Added `POST /api/summarize` route (`app/api/summarize/route.ts`)
  - Calls OpenAI gpt-4o-mini with clinic profile + grant context
  - 8s timeout, graceful fallback to heuristic-generated summary
  - Works without API key — falls back with "Heuristic" badge
- Integrated "Quick Take" section into GrantDetail component
  - On-demand: user clicks "Get AI-powered recommendation"
  - Shows source badge: "AI-generated" or "Heuristic"
  - Clears when switching between grants

#### Reliability Improvements
- Added retry with exponential backoff to Grants.gov route (2 retries, 1.5s base delay)
  - Only retries on 5xx errors and network failures, not 4xx
- Added "Refresh" button on grant list header
- Added "Retry" button in error banner
- Pipeline items now store and display grant deadline

#### Documentation Updates
- Updated KEY_DECISIONS.md with hybrid AI approach explanation
- Updated BUILD_LOG.md with finalization timeline
- Updated AI_REFLECTION.md with final override reasoning
- Updated README.md with env variable docs

### 3:20–3:50 — Grant Detail Enrichment

- Discovered Grants.gov `fetchOpportunity` endpoint — returns full synopsis, funding amounts, eligibility, contact info per grant
- Built `POST /api/grants/detail` route to fetch and normalize enriched data
- Wired auto-fetch into page.tsx — enriched data loads when user selects a grant
- Updated GrantDetail to display enriched fields: funding with per-award calc, estimated dates, full description, eligibility, agency contact with mailto
- Fixed numeric fields coming as strings from API (needed `Number()` parsing)
- Added smart risk flag filtering — stale flags auto-clear when enriched data resolves them (e.g., "Funding not specified" disappears once funding data loads)
- Fixed date format — API returns `"Mar 31, 2026 12:00:00 AM EDT"`, cleaned to `"Mar 31, 2026"`

### 3:50–4:10 — Robustness Polish

- Added pipeline fallback detail view — when a saved grant isn't in current search results, shows saved title/deadline/status/next step with explanatory notice
- Created ErrorBoundary component wrapping root layout — catches render crashes with friendly "Reload" UI
- Added `grantUrl` to PipelineItem — fallback view can link to Grants.gov
- Updated all documentation to reflect final shipped state

## What Broke

1. **Grants.gov API format** — oppStatuses uses pipe `|` not comma `,` separator. Cost ~10 minutes to debug.
2. **Keyword search** — Grants.gov keyword search returned 0 results for all terms tried. Switched to category-based filtering (`fundingCategories: "HL"`).
3. **HTML entities in API data** — Grant titles contained `&ndash;` and other HTML entities. Added decoder in normalization layer.
4. **Middot rendering** — React doesn't render `&middot;` HTML entities in JSX text. Replaced with literal `·` character.

5. **Enrichment numeric fields** — `estimatedFunding` came as string `"94000000"` from API, not number. `toLocaleString()` didn't add commas. Fixed with `Number()` parsing in detail route.
6. **Enrichment date format** — `estSynopsisPostingDateStr` returned ugly `"2026-03-31-00-00-00"`. Used the non-Str field (`estSynopsisPostingDate: "Mar 31, 2026 12:00:00 AM EDT"`) and stripped the time portion.

## What Shipped

- Real Grants.gov API integration: search (25 health grants) + per-grant detail enrichment (funding, description, eligibility, contacts)
- Transparent heuristic scoring with human-readable reasoning
- AI-powered "Quick Take" summaries (OpenAI gpt-4o-mini with heuristic fallback)
- Risk flags with smart resolution (flags auto-clear when enriched data fills gaps)
- Pipeline tracker with localStorage persistence, deadline display, and fallback detail view
- Error boundary for crash recovery
- Refresh and retry controls for error recovery
- Retry with exponential backoff on Grants.gov API
- Fallback to sample data when API is unavailable
- Deployed to Vercel
