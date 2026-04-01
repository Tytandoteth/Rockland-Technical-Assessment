/**
 * Eligibility Parser & Tagger
 *
 * Grants.gov uses a fixed taxonomy of ~16 applicant type IDs.
 * This module categorizes them into FQHC-relevant groups, determines
 * whether the clinic is likely eligible, and produces scannable tags.
 */

import type { GrantOpportunity } from "./types";

export interface EligibilityTag {
  label: string;
  category: "eligible" | "likely" | "verify" | "info";
  tooltip?: string;
}

export interface EligibilityAnalysis {
  tags: EligibilityTag[];
  fqhcEligible: "yes" | "likely" | "verify" | "unlikely";
  fqhcVerdict: string;
  isUnrestricted: boolean;
  hasOthersClause: boolean;
  rawTypes: string[];
}

// Grants.gov applicant type ID -> category mapping
const APPLICANT_TYPE_CATEGORIES: Record<
  string,
  { group: string; fqhcRelevant: boolean; shortLabel: string }
> = {
  "00": { group: "Government", fqhcRelevant: false, shortLabel: "State Gov" },
  "01": { group: "Government", fqhcRelevant: false, shortLabel: "County Gov" },
  "02": {
    group: "Government",
    fqhcRelevant: false,
    shortLabel: "City/Township Gov",
  },
  "04": {
    group: "Government",
    fqhcRelevant: false,
    shortLabel: "Special District",
  },
  "05": {
    group: "Education",
    fqhcRelevant: false,
    shortLabel: "School Districts",
  },
  "06": {
    group: "Education",
    fqhcRelevant: false,
    shortLabel: "Public Universities",
  },
  "20": {
    group: "Education",
    fqhcRelevant: false,
    shortLabel: "Private Universities",
  },
  "07": {
    group: "Tribal",
    fqhcRelevant: false,
    shortLabel: "Tribal Governments",
  },
  "08": {
    group: "Government",
    fqhcRelevant: false,
    shortLabel: "Housing Authorities",
  },
  "11": {
    group: "Tribal",
    fqhcRelevant: false,
    shortLabel: "Tribal Organizations",
  },
  "12": {
    group: "Nonprofit",
    fqhcRelevant: true,
    shortLabel: "501(c)(3) Nonprofits",
  },
  "13": {
    group: "Nonprofit",
    fqhcRelevant: true,
    shortLabel: "Non-501(c)(3) Nonprofits",
  },
  "22": {
    group: "For-Profit",
    fqhcRelevant: false,
    shortLabel: "For-Profit Orgs",
  },
  "23": {
    group: "For-Profit",
    fqhcRelevant: false,
    shortLabel: "Small Businesses",
  },
  "25": {
    group: "Other",
    fqhcRelevant: false,
    shortLabel: "Others (see details)",
  },
  "99": {
    group: "Unrestricted",
    fqhcRelevant: true,
    shortLabel: "Unrestricted",
  },
};

/**
 * Parse raw applicant type descriptions from Grants.gov into structured analysis.
 * Works with both the typed array (from fetchOpportunity) and the
 * comma-separated string (from eligibilityText).
 */
