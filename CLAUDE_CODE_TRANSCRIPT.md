# Claude Code Transcript — Technical Assessment Build Session

## Session Date
March 19, 2026 (SGT / UTC+8)

## Build Window
~2:00 PM to ~4:25 PM SGT (approximately 2.5 hours of active coding)

---

## 14:00 SGT — Session Start: Planning Phase

- Reviewed assessment requirements, CONTEXT.md, SCOPE.md, AGENT.md, TALKING_POINTS.md
- Researched Grants.gov API — discovered v1 REST API at `api.grants.gov/v1/api/search2` (no auth required)
- Created implementation plan: 5-bullet MVP, file structure, route handler strategy, scoring approach
- Decision: heuristic-only scoring (no AI) as primary layer — user confirmed

## 14:06 SGT — Scaffold Next.js App

- `create-next-app@latest` with TypeScript + Tailwind + App Router
- Next.js 16.2.0 installed
- Commit: `Initial commit from Create Next App`

## 14:07–14:27 SGT — Core Implementation (Parallel Component Build)

Built all lib and component files in rapid parallel batches:

**Lib layer (all created in one batch):**
- `lib/types.ts` — ClinicProfile, GrantOpportunity, GrantAssessment, PipelineItem
- `lib/clinic-profile.ts` — Default FQHC profile (Sunrise Community Health Center, CO)
- `lib/scoring.ts` — Multi-factor heuristic: focus area match, FQHC signals, agency relevance, deadline proximity
- `lib/normalize.ts` — Grants.gov response → internal model with date parsing and HTML entity decoding
- `lib/fallback-grants.ts` — 10 realistic sample grants for API failure fallback
- `lib/pipeline.ts` — localStorage helpers (get, save, update, remove)

**API route:**
- `app/api/grants/route.ts` — POST handler: fetch Grants.gov → normalize → score → sort → return

**Components (all created in one batch):**
- `FitBadge.tsx` — Color-coded High/Medium/Low badges with score
- `DeadlineBadge.tsx` — Urgency indicators (red <7 days, amber <30 days)
- `GrantCard.tsx` — Compact card with fit badge, title, agency, deadline
- `GrantList.tsx` — Scrollable list with loading skeletons and fallback notice
- `GrantDetail.tsx` — Full detail panel with fit reasoning, risk flags, next step
- `Pipeline.tsx` — Status tracker with clickable status buttons
- `ClinicProfile.tsx` — Focus areas and patient population display

**Main page:**
- `app/page.tsx` — Three-panel layout wiring all components together

## 14:28 SGT — First Successful Build

- All TypeScript compiles clean
- Commit: `feat: FQHC Grant Discovery MVP — core loop complete`

## 14:28–14:35 SGT — API Debugging

- **Issue:** Grants.gov returned 0 results with comma-separated `oppStatuses`
- **Discovery:** API uses pipe separator (`"forecasted|posted"`)
- **Issue:** Keyword search returned 0 results for all terms
- **Fix:** Used `fundingCategories: "HL"` (Health category) for reliable filtering
- Confirmed real API data flowing: 25 health grants returned

## 14:31 SGT — Documentation

- Wrote all 6 required deliverable documents in parallel
- Commit: `docs: add all required deliverable documents`

## 14:35 SGT — First Deployment

- Pushed to GitHub (`Tytandoteth/Rockland-Technical-Assessment`)
- Deployed to Vercel production
- Live URL confirmed working

## 14:41–14:43 SGT — AI Summary + Reliability

- Added `POST /api/summarize` route (OpenAI gpt-4o-mini with heuristic fallback)
- Integrated "Quick Take" section in GrantDetail (on-demand, click-to-load)
- Added retry with exponential backoff to Grants.gov route (2 retries)
- Added Refresh button on grant list + Retry button on error banner
- Added deadline display on pipeline items
- Set OPENAI_API_KEY on Vercel
- Commit: `feat: add AI summary, retry logic, refresh controls, doc updates`

## 14:50–14:57 SGT — Grant Detail Enrichment

- Discovered Grants.gov `fetchOpportunity` endpoint — returns full description, funding, eligibility, contacts
- Built `POST /api/grants/detail` route
- Wired auto-fetch on grant selection in page.tsx
- Updated GrantDetail: funding with per-award calculation, estimated dates, description, eligibility, agency contact with mailto
- Fixed numeric fields from string responses
- Added smart risk flag filtering (flags auto-clear when enriched data resolves them)
- Fixed date format issues
- Commit: `feat: enrich grant details via fetchOpportunity API`

## 15:03–15:07 SGT — Robustness Polish

