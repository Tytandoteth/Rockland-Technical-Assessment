import { NextRequest, NextResponse } from "next/server";
import { GrantOpportunity, ClinicProfile, GrantAssessment } from "@/lib/types";

interface AiPicksRequest {
  grants: GrantOpportunity[];
  assessments: GrantAssessment[];
  profile: ClinicProfile;
}

export interface AiPick {
  grantId: string;
  rank: number;
  reasoning: string;
  strategicFit: string;
}

interface AiPicksResponse {
  picks: AiPick[];
  portfolioInsight: string;
  source: "ai" | "heuristic";
}

function buildPrompt(
  grants: GrantOpportunity[],
  assessments: GrantAssessment[],
  profile: ClinicProfile
): string {
  const grantSummaries = grants
    .map((g, i) => {
      const a = assessments[i];
      return `[${g.id}] "${g.title}" — ${g.agency} | Fit: ${a.fitLabel} (${a.fitScore}) | Funding: ${g.amountMax ? `$${g.amountMax.toLocaleString()}` : "Not specified"} | Deadline: ${g.deadline || "Not specified"} | Risks: ${a.riskFlags.length} flags | Reason: ${a.fitReason.slice(0, 120)}`;
    })
    .join("\n");

  return `You are a senior grant strategy advisor for FQHC clinics. A CFO needs your expert recommendation on which grants to pursue RIGHT NOW.

CLINIC PROFILE:
- Name: ${profile.clinicName}
- Type: ${profile.clinicType} in ${profile.state}
- Size: ${profile.orgSizeBand || "Not specified"}
- Focus areas: ${profile.focusAreas.join(", ")}
- Patient population: ${profile.patientPopulationNotes || "Not specified"}
- Current grants: ${profile.currentGrants || "Not specified"}
- Biggest need: ${profile.biggestNeed || "Not specified"}

AVAILABLE GRANTS (${grants.length} total):
${grantSummaries}

Select the TOP 3-5 grants this clinic should pursue. Think strategically:
- Which grants align best with the clinic's specific focus areas and patient population?
- Which combination creates a strong, diversified funding portfolio?
- Which are realistic given the clinic type and size?
- Prioritize actionable opportunities (upcoming deadlines, realistic effort).

Respond in this exact JSON format (no markdown, no code fences):
{
  "picks": [
    {
      "grantId": "<the [id] from the list>",
      "rank": 1,
      "reasoning": "<2-3 sentences: why this specific grant is a top pick for THIS clinic>",
      "strategicFit": "<1 short phrase: e.g., 'Core mission alignment', 'Diversifies behavioral health funding'>"
    }
  ],
  "portfolioInsight": "<2-3 sentences: how these picks work together as a portfolio strategy for this clinic>"
}`;
}

function buildHeuristicPicks(
  grants: GrantOpportunity[],
  assessments: GrantAssessment[]
): AiPicksResponse {
  const indexed = assessments
    .map((a, i) => ({ assessment: a, grant: grants[i], index: i }))
    .sort((a, b) => b.assessment.fitScore - a.assessment.fitScore)
    .slice(0, 5);

  const picks: AiPick[] = indexed.map((item, rank) => ({
    grantId: item.grant.id,
    rank: rank + 1,
    reasoning: `${item.assessment.fitReason} ${item.assessment.recommendedAction}`,
    strategicFit:
      rank === 0
        ? "Strongest overall fit"
        : rank === 1
          ? "High relevance to focus areas"
          : "Worth investigating",
  }));

  return {
    picks,
    portfolioInsight:
      "These grants were selected based on fit score, eligibility alignment, and relevance to your clinic's focus areas. Consider pursuing the top 2-3 to build a diversified funding pipeline.",
    source: "heuristic",
  };
}

export async function POST(request: NextRequest) {
  let body: AiPicksRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { grants, assessments, profile } = body;

  if (!grants?.length || !assessments?.length || !profile) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(buildHeuristicPicks(grants, assessments));
  }

  try {
    // Send top 15 grants (by score) to keep prompt focused
    const sorted = assessments
      .map((a, i) => ({ a, g: grants[i] }))
      .sort((x, y) => y.a.fitScore - x.a.fitScore)
      .slice(0, 15);

    const topGrants = sorted.map((s) => s.g);
    const topAssessments = sorted.map((s) => s.a);

    const prompt = buildPrompt(topGrants, topAssessments, profile);

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1200,
      }),
    });

    if (!res.ok) {
      console.error("OpenAI API error:", res.status);
      return NextResponse.json(buildHeuristicPicks(grants, assessments));
    }

    const data = await res.json();
    const content: string = data.choices?.[0]?.message?.content?.trim() ?? "";

    // Parse JSON response
    const parsed = JSON.parse(content);

    // Validate all grantIds exist in our list
    const grantIdSet = new Set(grants.map((g) => g.id));
    const validPicks: AiPick[] = (parsed.picks || [])
      .filter((p: AiPick) => grantIdSet.has(p.grantId))
      .slice(0, 5);

    if (validPicks.length < 2) {
      // AI response was malformed, fall back
      return NextResponse.json(buildHeuristicPicks(grants, assessments));
    }

    const result: AiPicksResponse = {
      picks: validPicks.map((p: AiPick, i: number) => ({
        ...p,
        rank: i + 1,
      })),
      portfolioInsight:
        parsed.portfolioInsight ||
        "These grants represent the strongest opportunities for your clinic based on AI analysis.",
      source: "ai",
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("AI picks failed:", error);
    return NextResponse.json(buildHeuristicPicks(grants, assessments));
  }
}
