# Rockland — Grant Discovery for FQHCs

A focused decision-support tool that helps FQHC CFOs answer: **"Which grants are worth my attention right now, why, what's unclear, and what should I do next?"** — in under 10 minutes.

## What It Does

- Fetches live grant opportunities from the Grants.gov API with per-grant detail enrichment
- Scores each grant against your clinic's profile using a transparent heuristic
- Enriches selected grants with full descriptions, funding amounts, eligibility, and agency contacts
- Shows fit reasoning, risk flags (that auto-resolve when enriched data arrives), and recommended next steps
- Optional AI-powered "Quick Take" summaries via OpenAI (with heuristic fallback)
- Lightweight pipeline tracker with status management — **localStorage** when signed out, **Neon Postgres** (per Clerk user) when signed in with `DATABASE_URL`

## Why It Exists

CFOs at community health clinics spend 4-6 hours/week manually searching for grants across fragmented systems. They need quick signal — not deep workflow. This tool surfaces the grants worth pursuing and explains why, so the CFO can make a decision in minutes, not hours.

## Live Demo

**Production URL:** https://rockland-kjskdcp73-tytan-5553s-projects.vercel.app

## Local Setup

```bash
cd rockland
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Copy [`.env.example`](./.env.example) to `.env.local` and fill in what you need.

| Variable | Purpose | Required? |
|----------|---------|-----------|
| `OPENAI_API_KEY` | AI "Quick Take" + onboarding keyword enrichment | No — heuristic fallbacks |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk browser SDK | Yes for sign-in UI (get from [Clerk dashboard](https://dashboard.clerk.com)) |
| `CLERK_SECRET_KEY` | Clerk server auth (`auth()` in API routes) | Yes for signed-in `/api/pipeline` and `/api/profile` |
| `DATABASE_URL` | Neon Postgres connection string | No — without it, signed-in users still work but pipeline/profile stay local-only |

**Database setup:** Create a Neon project, run [`db/migrations/001_init.sql`](./db/migrations/001_init.sql) in the Neon SQL editor, then set `DATABASE_URL`.

Example `.env.local`:

```bash
OPENAI_API_KEY=sk-your-key-here
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
DATABASE_URL=postgresql://user:pass@host/neondb?sslmode=require
```

Without OpenAI, summaries and profile enrichment use heuristics. Without Clerk keys, the app still runs in **signed-out** mode with localStorage only. Without `DATABASE_URL`, signed-in users fall back to localStorage for pipeline/profile.

## Architecture Summary

- **Next.js 16** with App Router — single-surface architecture
- **Route handlers** — `/api/grants` (search + score), `/api/grants/detail` (per-grant enrichment), `/api/summarize` (AI summary)
- **Transparent heuristic scoring** — keyword overlap, agency relevance, deadline proximity → 0-100 score with human-readable reasoning
- **Optional AI summaries** — gpt-4o-mini "Quick Take" with graceful heuristic fallback
- **Clerk** (optional) + **Neon Postgres** (optional) for per-user pipeline and profile; **localStorage** when signed out or when DB is not configured
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
| `app/api/summarize/route.ts` | AI grant analysis via OpenAI with heuristic fallback |
| `app/api/profile/summarize/route.ts` | AI profile enhancement for onboarding wizard |
| `lib/scoring.ts` | Transparent fit scoring heuristic |
| `lib/normalize.ts` | Grants.gov → internal model conversion |
| `lib/types.ts` | Core data types |
| `lib/pipeline.ts` | localStorage pipeline helpers (signed-out path) |
| `lib/db.ts` | Neon serverless client |
| `lib/pipeline-db.ts` | User-scoped SQL for pipeline items |
| `app/api/pipeline/route.ts` | Authenticated pipeline CRUD |
| `app/api/profile/route.ts` | Authenticated profile GET/PUT |
| `middleware.ts` | Clerk `clerkMiddleware` |
| `lib/fallback-grants.ts` | Sample data when API is unavailable |
| `app/page.tsx` | Main page wiring all components |
| `components/` | UI components (GrantList, GrantDetail, Pipeline, etc.) |

## Assessment Requirement Coverage

| Requirement | Status | Implementation |
|------------|--------|----------------|
| Real API call | Done | Grants.gov search + fetchOpportunity detail endpoints |
| Structured data processing | Done | Normalize, score, enrich pipeline with typed internal models |
| AI integration | Done | `/api/summarize` (OpenAI gpt-4o-mini) + `/api/profile/summarize` for onboarding |
| Pipeline persistence | Done | localStorage + optional Neon per Clerk user |
| Deployed public URL | Done | Vercel production deployment |
| Product requirements doc | Done | [PRODUCT_REQUIREMENTS.md](./PRODUCT_REQUIREMENTS.md) |
| Architecture spec | Done | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Key decisions (3-5) | Done | [KEY_DECISIONS.md](./KEY_DECISIONS.md) |
| Build log with timestamps | Done | [BUILD_LOG.md](./BUILD_LOG.md) |
| AI usage reflection | Done | [AI_REFLECTION.md](./AI_REFLECTION.md) |

## Documentation

- [Vision & Roadmap](./VISION_AND_ROADMAP.md) — merged vision, transcript themes, and prioritized backlog
- [Product Requirements](./PRODUCT_REQUIREMENTS.md)
- [Architecture](./ARCHITECTURE.md)
- [Key Decisions](./KEY_DECISIONS.md)
- [Build Log](./BUILD_LOG.md)
- [AI Reflection](./AI_REFLECTION.md)
- [Talking Points](./TALKING_POINTS.md)
- [Claude Code Transcript](./CLAUDE_CODE_TRANSCRIPT.md)
- [ChatGPT Transcript](./CHATGPT_TRANSCRIPT.md)
- [Cursor Transcript](./CURSOR_TRANSCRIPT.md)

## Deployment

Deployed to Vercel. Push to `main` triggers automatic deployment.

```bash
vercel --prod
```
