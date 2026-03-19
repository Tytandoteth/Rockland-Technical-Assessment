import { NextRequest, NextResponse } from "next/server";
import { GrantOpportunity, ClinicProfile, GrantAssessment } from "@/lib/types";

interface SummarizeRequest {
  grant: GrantOpportunity;
  profile: ClinicProfile;
  assessment: GrantAssessment;
}

interface SummarizeResponse {
  summary: string;
  source: "ai" | "heuristic";
}

function buildPrompt(grant: GrantOpportunity, profile: ClinicProfile, assessment: GrantAssessment): string {
  return `You are a grant advisor for FQHC (Federally Qualified Health Center) clinics. Be direct and concise — the CFO has 10 minutes.

Clinic Profile:
- Name: ${profile.clinicName}
- Type: ${profile.clinicType} in ${profile.state}
- Focus areas: ${profile.focusAreas.join(", ")}
- Patient population: ${profile.patientPopulationNotes || "Not specified"}

Grant Opportunity:
- Title: ${grant.title}
- Agency: ${grant.agency}
- Deadline: ${grant.deadline || "Not specified"}
- Funding: ${grant.amountMax ? `Up to $${grant.amountMax.toLocaleString()}` : "Not specified"}
- Summary: ${grant.summary || "No description available"}
- Eligibility: ${grant.eligibilityText || "Not specified"}

Our heuristic scored this as ${assessment.fitLabel} Fit (${assessment.fitScore}/100).
Risk flags: ${assessment.riskFlags.length > 0 ? assessment.riskFlags.join("; ") : "None"}

In 2-3 sentences, give your recommendation: should this clinic pursue, skip, or investigate further? Include one key caveat or action item. Do not repeat the grant title.`;
}

function buildHeuristicFallback(assessment: GrantAssessment): string {
  const label = assessment.fitLabel;
  const action = assessment.recommendedAction;
  const flags = assessment.riskFlags;

  if (label === "High") {
    return `This grant is a strong match for your clinic's focus areas. ${action}. ${flags.length > 0 ? `Watch for: ${flags[0]}.` : ""}`;
  } else if (label === "Medium") {
    return `This grant has moderate relevance to your clinic. ${action}. ${flags.length > 0 ? `Key concern: ${flags[0]}.` : ""}`;
  } else {
    return `This grant has limited overlap with your clinic's priorities. ${action}. ${flags.length > 0 ? `Note: ${flags[0]}.` : ""}`;
  }
}

export async function POST(request: NextRequest) {
  let body: SummarizeRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { grant, profile, assessment } = body;

  if (!grant || !profile || !assessment) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  // If no API key, return heuristic fallback immediately
  if (!apiKey) {
    const result: SummarizeResponse = {
      summary: buildHeuristicFallback(assessment),
      source: "heuristic",
    };
    return NextResponse.json(result);
  }

  try {
    const prompt = buildPrompt(grant, profile, assessment);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(8000), // 8s timeout
    });

    if (!response.ok) {
      throw new Error(`OpenAI API returned ${response.status}`);
    }

    const data = await response.json();
    const aiSummary = data.choices?.[0]?.message?.content?.trim();

    if (!aiSummary) {
      throw new Error("Empty response from OpenAI");
    }

    const result: SummarizeResponse = {
      summary: aiSummary,
      source: "ai",
    };
    return NextResponse.json(result);
  } catch (error) {
    console.error("AI summary failed, using heuristic fallback:", error);

    // Graceful fallback to heuristic
    const result: SummarizeResponse = {
      summary: buildHeuristicFallback(assessment),
      source: "heuristic",
    };
    return NextResponse.json(result);
  }
}
