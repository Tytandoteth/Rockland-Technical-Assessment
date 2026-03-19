# Product Requirements — Rockland Grant Discovery

## Problem

CFOs at Federally Qualified Health Centers (FQHCs) spend 4-6 hours per week manually searching for grants across fragmented systems — Excel, email, Grants.gov, agency newsletters. They manage 5-15 active grants with small finance teams. The core pain isn't finding grants — it's quickly determining: **"Is this worth pursuing?"**

## User

**CFO of an FQHC clinic**
- 50-300 staff across 2-5 clinic sites
- ~10 minutes per week available for grant discovery
- Low tolerance for complexity
- Needs quick signal, not deep workflow
- Current tools: Excel, QuickBooks, email, EMR systems

## Jobs to Be Done

1. **Discover** — Surface grant opportunities relevant to my clinic without manual searching
2. **Qualify** — Quickly assess whether a grant is worth pursuing based on fit, eligibility, and risk
3. **Decide** — Get a clear recommendation with transparent reasoning
4. **Track** — Save promising grants and track where they are in my pipeline

## MVP Scope

### In Scope
- Real-time grant feed from Grants.gov API (Health category, posted/forecasted)
- Clinic profile with focus areas driving fit scoring
- Transparent heuristic scoring: keyword overlap, agency relevance, deadline proximity
- Grant detail panel with fit reasoning, risk flags, unknowns, recommended next step
- Lightweight pipeline tracker (To Review → Interested → Applying → Submitted)
- Deadline urgency indicators
- Fallback to sample data when API is unavailable

### Out of Scope
- Authentication / multi-user support
- Full grant application workflow
- Reporting or compliance modules
- Real database / external storage
- AI/LLM-powered summaries (stretch goal only)
- Complex admin screens
- Polished production-grade design

## Success Criteria

1. A CFO can open the tool, see recommended grants, and understand why each one matters — in under 10 minutes
2. Fit scoring is transparent: every score has a human-readable explanation
3. Risk flags and unknowns are surfaced, not hidden
4. Grants can be saved to a pipeline that persists across page refreshes
5. The tool makes at least one real API call to Grants.gov
6. Deployed and accessible via public URL

## Key Design Principles

- **Trust over polish** — transparent reasoning matters more than beautiful UI
- **Signal over noise** — show what's relevant, flag what's uncertain
- **Speed over depth** — quick decision support, not comprehensive analysis
- **Action over data** — every grant shows a recommended next step