export function analyzeEligibility(
  applicantTypes: string[],
  grantTitle?: string,
  grantAgency?: string,
  grantDescription?: string,
  additionalEligibilityInfo?: string
): EligibilityAnalysis {
  const rawTypes = applicantTypes.filter(Boolean);

  // Try to match raw descriptions to known IDs
  const matchedIds = new Set<string>();
  const unmatchedTypes: string[] = [];

  for (const desc of rawTypes) {
    let matched = false;
    for (const [id, info] of Object.entries(APPLICANT_TYPE_CATEGORIES)) {
      if (
        desc.toLowerCase().includes(info.shortLabel.toLowerCase()) ||
        info.shortLabel.toLowerCase().includes(desc.toLowerCase().slice(0, 15))
      ) {
        matchedIds.add(id);
        matched = true;
        break;
      }
    }
    // Fallback: match by keywords
    if (!matched) {
      const lower = desc.toLowerCase();
      if (lower.includes("unrestricted")) matchedIds.add("99");
      else if (lower.includes("501(c)(3)") && lower.includes("having"))
        matchedIds.add("12");
      else if (lower.includes("501(c)(3)") && lower.includes("do not"))
        matchedIds.add("13");
      else if (lower.includes("state government")) matchedIds.add("00");
      else if (lower.includes("county")) matchedIds.add("01");
      else if (lower.includes("city") || lower.includes("township"))
        matchedIds.add("02");
      else if (lower.includes("special district")) matchedIds.add("04");
      else if (lower.includes("school district")) matchedIds.add("05");
      else if (lower.includes("public") && lower.includes("higher education"))
        matchedIds.add("06");
      else if (lower.includes("private") && lower.includes("higher education"))
        matchedIds.add("20");
      else if (lower.includes("tribal") && lower.includes("government"))
        matchedIds.add("07");
      else if (lower.includes("tribal") && lower.includes("organization"))
        matchedIds.add("11");
      else if (lower.includes("housing authorit")) matchedIds.add("08");
      else if (lower.includes("small business")) matchedIds.add("23");
      else if (lower.includes("for profit")) matchedIds.add("22");
      else if (lower.includes("others") && lower.includes("additional"))
        matchedIds.add("25");
      else unmatchedTypes.push(desc);
    }
  }

  const isUnrestricted = matchedIds.has("99");
  const hasOthersClause = matchedIds.has("25");
  const hasNonprofit501c3 = matchedIds.has("12");
  const hasNonprofitOther = matchedIds.has("13");

  // FQHC eligibility determination
  // FQHCs are almost always 501(c)(3) nonprofits or government-operated
  let fqhcEligible: EligibilityAnalysis["fqhcEligible"];
  let fqhcVerdict: string;

  // Check grant metadata + additional eligibility info for FQHC-specific signals
  const combined = [grantTitle, grantAgency, grantDescription, additionalEligibilityInfo]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const isFqhcSpecific =
    combined.includes("fqhc") ||
    combined.includes("federally qualified") ||
    combined.includes("health center program");
  const isHrsa =
    grantAgency?.toLowerCase().includes("hrsa") ||
    grantAgency?.toLowerCase().includes("health resources");

  // Parse additional eligibility text for deeper signals
  const additionalLower = (additionalEligibilityInfo || "").toLowerCase();
  const mentionsBehavioralHealth = additionalLower.includes("behavioral health");
  const mentionsNonprofit = additionalLower.includes("non-profit") || additionalLower.includes("nonprofit");
  const mentionsCommunityBased = additionalLower.includes("community-based") || additionalLower.includes("community based");
  const mentionsTribal = additionalLower.includes("tribal") || additionalLower.includes("indian health");
  const mentionsLocalGov = additionalLower.includes("local government");

  if (isFqhcSpecific) {
    fqhcEligible = "yes";
    fqhcVerdict = "This grant specifically targets FQHCs";
  } else if (isUnrestricted) {
    fqhcEligible = "yes";
    fqhcVerdict = "Open to all entity types — FQHCs are eligible";
  } else if (hasNonprofit501c3) {
    fqhcEligible = "likely";
    fqhcVerdict =
      "FQHCs typically qualify as 501(c)(3) nonprofits — confirm your specific structure";
  } else if (hasOthersClause && additionalEligibilityInfo) {
    // We have the "Others" type AND the actual additional text — analyze it
    if (mentionsBehavioralHealth && (mentionsNonprofit || mentionsCommunityBased)) {
      fqhcEligible = "likely";
      fqhcVerdict =
        "Eligible applicants include community-based behavioral health nonprofits — FQHCs with behavioral health programs likely qualify";
    } else if (mentionsNonprofit || mentionsCommunityBased) {
      fqhcEligible = "likely";
      fqhcVerdict =
        "Eligible applicants include nonprofits/community-based organizations — FQHCs likely qualify";
    } else if (mentionsTribal || mentionsLocalGov) {
      fqhcEligible = "verify";
      fqhcVerdict =
        "Eligibility may be limited to tribal/government entities — verify FQHC eligibility";
    } else {
      fqhcEligible = "verify";
      fqhcVerdict =
        "Specific eligibility requirements listed — review details below to confirm FQHC eligibility";
    }
  } else if (hasNonprofitOther || hasOthersClause) {
    fqhcEligible = "verify";
    fqhcVerdict =
      'FQHC eligibility not explicit — check "Additional Information on Eligibility" in the listing';
  } else if (rawTypes.length === 0) {
    if (isHrsa) {
      fqhcEligible = "likely";
      fqhcVerdict =
        "Eligibility details not listed, but HRSA grants typically include FQHCs";
    } else {
      fqhcEligible = "verify";
      fqhcVerdict =
        "No eligibility information available — review the full listing";
    }
  } else {
    fqhcEligible = "unlikely";
    fqhcVerdict =
      "Listed eligible types don't include nonprofits — FQHCs may not qualify";
  }

  // Build tags
  const tags: EligibilityTag[] = [];

  // FQHC status tag (always first)
  tags.push({
    label:
      fqhcEligible === "yes"
        ? "FQHC Eligible"
        : fqhcEligible === "likely"
          ? "FQHC Likely Eligible"
          : fqhcEligible === "verify"
            ? "FQHC — Verify"
            : "FQHC — Unlikely",
    category:
      fqhcEligible === "yes"
        ? "eligible"
        : fqhcEligible === "likely"
          ? "likely"
          : "verify",
    tooltip: fqhcVerdict,
  });

  // Unrestricted tag
  if (isUnrestricted) {
    tags.push({
      label: "Open to All",
      category: "eligible",
      tooltip: "Open to any type of entity",
    });
  }

  // Group matched types into summary tags
  const groups: Record<string, string[]> = {};
  for (const id of matchedIds) {
    if (id === "99" || id === "25") continue; // Already handled
    const info = APPLICANT_TYPE_CATEGORIES[id];
    if (info) {
      if (!groups[info.group]) groups[info.group] = [];
      groups[info.group].push(info.shortLabel);
    }
  }

  for (const [group, labels] of Object.entries(groups)) {
    if (group === "Nonprofit") {
      // Special handling — this is what matters for FQHCs
      tags.push({
        label:
          labels.length > 1
            ? "Nonprofits (all types)"
            : labels[0] || "Nonprofits",
        category: hasNonprofit501c3 ? "eligible" : "likely",
        tooltip: labels.join(", "),
      });
    } else {
      tags.push({
        label: labels.length > 2 ? `${group} (${labels.length} types)` : labels.join(", "),
        category: "info",
        tooltip: labels.join(", "),
      });
    }
  }

  // Others clause
  if (hasOthersClause) {
    tags.push({
      label: "See Additional Info",
      category: "verify",
      tooltip:
        'Grant listing includes "Others" clause — check Additional Information on Eligibility',
    });
  }

  // Cost sharing flag from description keywords
  if (combined.includes("cost sharing") || combined.includes("cost-sharing")) {
    tags.push({
      label: "Cost Sharing",
      category: "verify",
      tooltip: "This grant may require cost sharing or matching funds",
    });
  }

  return {
    tags,
    fqhcEligible,
    fqhcVerdict,
    isUnrestricted,
    hasOthersClause,
    rawTypes,
  };
}

/** FQHC-oriented tier from analyzeEligibility (for list filters and badges). */
export type FqhcEligibilityTier = EligibilityAnalysis["fqhcEligible"];

/** Tier using only search-hit fields (no fetchOpportunity). For list cards and filtering. */
export function eligibilityTierForGrant(grant: GrantOpportunity): FqhcEligibilityTier {
  const types = grant.eligibilityText
    ? grant.eligibilityText.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  return analyzeEligibility(
    types,
    grant.title,
    grant.agency,
    grant.summary,
    undefined
  ).fqhcEligible;
}

export function eligibilityShortLabel(tier: FqhcEligibilityTier): string {
  switch (tier) {
    case "yes":
      return "FQHC Eligible";
    case "likely":
      return "Likely";
    case "verify":
      return "Verify";
    case "unlikely":
      return "Unlikely";
  }
}
