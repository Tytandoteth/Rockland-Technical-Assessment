import { NextRequest, NextResponse } from "next/server";

const FETCH_OPPORTUNITY_API = "https://api.grants.gov/v1/api/fetchOpportunity";

export interface EnrichedGrantDetail {
  id: string;
  description: string;
  estimatedFunding: number | null;
  awardCeiling: number | null;
  awardFloor: number | null;
  numberOfAwards: number | null;
  costSharing: boolean;
  applicantTypes: string[];
  fundingInstruments: string[];
  fundingCategories: string[];
  estimatedPostDate: string | null;
  estimatedResponseDate: string | null;
  estimatedAwardDate: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  programTitle: string | null;
  additionalEligibilityInfo: string | null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function POST(request: NextRequest) {
  let opportunityId: number;

  try {
    const body = await request.json();
    opportunityId = Number(body.opportunityId);
    if (!opportunityId || isNaN(opportunityId)) {
      return NextResponse.json({ error: "Invalid opportunityId" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const response = await fetch(FETCH_OPPORTUNITY_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opportunityId }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      throw new Error(`Grants.gov API returned ${response.status}`);
    }

    const raw = await response.json();
    const data = raw.data;

    if (!data) {
      throw new Error("No data in response");
    }

    // Data can be in 'forecast' (for forecasted) or 'synopsis' (for posted)
    const forecast = data.forecast || {};
    const synopsis = data.synopsis || {};
    const src = Object.keys(forecast).length > 0 ? forecast : synopsis;
    const cfdas = data.cfdas || [];

    const description = stripHtml(
      src.forecastDesc || src.synopsisDesc || ""
    );

    const applicantTypes = (src.applicantTypes || []).map(
      (t: { id?: string; description?: string }) => t.description || t.id || ""
    ).filter(Boolean);

    const fundingInstruments = (src.fundingInstruments || []).map(
      (f: { description?: string }) => f.description || ""
    ).filter(Boolean);

    const fundingCategories = (src.fundingActivityCategories || []).map(
      (f: { description?: string }) => f.description || ""
    ).filter(Boolean);

    const result: EnrichedGrantDetail = {
      id: String(opportunityId),
      description,
      estimatedFunding: src.estimatedFunding ? Number(src.estimatedFunding) : null,
      awardCeiling: src.awardCeiling ? Number(src.awardCeiling) : null,
      awardFloor: src.awardFloor ? Number(src.awardFloor) : null,
      numberOfAwards: src.numberOfAwards ? Number(src.numberOfAwards) : null,
      costSharing: src.costSharing === true || src.costSharing === "Yes",
      applicantTypes,
      fundingInstruments,
      fundingCategories,
      estimatedPostDate: src.estSynopsisPostingDate?.split(" 12:00:00")[0]?.split(" 00:00:00")[0] || src.estSynopsisPostingDateStr || null,
      estimatedResponseDate: src.estApplicationResponseDate?.split(" 12:00:00")[0]?.split(" 00:00:00")[0] || src.estApplicationResponseDateStr || null,
      estimatedAwardDate: src.estAwardDate?.split(" 12:00:00")[0]?.split(" 00:00:00")[0] || src.estAwardDateStr || null,
      contactName: src.agencyContactName || null,
      contactEmail: src.agencyContactEmail || null,
      contactPhone: src.agencyContactPhone || null,
      programTitle: cfdas[0]?.programTitle || null,
      additionalEligibilityInfo: src.applicantEligibilityDesc
        ? stripHtml(src.applicantEligibilityDesc)
        : null,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("fetchOpportunity failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch grant details" },
      { status: 502 }
    );
  }
}
