# ChatGPT Transcript — Technical Assessment

## Session Date
March 19, 2026 (SGT / UTC+8)

## Build Window
Planned: March 20, 2026 — 1:00 PM to 4:00 PM SGT

---

## 13:00 SGT — Initial Assessment Review

- Reviewed engineering assessment requirements
- Identified key constraints:
  - 2-3 hour build
  - 1 real API call required
  - must process structured data (synthetic allowed)
  - product must be useful within ~10 minutes

Key takeaway:
> This is a product judgment test, not a feature-building test

---

## 13:10 SGT — Problem Framing

Used AI to extract core user problem from PR + transcript:

User:
- CFO at an FQHC

Core insight:
> The problem is not "find grants" but "quickly decide if a grant is worth pursuing"

Additional insights:
- fragmented systems create lack of trust
- manual workflows are time-consuming
- missed opportunities due to complexity

---

## 13:20 SGT — MVP Scoping

Defined a narrow MVP:

Core loop:
1. Fetch grants (real API)
2. Score relevance
3. Show reasoning + risks
4. Allow saving to pipeline

Non-goals:
- no reporting
- no compliance
- no auth
- no complex backend

AI contribution:
- helped aggressively reduce scope
- identified core user action

---

## 13:30 SGT — Architecture Exploration

Initial idea:
- Next.js frontend
- FastAPI backend
- Neon DB
- Railway deployment

AI suggestion:
- multi-service architecture

---

## 13:40 SGT — Architecture Decision (Override AI)

Decision:
- Use Next.js only (Vercel)
- Use route handlers for backend logic
- Use localStorage for persistence

Reason:
> Multi-service architecture increases risk and does not improve core product value in a 3-hour build

Outcome:
- reduced complexity
- improved reliability
- faster iteration

---

## 13:50 SGT — API Strategy

Decision:
- Use Grants.gov API

Plan:
- fetch small dataset
- normalize into internal structure

Fallback:
- cached or synthetic dataset if API unstable

AI contribution:
- suggested normalization layer
- helped define internal data model

---

## 14:00 SGT — Data Modeling

Defined internal models:
- ClinicProfile
- GrantOpportunity
- GrantAssessment
- PipelineItem

AI contribution:
- structured schema design
- clarified relationships between entities

---

## 14:15 SGT — Fit Scoring Logic

Decision:
- Use heuristic (not ML)

Inputs:
- keyword match
- clinic focus alignment
- deadline urgency
- eligibility hints

Outputs:
- fitScore
- fitReason
- riskFlags
- recommendedAction

Key insight:
> Transparency is more important than sophistication

---

## 14:30 SGT — UX Strategy

Defined UI:
- Recommended grants list
- Detail panel
- Pipeline tracker

Enhancements:
- "Why this fits"
- "Risks / unknowns"
- "Next step"

AI contribution:
- emphasized 10-minute usability constraint
- helped refine user flow

---

## 14:45 SGT — Time Planning

Breakdown:
- 0:00-0:20 -> scope
- 0:20-1:40 -> build
- 1:40-2:15 -> polish
- 2:15-3:00 -> docs

AI contribution:
- enforced strict prioritization
- prevented overbuilding

---

## 15:00 SGT — Error / Correction

AI error:
- initially used PST instead of PDT for time conversion

Fix:
- verified via real-world clock
- corrected to PDT (UTC-7)

Lesson:
> Do not rely on static assumptions for real-world data

---

## 15:10 SGT — Final Architecture Lock

Final decision:
- Next.js (App Router)
- Tailwind
- route handlers
- Vercel deployment
- localStorage persistence

Rejected:
- FastAPI
- Railway
- Neon DB

Reason:
> unnecessary complexity under time constraint

---

## 15:20 SGT — Claude Code Preparation

Generated structured prompt for Claude Code:
- enforces scope
- enforces time management
- enforces deliverables

AI contribution:
- turned strategy into executable build instructions

---

## 15:30 SGT — Final Strategy

Final product framing:
> "A lightweight decision-support tool that helps a CFO determine which grants are worth pursuing, why, and what to do next — in under 10 minutes."

---

## AI Reflection

### Where AI Accelerated
- Rapid scoping of ambiguous requirements
- Translating transcript into product insights
- Defining MVP and architecture
- Generating execution plan and coding prompt

### Where AI Was Wrong
- Suggested over-engineered architecture (FastAPI + DB)
- Incorrect timezone assumption (PST vs PDT)

### Where I Overrode AI
- Simplified architecture to single Next.js app
- Removed backend + database
- Prioritized reliability and speed over infrastructure

---

## Conclusion

AI was used as a high-speed thinking and structuring tool, but final decisions prioritized:
- simplicity
- reliability
- product clarity
- ability to ship within constraints
