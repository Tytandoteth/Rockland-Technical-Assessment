# AI Usage Reflection — Rockland Grant Discovery

## Where AI Materially Accelerated Us

**Parallel component scaffolding.** AI generated all 7 UI components, the scoring engine, normalization layer, type definitions, and API route handler in rapid succession — what would have been 60-90 minutes of typing was completed in under 20 minutes. The generated code was structurally sound and required minimal revision. This was the single biggest time savings: getting from "empty repo" to "fully wired app" in about an hour.

The scoring heuristic design was also AI-accelerated. Claude proposed a multi-factor scoring approach (keyword overlap, agency relevance, deadline proximity, eligibility signals) with specific point allocations and human-readable reason generation. I refined the weights but the structure was solid from the start.

## Where AI Led Us in the Wrong Direction

**Grants.gov API format assumptions.** AI initially used comma-separated values for the `oppStatuses` parameter (`"posted,forecasted"`) based on general API conventions and training data. The actual Grants.gov API requires pipe-separated values (`"forecasted|posted"`). This cost ~10 minutes of debugging — trying different keyword combinations, checking response formats, before the user provided documentation showing the correct format.

AI also assumed the search endpoint would return rich data (descriptions, amounts, eligibility details). In reality, the search hits contain only title, agency, dates, and status. This meant our scoring had less signal to work with than planned, and we had to add confidence notes acknowledging the limitation.

## Where We Intentionally Overrode AI

**Heuristic-first architecture over AI-first scoring.** The initial project context files (CONTEXT.md) suggested using OpenAI as the primary qualification layer. We overrode this — making transparent heuristic scoring the primary layer and AI summaries an optional second opinion. Reasons:

1. **Transparency** — The CFO transcript themes emphasized trust and reliability. A heuristic score with visible reasoning ("Matches clinic focus areas: behavioral health, dental") is more trustworthy than an opaque AI assessment. The user can verify why a grant scored high.

2. **Speed** — The heuristic runs in milliseconds. No latency from LLM calls on every page load. The AI summary is available on-demand for grants the CFO wants a deeper take on.

3. **Reliability** — One external API dependency (Grants.gov) is already a risk factor. Making the core scoring depend on OpenAI would double the failure surface. With the hybrid approach, the tool always works — AI summary is additive, not blocking.

4. **Graceful degradation** — If no API key is configured or OpenAI is down, the "Quick Take" section falls back to a heuristic-generated recommendation with a "Heuristic" badge. The demo never breaks.

This was the right call. We later added the AI summary route (`/api/summarize`) to satisfy the CONTEXT.md requirement, but kept it as a secondary layer. The hybrid approach demonstrates both product judgment (knowing that trust matters more than AI magic for this user) and technical judgment (knowing when to add AI and when to lean on simpler, more explainable systems).
