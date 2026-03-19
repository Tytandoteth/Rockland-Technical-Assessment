import { NextRequest, NextResponse } from "next/server";
import { normalizeGrantsResponse } from "@/lib/normalize";
import { scoreGrant } from "@/lib/scoring";
import { DEFAULT_CLINIC_PROFILE } from "@/lib/clinic-profile";
import { FALLBACK_GRANTS } from "@/lib/fallback-grants";
import { ClinicProfile, GrantsApiResponse, GrantOpportunity, GrantAssessment } from "@/lib/types";

const GRANTS_GOV_API = "https://api.grants.gov/v1/api/search2";
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

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

async function fetchWithRetry(body: object, retries: number = MAX_RETRIES): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(GRANTS_GOV_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) return response;

      // Don't retry on 4xx client errors
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Grants.gov API returned ${response.status}`);
      }

      // Retry on 5xx server errors
      if (attempt < retries) {
        console.log(`Grants.gov returned ${response.status}, retrying in ${RETRY_DELAY_MS}ms (attempt ${attempt + 1}/${retries})`);
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
        continue;
      }

      throw new Error(`Grants.gov API returned ${response.status} after ${retries + 1} attempts`);
    } catch (error) {
      if (attempt < retries && error instanceof Error && error.name !== "AbortError") {
        console.log(`Grants.gov fetch failed, retrying in ${RETRY_DELAY_MS}ms (attempt ${attempt + 1}/${retries})`);
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Exhausted retries");
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
    // Fetch health-related grants from Grants.gov with retry
    // oppStatuses uses pipe separator, fundingCategories "HL" = Health
    const response = await fetchWithRetry({
      keyword: "community health",
      oppStatuses: "forecasted|posted",
      fundingCategories: "HL",
      rows: 50,
    });

    const data = await response.json();
    const allGrants = normalizeGrantsResponse(data);

    if (allGrants.length === 0) {
      throw new Error("Grants.gov returned no results");
    }

    // Score each grant against the clinic profile
    const allAssessments = allGrants.map((grant) => scoreGrant(grant, profile));

    // Sort by score descending, take top 25
    const relevant = allGrants.map((grant, i) => ({
      grant,
      assessment: allAssessments[i],
    }));
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
    console.error("Grants.gov API failed after retries, using fallback:", error);

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
