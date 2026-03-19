import { NextRequest, NextResponse } from "next/server";
import { GrantOpportunity, ClinicProfile, GrantAssessment } from "@/lib/types";

interface EnrichedDetail {
  description?: string;
  estimatedFunding?: number | null;
  awardCeiling?: number | null;
  numberOfAwards?: number | null;
  costSharing?: boolean;
  applicantTypes?: string[];
  estimatedPostDate?: string | null;
  estimatedResponseDate?: string | null;
  programTitle?: string | null;
}

interface SummarizeRequest {
  grant: GrantOpportunity;
  profile: ClinicProfile;
  assessment: GrantAssessment;
  enrichedDetail?: EnrichedDetail | null;
}

interface SummarizeResponse {
  summary: string;
  source: "ai" | "heuristic";
}

function buildPrompt(
  grant: GrantOpportunity,
  profile: ClinicProfile,
  assessment: GrantAssessment,
  enriched?: EnrichedDetail | null
): string {
  const fundingInfo = enriched?.estimatedFunding
    ? `$${enriched.estimatedFunding.toLocaleString()} total${enriched.numberOfAwards ? ` across ~${enriched.numberOfAwards} awards` : ""}`
    : grant.amountMax
      ? `Up to $${grant.amountMax.toLocaleString()}`
      : "Not specified";

  const description = enriched?.description || grant.summary || "No description available";
  const eligibility = enriched?.applicantTypes?.length
    ? enriched.applicantTypes.join(", ")
    : grant.eligibilityText || "Not specified";

  return `You are a senior grant advisor for FQHC (Federally Qualified Health Center) clinics. Provide a detailed but scannable analysis. The CFO is smart but time-constrained.

CLINIC PROFILE:
- Name: ${profile.clinicName}
- Type: ${profile.clinicType} in ${profile.state}
- Size: ${profile.orgSizeBand || "Not specified"}
- Focus areas: ${profile.focusAreas.join(", ")}
- Patient population: ${profile.patientPopulationNotes || "Not specified"}

GRANT OPPORTUNITY:
- Title: ${grant.title}
- Agency: ${grant.agency}${enriched?.programTitle ? ` — ${enriched.programTitle}` : ""}
- Funding: ${fundingInfo}${enriched?.costSharing ? " (cost sharing required)" : ""}
- Deadline: ${grant.deadline || enriched?.estimatedPostDate || enriched?.estimatedResponseDate || "Not specified"}
- Eligibility: ${eligibility}
- Description: ${description.slice(0, 1500)}

HEURISTIC ASSESSMENT: ${assessment.fitLabel} Fit (${assessment.fitScore}/100)
${assessment.riskFlags.length > 0 ? `Risk flags: ${assessment.riskFlags.join("; ")}` : "No risk flags identified"}

Provide your analysis in this exact format:

**Recommendation:** [PURSUE / INVESTIGATE / SKIP] — [one sentence why]

**Fit Analysis:** [2-3 sentences on how this grant aligns with the clinic's focus areas, patient population, and capabilities]

**Key Eligibility Considerations:** [1-2 sentences on whether this clinic type is likely eligible and any requirements to verify]

**Funding Assessment:** [1 sentence on whether the funding amount and structure make sense for this clinic's size]

**Next Steps:** [2-3 specific, actionable bullet points the CFO should take this week if pursuing]

Be direct. Use plain language. Flag unknowns honestly.`;
}

function buildHeuristicFallback(
  assessment: GrantAssessment,
  grant: GrantOpportunity
): string {
  const label = assessment.fitLabel;
  const rec = label === "High" ? "PURSUE" : label === "Medium" ? "INVESTIGATE" : "SKIP";

  return `**Recommendation:** ${rec} — ${assessment.recommendedAction}

**Fit Analysis:** ${assessment.fitReason}

**Key Eligibility Considerations:** ${grant.eligibilityText || "Eligibility details not available — verify on Grants.gov before investing time."}

**Funding Assessment:** ${grant.amountMax ? `Funding up to $${grant.amountMax.toLocaleString()} — review the full listing for match requirements.` : "Funding amount not specified — check the full listing."}

**Next Steps:**
- Review the full opportunity listing on Grants.gov
- Confirm your organization meets eligibility requirements
- ${label === "High" ? "Begin preparing application materials" : "Assess whether this aligns with current strategic priorities"}`;
}

export async function POST(request: NextRequest) {
  let body: SummarizeRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { grant, profile, assessment, enrichedDetail } = body;

  if (!grant || !profile || !assessment) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    const result: SummarizeResponse = {
      summary: buildHeuristicFallback(assessment, grant),
      source: "heuristic",
    };
    return NextResponse.json(result);
  }

  try {
    const prompt = buildPrompt(grant, profile, assessment, enrichedDetail);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 600,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(12000),
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

    const result: SummarizeResponse = {
      summary: buildHeuristicFallback(assessment, grant),
      source: "heuristic",
    };
    return NextResponse.json(result);
  }
}
