# Key Decisions — Rockland Grant Discovery

## 1. What We Built

A focused grant discovery tool that fetches live grants from Grants.gov, enriches each with detailed funding/eligibility data, scores them against an FQHC clinic profile using a transparent heuristic, and lets the CFO save promising grants to a lightweight pipeline. The entire core loop — discover, qualify, decide, track — works in a single page in under 10 minutes.

Key capabilities:
- Real-time grant feed from Grants.gov (search + per-grant detail enrichment)
- Transparent heuristic scoring with human-readable reasoning and risk flags
- Optional AI-powered "Quick Take" summaries (OpenAI with heuristic fallback)
- Pipeline tracker with status management and localStorage persistence
- Retry/backoff logic and graceful fallback to sample data

## 2. What We Cut

- **Multiple search queries** — We query the Health category only. Could fan out queries across behavioral health, substance abuse, rural health for broader coverage.
- **Sort/filter controls** — Grants are sorted by fit score. Could add filters by agency, deadline range, or fit level. Chose not to because it adds UI complexity without proving the core "is this worth pursuing?" loop.
- **SAM.gov integration** — Would add UEI verification and exclusion checks for eligibility confirmation. Grants.gov covers the core discovery workflow.
- **Authentication / multi-user** — Single-user demo. Would need auth + database for production.

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
- **Persistence:** profile saved in localStorage, wizard skipped on return visits, "Edit" button to re-enter

This was initially scoped as a stretch goal but proved high-value: the AI-enhanced keywords meaningfully improve grant matching accuracy.

## 5. Single-Surface Architecture with No External Database

One Next.js deployment handles everything: UI, API proxy, data normalization, scoring, AI summaries. No separate backend, no hosted database, no cross-service communication.

- **Why no backend:** Adding FastAPI/Railway would burn 30+ minutes on infrastructure with zero user value. Route handlers do everything we need.
- **Why no database:** localStorage is sufficient for single-user pipeline tracking. The data model is clean enough to migrate to Postgres later. Adding Neon/Supabase would require provisioning, connection strings, and migrations — all wasted time for a demo.
- **Why Vercel-only:** Zero-config deployment for Next.js. One command deploys everything.

## 6. Technical Decision We'd Revisit: Re-scoring After Enrichment

Currently, fit scores are computed from the search endpoint's limited fields (title + agency), then enriched detail (description, funding, eligibility) is fetched per-grant on click. The enriched data is displayed but doesn't retroactively update the fit score.

**With more time:** Re-run the scoring heuristic after enrichment data arrives. This would give significantly more accurate scores — a grant with "FQHC" in its description would score higher than one with only a vaguely relevant title. We'd also batch-fetch detail for the top 10 grants on initial load to improve the list view scores.

**Why we didn't:** The current approach is honest — scores show confidence notes when based on limited data, and the enriched detail panel gives the CFO all the info needed to make a decision regardless of score accuracy.
