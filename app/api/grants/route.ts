import { NextRequest, NextResponse } from "next/server";
import { normalizeGrantsResponse } from "@/lib/normalize";
import { scoreGrant } from "@/lib/scoring";
import { DEFAULT_CLINIC_PROFILE } from "@/lib/clinic-profile";
import { FALLBACK_GRANTS } from "@/lib/fallback-grants";
import { ClinicProfile, GrantsApiResponse, GrantOpportunity, GrantAssessment } from "@/lib/types";

const GRANTS_GOV_API = "https://api.grants.gov/v1/api/search2";

function sortByFitScore(
  grants: GrantOpportunity[],
  assessments: GrantAssessment[]
): { grants: GrantOpportunity[]; assessments: GrantAssessment[] } {
  const indices = assessments
    .map((a, i) => ({ score: a.fitScore, index: i }))
    .sort((a, b) => b.score - a.score);

  return {
    grants: indices.map((s) => grants[s.index]),
    assessments: indices.map((s) => assessments[s.index]),
  };
}

export async function POST(request: NextRequest) {
  let profile: ClinicProfile = DEFAULT_CLINIC_PROFILE;

  try {
    const body = await request.json();
    if (body.profile) {
      profile = body.profile;
    }
  } catch {
    // Use defaults if no body
  }

  try {
    // Fetch health-related grants from Grants.gov
    // oppStatuses uses pipe separator, fundingCategories "HL" = Health
    const response = await fetch(GRANTS_GOV_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyword: "community health",
        oppStatuses: "forecasted|posted",
        fundingCategories: "HL",
        rows: 50,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Grants.gov API returned ${response.status}`);
    }

    const data = await response.json();
    const allGrants = normalizeGrantsResponse(data);

    if (allGrants.length === 0) {
      throw new Error("Grants.gov returned no results");
    }

    // Score each grant against the clinic profile
    const allAssessments = allGrants.map((grant) => scoreGrant(grant, profile));

    // Only show grants with some relevance (score > 0), sorted by fit
    const relevant: { grant: GrantOpportunity; assessment: GrantAssessment }[] = [];
    for (let i = 0; i < allGrants.length; i++) {
      relevant.push({ grant: allGrants[i], assessment: allAssessments[i] });
    }

    // Sort by score descending, take top 25
    relevant.sort((a, b) => b.assessment.fitScore - a.assessment.fitScore);
    const top = relevant.slice(0, 25);

    const result: GrantsApiResponse = {
      grants: top.map((r) => r.grant),
      assessments: top.map((r) => r.assessment),
      source: "grants.gov",
      totalResults: top.length,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Grants.gov API failed, using fallback:", error);

    // Fallback to local data
    const assessments = FALLBACK_GRANTS.map((grant) =>
      scoreGrant(grant, profile)
    );
    const sorted = sortByFitScore([...FALLBACK_GRANTS], assessments);

    const result: GrantsApiResponse = {
      grants: sorted.grants,
      assessments: sorted.assessments,
      source: "fallback",
      totalResults: sorted.grants.length,
    };

    return NextResponse.json(result);
  }
}
