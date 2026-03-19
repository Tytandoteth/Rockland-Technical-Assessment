# AI Usage Reflection — Rockland Grant Discovery

## Where AI Materially Accelerated Us

**Parallel component scaffolding.** AI generated all 7 UI components, the scoring engine, normalization layer, type definitions, and API route handler in rapid succession — what would have been 60-90 minutes of typing was completed in under 20 minutes. The generated code was structurally sound and required minimal revision. This was the single biggest time savings: getting from "empty repo" to "fully wired app" in about an hour.

The scoring heuristic design was also AI-accelerated. Claude proposed a multi-factor scoring approach (keyword overlap, agency relevance, deadline proximity, eligibility signals) with specific point allocations and human-readable reason generation. I refined the weights but the structure was solid from the start.

## Where AI Led Us in the Wrong Direction

**Grants.gov API format assumptions.** AI initially used comma-separated values for the `oppStatuses` parameter (`"posted,forecasted"`) based on general API conventions and training data. The actual Grants.gov API requires pipe-separated values (`"forecasted|posted"`). This cost ~10 minutes of debugging — trying different keyword combinations, checking response formats, before the user provided documentation showing the correct format.

AI also assumed the search endpoint would return rich data (descriptions, amounts, eligibility details). In reality, the search hits contain only title, agency, dates, and status. This meant our scoring had less signal to work with than planned, and we had to add confidence notes acknowledging the limitation.

## Where We Intentionally Overrode AI

**Heuristic scoring over AI/LLM summaries.** The initial project context files (CONTEXT.md) suggested using OpenAI for grant summaries. We overrode this in favor of a pure heuristic approach. Reasons:

1. **Transparency** — The CFO transcript themes emphasized trust and reliability. A heuristic score with visible reasoning ("Matches clinic focus areas: behavioral health, dental") is more trustworthy than an opaque AI assessment. The user can verify why a grant scored high.

2. **Speed** — No API key management, no latency from LLM calls, no cost per request. The scoring runs in milliseconds, not seconds.

3. **Reliability** — One external API dependency (Grants.gov) is already a risk factor. Adding OpenAI as a second dependency doubles the failure surface. With a heuristic, if Grants.gov fails we fall back to sample data; the scoring always works.

4. **Assessment fit** — The assessment evaluates "knowing when to override AI tools." Using AI to call AI felt like the wrong signal. A hand-crafted heuristic demonstrates product judgment and system design thinking.

This was the right call. The scoring is honest about its confidence level, flags unknowns explicitly, and gives the CFO a clear recommendation — which is what the user research called for.