- Added pipeline fallback detail view (when grant not in current search results)
- Created ErrorBoundary component (catches render crashes)
- Added `grantUrl` to PipelineItem type
- Commit: `fix: add pipeline fallback view and error boundary`

## 15:16 SGT — Documentation Sync

- Updated KEY_DECISIONS.md (removed stale references to "cut" features that were actually built)
- Updated BUILD_LOG.md (added enrichment and robustness phases)
- Updated README.md (correct deploy URL, enrichment endpoint, data flow diagram)
- Updated ARCHITECTURE.md (all 3 route handler docs)
- Added DeadlineBadge to Pipeline, localStorage write error handling
- Commit: `docs: update all deliverables to reflect final shipped state`

## 15:20 SGT — Talking Points

- Wrote full TALKING_POINTS.md for live session
- Added SAM.gov to "What We Cut" in KEY_DECISIONS
- Commit: `docs: add complete talking points for live session`

## 15:25–15:31 SGT — Onboarding Wizard

- Built 3-step OnboardingWizard component (clinic basics → focus areas → patient population)
- Built `POST /api/profile/summarize` route (OpenAI converts raw input to scoring-optimized keywords)
- Wired wizard into page.tsx: show on first visit, skip on return, "Edit" button
- AI-generated scoringKeywords passed to grant scoring for better matching
- Added "Skip — use sample profile" option
- Commit: `feat: add onboarding wizard with AI-powered profile summarization`

## 15:37 SGT — Sample Presets

- Added 3 sample clinic presets to wizard: Rural FQHC, Urban Safety-Net, Small Rural Clinic
- One click fills all fields and jumps to step 3 for review
- Commit: `feat: add sample clinic presets to onboarding wizard`

## 15:45–15:53 SGT — Rockland Branding

- Read BRANDING.md spec (navy, teal, cream, green palette)
- Added Rockland color palette to Tailwind v4 theme in globals.css
- Updated all 11 component files: cream backgrounds, navy text, teal accents, green CTAs
- Arrow CTAs ("Save to Pipeline →", "View on Grants.gov →")
- Commit: `style: apply Rockland brand colors and typography`

## 16:00–16:02 SGT — AI Analysis Upgrade

- Replaced text link with prominent teal CTA button with lightbulb icon
- Rewrote AI prompt: structured 5-section output (Recommendation, Fit Analysis, Eligibility, Funding, Next Steps)
- Increased max_tokens from 200 to 600
- Fed enriched detail data into prompt
- Added markdown-style rendering (bold headers, teal bullet points)
- Commit: `feat: upgrade AI analysis with CTA button and enriched prompt`

## 16:10–16:12 SGT — Bug Fixes

- **Fix:** AI analysis stale closure — added `enrichedDetail` to useCallback dependency array so AI prompt receives funding data
- **Fix:** Grant URLs using numeric ID instead of opp number for reliable links
- **Fix:** Added Assessment Requirement Coverage table to README
- **Fix:** Replaced template root README with project entry point
- Commit: `fix: AI analysis now sees enriched funding data, fix grant URLs, docs cleanup`

## 16:15 SGT — Scoring Improvements

- Lowered fit thresholds: High >= 50 (was 70), Medium >= 25 (was 40)
- Boosted focus area scoring (15 pts per match), population keywords (7 pts), FQHC signals (25 pts max)
- Added international grant penalty: -50 for PEPFAR, Ukraine, India, Uganda, etc.
- CCBHC behavioral health grant now scores High Fit with enriched profile
- Commit: `fix: improve scoring thresholds and filter international grants`

## 16:22 SGT — Deadline Fix

- DeadlineBadge header now falls back to enriched estimatedPostDate when grant.deadline is empty
- CCBHC grant shows "Mar 31, 2026 (12d left)" instead of "No deadline listed"
- Commit: `fix: show enriched deadline in header when grant.deadline is empty`

## 16:25 SGT — Final Wrap

- Created CLAUDE_CODE_TRANSCRIPT.md and CHATGPT_TRANSCRIPT.md
- Final commit and deploy

---

## AI Reflection (from build session)

### Where AI Accelerated
- Parallel component scaffolding: 7 components + 6 lib files + API route in ~20 minutes
- Scoring heuristic design with multi-factor approach and human-readable reasoning
- Grants.gov API research and endpoint discovery

### Where AI Was Wrong
- Assumed comma-separated `oppStatuses` parameter (API uses pipe `|`)
- Assumed search endpoint returns rich data (only returns title/agency/dates)
- Initial `useCallback` dependency array missed `enrichedDetail`, causing stale closure

### Where We Overrode AI
- Chose heuristic-first scoring over AI-first (transparency > sophistication)
- Kept AI as optional on-demand second opinion, not blocking primary flow
- Used hybrid approach: heuristic always works, AI enhances when available
