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

## What Broke

1. **Grants.gov API format** — oppStatuses uses pipe `|` not comma `,` separator. Cost ~10 minutes to debug.
2. **Keyword search** — Grants.gov keyword search returned 0 results for all terms tried. Switched to category-based filtering (`fundingCategories: "HL"`).
3. **HTML entities in API data** — Grant titles contained `&ndash;` and other HTML entities. Added decoder in normalization layer.
4. **Middot rendering** — React doesn't render `&middot;` HTML entities in JSX text. Replaced with literal `·` character.

## What Shipped

- Real Grants.gov API integration (25 live health grants)
- Transparent heuristic scoring with human-readable reasoning
- Risk flags and confidence notes
- Pipeline tracker with localStorage persistence
- Fallback data when API is unavailable
- Deployed to Vercel
