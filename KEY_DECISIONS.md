# Key Decisions — Rockland Grant Discovery

## 1. What We Built

A focused grant discovery tool that fetches real grants from Grants.gov, scores them against an FQHC clinic profile using a transparent heuristic, and lets the CFO save promising grants to a lightweight pipeline. The entire core loop — discover, qualify, decide, track — works in a single page in under 10 minutes.

## 2. What We Cut

- **AI/LLM summaries** — Heuristic scoring is faster, cheaper, and more transparent. The CFO can see exactly why a grant scored high without wondering what the AI might have gotten wrong. Would add as a "deeper analysis" button with more time.
- **Editable clinic profile** — Hardcoded a realistic FQHC profile. Editing would be nice but doesn't prove the core value proposition.
- **Individual grant detail fetching** — The search endpoint returns limited fields (no synopsis, no amounts for most grants). Would use the detail endpoint to fetch richer data per-grant with more time.
- **Multiple search queries** — We query health grants only. Could fan out queries across behavioral health, substance abuse, rural health, etc. for broader coverage.
- **Sort/filter controls** — Grants are sorted by fit score. Could add filters by agency, deadline range, fit level.

## 3. Why Single-Surface Architecture

One Next.js deployment handles everything: UI, API proxy, data normalization, scoring. No separate backend, no database, no cross-service communication. This is the simplest architecture that satisfies the requirements (real API call + structured data + persistence) and can be deployed in minutes. Adding a separate backend would have burned 30+ minutes on infrastructure with zero user value.

## 4. Why No Hosted Database

localStorage is sufficient for a single-user demo. The pipeline data structure is simple (array of items with status). Adding Neon/Supabase/Postgres would require provisioning, connection strings, migrations, error handling — minimum 30 minutes of work that produces no visible user value. The data model is clean enough that migrating to a real DB later is straightforward.

## 5. Technical Decision We'd Revisit: Scoring Data Richness

The Grants.gov search endpoint returns minimal fields per hit — title, agency, dates, but no description, eligibility details, or funding amounts for most grants. Our scoring works with title + agency, but would be significantly more accurate with full grant descriptions.

**With more time:** After the initial search, fetch individual grant details for the top-scoring results using the Grants.gov opportunity detail endpoint. This would give us synopsis text, eligible applicant types, and award amounts — dramatically improving scoring confidence and the detail panel experience.

**Why we didn't:** The detail fetch would require either sequential API calls (slow) or batched requests (complexity). Given the 3-hour constraint, we chose to ship a working core loop with honest confidence notes ("Score based on title and agency only") rather than risk breaking the timeline on API reliability issues.
