import { NextRequest, NextResponse } from "next/server";
import type {
  ClinicProfile,
  GrantAssessment,
  GrantOpportunity,
} from "@/lib/types";
import { analyzeEligibility } from "@/lib/eligibility";

interface EnrichedBriefPayload {
  description?: string;
  applicantTypes?: string[];
  additionalEligibilityInfo?: string | null;
  programTitle?: string | null;
  estimatedPostDate?: string | null;
  estimatedResponseDate?: string | null;
  awardCeiling?: number | null;
  awardFloor?: number | null;
  estimatedFunding?: number | null;
}

interface BriefRequestBody {
  grant?: GrantOpportunity;
  assessment?: GrantAssessment;
  profile?: ClinicProfile;
  enrichedDetail?: EnrichedBriefPayload | null;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function slugifyFilename(title: string): string {
  const base = title
    .slice(0, 80)
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return (base || "grant-brief") + ".md";
}

function buildBriefMarkdown(
  grant: GrantOpportunity,
  assessment: GrantAssessment,
  profile: ClinicProfile | undefined,
  enriched: EnrichedBriefPayload | null | undefined
): string {
  const applicantTypes = enriched?.applicantTypes?.length
    ? enriched.applicantTypes
    : grant.eligibilityText
      ? grant.eligibilityText.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

  const description =
    enriched?.description || grant.summary || "_(Not available)_";

  const analysis = analyzeEligibility(
    applicantTypes,
    grant.title,
    grant.agency,
    description,
    enriched?.additionalEligibilityInfo ?? undefined
  );

  const lines: string[] = [];
  lines.push(`# Grant brief: ${grant.title}`);
  lines.push("");
  lines.push(
    `_Generated for CFO / leadership handoff — single-page snapshot._`
  );
  lines.push("");

  if (profile?.clinicName) {
    lines.push("## Clinic context");
    lines.push(
      `- **Name:** ${profile.clinicName} · **State:** ${profile.state} · **Type:** ${profile.clinicType}`
    );
    lines.push("");
  }

  lines.push("## Opportunity");
  lines.push(`- **Agency:** ${grant.agency}`);
  if (enriched?.programTitle) {
    lines.push(`- **Program:** ${enriched.programTitle}`);
  }
  lines.push(
    `- **Deadline:** ${
      grant.deadline
        ? new Date(grant.deadline).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : enriched?.estimatedResponseDate
          ? `Est. response ${enriched.estimatedResponseDate}`
          : enriched?.estimatedPostDate
            ? `Posting est. ${enriched.estimatedPostDate}`
            : "Not specified"
    }`
  );
  if (grant.url) {
    lines.push(`- **Grants.gov:** ${grant.url}`);
  }
  lines.push(`- **Opportunity ID:** ${grant.id}`);
  lines.push("");

  lines.push("## Fit assessment");
  lines.push(
    `- **Score:** ${assessment.fitScore} (${assessment.fitLabel}) · **Scoring basis:** ${assessment.scoringSource === "enriched" ? "Enriched listing" : "Search preview"}`
  );
  lines.push(`- **Why it fits:** ${assessment.fitReason}`);
  if (assessment.confidenceNotes) {
    lines.push(`- **Confidence:** ${assessment.confidenceNotes}`);
  }
  lines.push("");

  lines.push("## FQHC eligibility signal");
  lines.push(`- **Tier:** ${analysis.fqhcEligible}`);
  lines.push(`- **Summary:** ${analysis.fqhcVerdict}`);
  lines.push("");

  if (assessment.riskFlags.length > 0) {
    lines.push("## Unknowns & risk flags");
    for (const flag of assessment.riskFlags) {
      lines.push(`- ${flag}`);
    }
    lines.push("");
  }

  lines.push("## Recommended next step");
  lines.push(assessment.recommendedAction);
  lines.push("");

  lines.push("## Funding (best available)");
  if (enriched?.awardCeiling || enriched?.awardFloor) {
    lines.push(
      `- **Range:** $${(enriched.awardFloor ?? 0).toLocaleString()} – $${(enriched.awardCeiling ?? 0).toLocaleString()}`
    );
  } else if (enriched?.estimatedFunding) {
    lines.push(`- **Estimated total:** $${enriched.estimatedFunding.toLocaleString()}`);
  } else if (grant.amountMin || grant.amountMax) {
    lines.push(
      `- **Range (search):** ${grant.amountMin != null ? `$${grant.amountMin.toLocaleString()}` : "?"} – ${grant.amountMax != null ? `$${grant.amountMax.toLocaleString()}` : "?"}`
    );
  } else {
    lines.push("- _(Not specified in available data)_");
  }
  lines.push("");

  lines.push("---");
  lines.push(
    `_Rockland Grant Discovery · local-first; verify all requirements on Grants.gov._`
  );

  return lines.join("\n");
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isRecord(raw)) {
    return NextResponse.json({ error: "Expected JSON object" }, { status: 400 });
  }

  const body = raw as BriefRequestBody;
  const grant = body.grant;
  const assessment = body.assessment;

  if (
    !grant ||
    typeof grant.id !== "string" ||
    typeof grant.title !== "string" ||
    typeof grant.agency !== "string"
  ) {
    return NextResponse.json(
      { error: "Missing or invalid grant" },
      { status: 400 }
    );
  }

  if (
    !assessment ||
    typeof assessment.grantId !== "string" ||
    typeof assessment.fitScore !== "number" ||
    typeof assessment.fitLabel !== "string" ||
    typeof assessment.fitReason !== "string" ||
    typeof assessment.recommendedAction !== "string" ||
    !Array.isArray(assessment.riskFlags)
  ) {
    return NextResponse.json(
      { error: "Missing or invalid assessment" },
      { status: 400 }
    );
  }

  const markdown = buildBriefMarkdown(
    grant,
    assessment,
    body.profile,
    body.enrichedDetail ?? null
  );

  const filename = slugifyFilename(grant.title);

  return NextResponse.json({
    markdown,
    filename,
  });
}
