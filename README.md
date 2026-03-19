# Rockland — Grant Discovery for FQHCs

A focused decision-support tool that helps FQHC CFOs answer: **"Which grants are worth my attention right now, why, what's unclear, and what should I do next?"** — in under 10 minutes.

## What It Does

- Fetches live grant opportunities from the Grants.gov API
- Scores each grant against your clinic's profile using a transparent heuristic
- Shows fit reasoning, risk flags, unknowns, and a recommended next step
- Lets you save grants to a lightweight pipeline tracker

## Why It Exists

CFOs at community health clinics spend 4-6 hours/week manually searching for grants across fragmented systems. They need quick signal — not deep workflow. This tool surfaces the grants worth pursuing and explains why, so the CFO can make a decision in minutes, not hours.

## Live Demo

**Production URL:** https://rockland-ngxe4ljfq-tytan-5553s-projects.vercel.app

## Local Setup

```bash
cd rockland
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture Summary

- **Next.js 16** with App Router — single-surface architecture
- **Route handler** (`/api/grants`) proxies Grants.gov, normalizes data, runs fit scoring
- **Transparent heuristic scoring** — keyword overlap, agency relevance, deadline proximity → 0-100 score with human-readable reasoning
- **localStorage** for pipeline persistence — no database required
- **Vercel** deployment — zero-config, instant

### Data Flow

```
Grants.gov API → Route Handler → Normalize → Score → Client → Render
                                    ↑
                            Clinic Profile
                          (focus areas drive scoring)
```

### Key Files

| File | Purpose |
|------|---------|
| `app/api/grants/route.ts` | Grants.gov fetch + normalize + score |
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
