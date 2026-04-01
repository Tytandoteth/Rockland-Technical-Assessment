# Key Decisions — Rockland Grant Discovery

## 1. What We Built

A focused grant discovery tool that fetches live grants from Grants.gov, enriches each with detailed funding/eligibility data, scores them against an FQHC clinic profile using a transparent heuristic, and lets the CFO save promising grants to a lightweight pipeline. The entire core loop — discover, qualify, decide, track — works in a single page in under 10 minutes.

Key capabilities:
- Real-time grant feed from Grants.gov (search + per-grant detail enrichment)
- Transparent heuristic scoring with human-readable reasoning and risk flags; **re-score after enrichment** with `scoringSource` surfaced in the UI
- Optional AI-powered "Quick Take" summaries (OpenAI with heuristic fallback)
- Pipeline tracker with status management, **deadline grouping**, **summary metrics**, notes with blur-save / unchanged guard; **localStorage when signed out**, **Neon Postgres per Clerk user** when signed in with `DATABASE_URL`
- **Eligibility confidence** — list filters and card badges from shared `analyzeEligibility` / `eligibilityTierForGrant` logic
- **One-page brief** — `/api/brief` markdown for copy + `.md` download (CFO handoff)
- **SAM.gov spike** — optional `POST /api/sam/verify` behind `SAM_API_KEY`; graceful “unconfigured” / error paths; never blocks Grants.gov
- Retry/backoff logic and graceful fallback to sample data

## 2. What We Cut

- **Multiple search queries** — We query the Health category only. Could fan out queries across behavioral health, substance abuse, rural health for broader coverage.
- **Agency / amount range filters** — Not in this wave; eligibility tier + sort modes cover the primary triage loop.
- **Full SAM.gov product** — Only a narrow UEI → public entity lookup spike; no exclusion monitoring, no workflow automation.
- **Org / SSO / enterprise IAM** — Clerk covers standard sign-in; no SAML/SCIM in this pass.

## 3. Hybrid AI Approach: Heuristic First, AI Second Opinion

We built a hybrid qualification system rather than making AI the primary layer:
- **Primary:** Transparent heuristic scoring (keyword overlap, agency relevance, deadline proximity) — always visible, always fast, zero API dependency
- **Secondary:** On-demand AI "Quick Take" via `/api/summarize` — calls gpt-4o-mini when the user clicks, falls back to heuristic if no key or API failure

This reflects the CFO's need for trustworthy, explainable signal. The transcript emphasized "Which one is the source of truth?" — a heuristic you can trace beats an AI opinion you can't verify.

## 4. Onboarding Wizard with AI Profile Enhancement

Rather than hardcoding a clinic profile, we built a 3-step onboarding wizard that lets the user describe their clinic. OpenAI then converts raw input into scoring-optimized keywords — so a CFO who types "we serve migrant farmworkers with diabetes" gets keyword matches they wouldn't have thought to select from a checkbox list.

- **3 quick steps:** clinic basics → focus areas (toggle pills) → patient population and needs
- **AI enrichment:** raw input → 5-8 optimized focus areas + 10-15 scoring keywords
- **Sample presets:** "Rural FQHC", "Urban Safety-Net", "Small Rural Clinic" for one-click setup
- **Persistence:** signed-out users keep profile in localStorage; signed-in users load/save profile via `/api/profile` when Neon is configured, with localStorage still used as fallback if the DB row is empty

This was initially scoped as a stretch goal but proved high-value: the AI-enhanced keywords meaningfully improve grant matching accuracy.

## 5. Single-Surface Next.js + Optional Neon and Clerk

One Next.js deployment handles UI, API proxy, data normalization, scoring, and AI summaries — no separate FastAPI service.

- **Why still one app:** Route handlers remain the only “backend”; adding Neon does not split the codebase into multiple deployables.
- **Hybrid persistence:** **Signed-out** users behave like the original demo (localStorage only). **Signed-in** users with `DATABASE_URL` get **durable** pipeline and profile rows keyed by **Clerk `userId`**. If the DB is unset or the user is anonymous, APIs return `source: "localStorage"` and the client falls back to browser storage (and `getPipeline()` when the server returns no rows for a signed-in user without DB).
- **Why Vercel:** Zero-config deployment for Next.js; set `DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, and `CLERK_SECRET_KEY` in project env for production auth + DB.

## 6. Re-scoring After Enrichment (implemented)

When Grants.gov `fetchOpportunity` data loads for the selected grant, the client merges description + applicant types + funding fields, re-runs `scoreGrant`, and tags the assessment with `scoringSource: "enriched"`. The list still reflects search-hit scores until the user opens each grant (batch detail fetch for the top N would be the next scaling step).

## 7. SAM.gov Spike: Boundaries

- **Env-gated:** `SAM_API_KEY` required; without it the API returns `status: "unconfigured"` and the UI explains the limitation.
- **Narrow question:** “Does this UEI return a public entity record?” — not registration status depth, exclusions, or representational authority.
- **Non-blocking:** Grants.gov discovery and pipeline flows never depend on SAM.
