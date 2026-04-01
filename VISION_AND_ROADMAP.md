# Vision & Roadmap — Rockland Grant Discovery

This document merges the product vision ([PRODUCT_REQUIREMENTS.md](./PRODUCT_REQUIREMENTS.md)), engineering decisions ([KEY_DECISIONS.md](./KEY_DECISIONS.md)), the tactical backlog ([IMPROVEMENTS.md](./IMPROVEMENTS.md)), and customer/assessment themes so reviewers and future builders share one narrative.

---

## 1. Product vision

**Who:** CFO at a Federally Qualified Health Center (FQHC) — ~50–300 staff, 5–15 active grants, small finance team.

**Constraint:** About **10 minutes per week** for grant discovery work.

**Problem we solve:** Not “find more grants.” It is **“Is this grant worth pursuing right now — and why?”** Signal, not endless search or full grants-management workflow.

**Jobs to be done**

| Job | What success looks like |
|-----|-------------------------|
| Discover | Relevant opportunities surface without manual Grants.gov digging |
| Qualify | Fit, eligibility risk, and unknowns are clear in one place |
| Decide | Transparent reasoning + optional AI second opinion |
| Track | Lightweight pipeline (status + context) across sessions |

**Out of scope for this prototype:** Full application workflow, compliance/reporting modules, multi-tenant production auth — those are adjacent products, not the 10-minute decision loop.

**Design principles:** Trust over polish; signal over noise; speed over depth; action over raw data dumps.

---

## 2. What we shipped (summary)

- Grants.gov **search** + per-opportunity **enrichment** (`fetchOpportunity`)
- **Transparent heuristic scoring** + human-readable reasons and risk flags
- **Onboarding wizard** with optional **AI-assisted profile keywords** (see [KEY_DECISIONS.md](./KEY_DECISIONS.md))
- **Quick Take** via OpenAI with heuristic fallback
- **Pipeline** in localStorage (status, deadlines, fallback detail when a grant drops out of search)
- **Resilience:** retries on Grants.gov, fallback sample data, error/retry UI

---

## 3. Themes from customer & assessment context

These informed *how* we built, not only *what* we listed in the PRD:

| Theme | Product implication |
|-------|---------------------|
| “Which one is the source of truth?” | Heuristic-first, explainable scores; label AI vs heuristic; show data provenance (search vs enriched detail) |
| “I only have 10 minutes” | One screen, pre-sorted list, deep detail on demand |
| “Errors are dangerous” | Risk flags, confidence notes, no fake precision |
| Consortium / sharing (future) | Export or shareable summaries before building multi-org auth |
| Data integrity | Validate eligibility on Grants.gov; don’t over-claim automated compliance |

---

## 4. Roadmap — prioritized implementation

### Tier A — Highest ROI (trust + CFO workflow)

| Priority | Item | Rationale | Est. | Detail |
|----------|------|-----------|------|--------|
| A1 | **Scoring calibration + re-score after enrichment** | List labels should match reality once full description/eligibility load; unlocks credible “High” fit | 30–60 min | See [IMPROVEMENTS.md](./IMPROVEMENTS.md) §1 + [KEY_DECISIONS.md](./KEY_DECISIONS.md) §6 |
| A2 | **International / off-mission noise filter** | Wrong geography/clutters list → CFO loses trust fast | ~10 min | [IMPROVEMENTS.md](./IMPROVEMENTS.md) §2 |
| A3 | **Urgent-first vs best-fit** (single control) | 10-minute user often optimizes for deadline, not only score | ~20 min | Subset of [IMPROVEMENTS.md](./IMPROVEMENTS.md) §6 |

**Suggested order:** A2 → A1 → A3 (quick win, then accuracy, then sort mode).

### Tier B — UX polish

| Item | Rationale | Est. |
|------|-----------|------|
| Edit profile **pre-fill** | Friction on re-entry | ~10 min |
| **Pipeline notes** | “Waiting on CFO,” “check state eligibility” | ~15 min |
| Agency **truncation / abbreviations** (SAMHSA, HRSA, CDC) | Readability | ~5 min |

### Tier C — Strategic (v2+)

| Item | Rationale | Est. |
|------|-----------|------|
| **SAM.gov** (UEI, exclusions) | Eligibility confidence | 1–2 h + API key |
| **Sort/filter** full set | Power users | ~20+ min |
| **Deadline reminders** (email) | Ops integration | ~30+ min |
| **Grant comparison** (2–3 side by side) | Decision meetings | ~45+ min |
| **Auth + Postgres** | Multi-user, consortium | See `_prepared/` prompts |

---

## 5. Relationship to other docs

| Document | Role |
|----------|------|
| [PRODUCT_REQUIREMENTS.md](./PRODUCT_REQUIREMENTS.md) | MVP scope and success criteria |
| [KEY_DECISIONS.md](./KEY_DECISIONS.md) | What we built, cut, and would revisit |
| [IMPROVEMENTS.md](./IMPROVEMENTS.md) | Tactical backlog from QA (detailed fixes) |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical design |
| [TALKING_POINTS.md](./TALKING_POINTS.md) | Live session script (keep aligned with this file) |

---

## 6. Version

- **Last updated:** 2026-03-29  
- **Maintainers:** Update Tier A/B when `IMPROVEMENTS.md` closes items; update §2 when major features ship.
