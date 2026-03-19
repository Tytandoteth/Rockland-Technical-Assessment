# Rockland — Grant Discovery for FQHCs

A focused decision-support tool that helps FQHC CFOs answer: **"Which grants are worth my attention right now, why, what's unclear, and what should I do next?"** — in under 10 minutes.

## What It Does

- Fetches live grant opportunities from the Grants.gov API with per-grant detail enrichment
- Scores each grant against your clinic's profile using a transparent heuristic
- Enriches selected grants with full descriptions, funding amounts, eligibility, and agency contacts
- Shows fit reasoning, risk flags (that auto-resolve when enriched data arrives), and recommended next steps
- Optional AI-powered "Quick Take" summaries via OpenAI (with heuristic fallback)
- Lightweight pipeline tracker with status management persisted in localStorage

## Why It Exists

CFOs at community health clinics spend 4-6 hours/week manually searching for grants across fragmented systems. They need quick signal — not deep workflow. This tool surfaces the grants worth pursuing and explains why, so the CFO can make a decision in minutes, not hours.

## Live Demo

**Production URL:** https://rockland-jmk2hihc6-tytan-5553s-projects.vercel.app

## Local Setup

```bash
cd rockland
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables (Optional)

| Variable | Purpose | Required? |
|----------|---------|-----------|
| `OPENAI_API_KEY` | Enables AI-powered "Quick Take" summaries via gpt-4o-mini | No — falls back to heuristic summary |

Create a `.env.local` file:

```bash
OPENAI_API_KEY=sk-your-key-here
```

Without the key, the "Quick Take" feature still works using a heuristic-generated recommendation.

## Architecture Summary

- **Next.js 16** with App Router — single-surface architecture
- **Route handlers** — `/api/grants` (search + score), `/api/grants/detail` (per-grant enrichment), `/api/summarize` (AI summary)
- **Transparent heuristic scoring** — keyword overlap, agency relevance, deadline proximity → 0-100 score with human-readable reasoning
- **Optional AI summaries** — gpt-4o-mini "Quick Take" with graceful heuristic fallback
- **localStorage** for pipeline persistence — no database required
- **Vercel** deployment — zero-config, instant

### Data Flow

```
Grants.gov Search API → Route Handler → Normalize → Score → Client → Render
                                           ↑                    │
                                   Clinic Profile          Select Grant
                                (focus areas drive scoring)      │
                                                                 ▼
                              Grants.gov Detail API → Enrich → Display
                                                       (funding, eligibility, contacts)
```

### Key Files

| File | Purpose |
|------|---------|
| `app/api/grants/route.ts` | Grants.gov search + normalize + score (with retry) |
| `app/api/grants/detail/route.ts` | Per-grant enrichment via fetchOpportunity |
| `app/api/summarize/route.ts` | AI summary via OpenAI with heuristic fallback |
| `lib/scoring.ts` | Transparent fit scoring heuristic |
| `lib/normalize.ts` | Grants.gov → internal model conversion |
| `lib/types.ts` | Core data types |
| `lib/pipeline.ts` | localStorage persistence helpers |
| `lib/fallback-grants.ts` | Sample data when API is unavailable |
| `app/page.tsx` | Main page wiring all components |
| `components/` | UI components (GrantList, GrantDetail, Pipeline, etc.) |

## Documentation

- [Product Requirements](./PRODUCT_REQUIREMENTS.md)
- [Architecture](./ARCHITECTURE.md)
- [Key Decisions](./KEY_DECISIONS.md)
- [Build Log](./BUILD_LOG.md)
- [AI Reflection](./AI_REFLECTION.md)

## Deployment

Deployed to Vercel. Push to `main` triggers automatic deployment.

```bash
vercel --prod
```
