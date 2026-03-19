# Live Session Talking Points

## Opening (2 min)

"I built a grant discovery tool for FQHC CFOs. The core insight from the transcript: the problem isn't finding grants — it's quickly deciding which ones are worth pursuing. CFOs have maybe 10 minutes a week for this."

**Demo the core loop:**
1. Open app — see recommended grants sorted by fit score
2. Click a grant — see WHY it fits (transparent scoring, not a black box)
3. See risk flags and unknowns surfaced honestly
4. Enriched details load: funding, eligibility, description, agency contact
5. Get AI second opinion on demand (optional)
6. Save to pipeline — track status across sessions

## Architecture (3 min)

**Single-surface Next.js — no separate backend, no database:**
- Route handlers as API layer: `/api/grants` (search + score), `/api/grants/detail` (enrichment), `/api/summarize` (AI)
- localStorage for pipeline persistence
- Vercel deployment in one command

**Why this architecture:**
- 3-hour constraint — infrastructure burns time with zero user value
- Satisfies all requirements: real API calls, structured data processing, persistence
- Easy to extend: swap localStorage for Postgres, add auth layer

**Data flow:**
- Grants.gov search API -> normalize -> score against clinic profile -> render
- On grant click: fetchOpportunity API -> enrich with description/funding/eligibility/contacts
- Risk flags auto-resolve when enriched data fills gaps

## Key Technical Decisions (5 min)

### 1. Heuristic-First Scoring (Most Important Decision)

"I chose transparent heuristic scoring over AI-first because the transcript emphasized trust and reliability. The CFO needs to understand WHY a grant scored high — not just that it did."

- Keyword overlap with clinic focus areas (40 pts)
- Agency relevance — HRSA, SAMHSA, CDC get bonus (15 pts)
- FQHC/community health signals (20 pts)
- Deadline proximity (10 pts)
- Human-readable reason for every score
- Confidence notes when data is limited

### 2. AI as Second Opinion, Not Primary

- "Quick Take" is click-to-load, not blocking
- Falls back to heuristic if no API key or timeout
- Shows "AI-generated" vs "Heuristic" badge — user knows the source
- Demo never breaks regardless of OpenAI status

### 3. Enriched Grant Details via fetchOpportunity

- Search endpoint returns minimal data (title, agency, dates)
- Added per-grant detail fetch for full context
- Gets: description, eligibility types, funding breakdown, contact info, program title
- Risk flags auto-clear when enriched data resolves them
- On-demand (per click) — keeps initial load fast

## What I Cut (and Why)

| Cut | Reason |
|-----|--------|
| Editable clinic profile | Doesn't prove core value; hardcoded profile drives scoring |
| Auth / multi-user | Single-user demo sufficient for 10-min use case |
| Database | localStorage works; 30+ min saved on provisioning |
| SAM.gov integration | Nice-to-have for UEI verification; Grants.gov covers the core need |
| Multiple search queries | Health category covers FQHC use case |
| Sort/filter controls | Fit score sort is the right default for "what deserves attention" |

## Tradeoffs

| Tradeoff | Rationale | Production Fix |
|----------|-----------|----------------|
| Heuristic over ML | Explainability > accuracy for building trust | Add ML as confidence grows |
| localStorage over DB | Speed to ship > scalability | Postgres + auth |
| Click-to-load AI | Reliability > magic | Could auto-trigger for High Fit grants |
| Scores from search data only | Initial load speed > accuracy | Batch-enrich top 10 on load |
| Single health category query | Simplicity > breadth | Fan out multiple queries |

## What I'd Add With More Time

**Next 2 hours:**
- Editable clinic profile (focus areas)
- Sort/filter by agency, deadline, fit level
- Re-score after enrichment data loads

**Next week:**
- Postgres + auth for multi-user
- SAM.gov UEI verification
- Email notifications for deadline reminders
- Batch detail enrichment on load

**Production:**
- Grant application workflow
- Document upload and team collaboration
- Reporting dashboard
- Consortium-level grant sharing

## Questions I Expect

**Q: Why not use AI for scoring?**
A: Trust. The transcript showed CFOs need to understand the "source of truth." A black-box AI score doesn't build confidence. The heuristic is transparent — you can see exactly why a grant scored high. AI is available as a second opinion when the user wants it.

**Q: How would this scale?**
A: Swap localStorage for Postgres, add auth, cache grant details. The data model is clean — migration is straightforward. Could add background jobs for batch enrichment.

**Q: What was hardest?**
A: Grants.gov API quirks. The search endpoint uses pipe separators not commas. Keyword search returned zero results — had to use category filtering. Also, the search endpoint returns minimal fields, so I had to discover and integrate the fetchOpportunity endpoint for enriched data.

**Q: Why no database?**
A: 30+ minutes of setup for zero user-visible value in a demo. The data model is ready for migration — just swap the persistence layer.

**Q: What about SAM.gov?**
A: SAM.gov would add UEI verification and exclusion checks — valuable for eligibility confirmation. It's the right next data source to integrate, but Grants.gov covers the core discovery and qualification workflow.

## Transcript Insights That Shaped the Build

- "Which one is the source of truth?" → Single-page tool, one clear answer per grant
- "I only have 10 minutes" → Fast load, pre-scored, click for more detail
- "We turn away grants" → Surface what's worth pursuing, not everything
- "Errors are dangerous" → Risk flags, confidence notes, honest uncertainty

## Closing

"I focused on the CFO's core need: quickly decide if a grant is worth pursuing. Everything else — reporting, compliance, application tracking — is valuable but not the 10-minute use case. This tool gives them signal, not workflow."

Questions for them:
- How do CFOs currently track which grants they've reviewed?
- What's the handoff like between discovery and application?
- Do clinics share grant intelligence within consortiums?
