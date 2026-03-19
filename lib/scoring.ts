import { ClinicProfile, GrantOpportunity, GrantAssessment } from "./types";

const FQHC_CORE_KEYWORDS = [
  "health center",
  "community health",
  "primary care",
  "fqhc",
  "federally qualified",
  "safety net",
  "safety-net",
  "health clinic",
  "health program",
  "health services",
  "health care",
  "healthcare",
];

const PRIORITY_AGENCIES = [
  "hrsa",
  "health resources",
  "samhsa",
  "substance abuse and mental health",
  "cdc",
  "centers for disease control",
  "cms",
  "centers for medicare",
  "acf",
  "administration for children",
];

const POPULATION_KEYWORDS = [
  "underserved",
  "uninsured",
  "low-income",
  "low income",
  "medicaid",
  "rural",
  "vulnerable",
  "minority",
  "health equity",
  "health disparities",
  "maternal",
  "pediatric",
  "chronic disease",
  "substance abuse",
  "opioid",
  "mental health",
  "behavioral health",
];

const ELIGIBLE_ORG_SIGNALS = [
  "nonprofit",
  "non-profit",
  "501(c)",
  "community-based",
  "community based",
  "public health",
  "local government",
  "state government",
  "tribal",
  "health department",
];

// International/foreign grant signals — these are irrelevant to domestic FQHCs
const INTERNATIONAL_KEYWORDS = [
  "ukraine",
  "india",
  "uganda",
  "botswana",
  "nigeria",
  "kenya",
  "tanzania",
  "mozambique",
  "zambia",
  "pepfar",
  "africa",
  "asia",
  "international",
  "foreign",
  "global health",
  "president's emergency plan",
];

function countKeywordMatches(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.filter((k) => lower.includes(k)).length;
}

function getMatchedKeywords(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase();
  return keywords.filter((k) => lower.includes(k));
}

function daysUntilDeadline(deadline: string): number | null {
  if (!deadline) return null;
  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate.getTime())) return null;
  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function scoreGrant(
  grant: GrantOpportunity,
  profile: ClinicProfile,
  extraKeywords?: string[]
): GrantAssessment {
  const searchText = [
    grant.title,
    grant.summary || "",
    grant.eligibilityText || "",
    ...(grant.rawTags || []),
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;
  const reasons: string[] = [];
  const riskFlags: string[] = [];

  // 0. International grant penalty — these are irrelevant to domestic FQHCs
  const intlMatches = getMatchedKeywords(searchText, INTERNATIONAL_KEYWORDS);
  if (intlMatches.length > 0) {
    score -= 50;
    riskFlags.push(`International/foreign grant (${intlMatches[0]}) — likely not applicable to domestic FQHCs`);
  }

  // 1. Focus area keyword overlap (up to 40 pts)
  const focusMatches = profile.focusAreas.filter((area) =>
    searchText.includes(area.toLowerCase())
  );
  const focusScore = Math.min(40, focusMatches.length * 15);
  score += focusScore;
  if (focusMatches.length > 0) {
    reasons.push(
      `Matches clinic focus areas: ${focusMatches.join(", ")}`
    );
  }

  // 2. FQHC/community health signals (up to 25 pts)
  const coreMatches = countKeywordMatches(searchText, FQHC_CORE_KEYWORDS);
  const coreScore = Math.min(25, coreMatches * 10);
  score += coreScore;
  if (coreMatches > 0) {
    reasons.push("Directly relevant to FQHCs/community health centers");
  }

  // 3. Population/topic relevance (up to 20 pts)
  const popMatches = getMatchedKeywords(searchText, POPULATION_KEYWORDS);
  const popScore = Math.min(20, popMatches.length * 7);
  score += popScore;
  if (popMatches.length > 0) {
    reasons.push(
      `Targets relevant populations: ${popMatches.slice(0, 3).join(", ")}`
    );
  }

  // 3b. AI-enhanced keyword matching (up to 15 pts bonus)
  if (extraKeywords && extraKeywords.length > 0) {
    const extraMatches = getMatchedKeywords(searchText, extraKeywords);
    const extraScore = Math.min(15, extraMatches.length * 5);
    score += extraScore;
    if (extraMatches.length > 0 && focusMatches.length === 0) {
      reasons.push(
        `Matches clinic profile keywords: ${extraMatches.slice(0, 3).join(", ")}`
      );
    }
  }

  // 4. Eligibility signals (up to 10 pts)
  const eligMatches = countKeywordMatches(searchText, ELIGIBLE_ORG_SIGNALS);
  const eligScore = Math.min(10, eligMatches * 5);
  score += eligScore;
  if (eligMatches === 0 && !grant.eligibilityText) {
    riskFlags.push("No eligibility information available — verify on Grants.gov");
  }

  // 5. Agency relevance bonus (up to 15 pts)
  const agencyLower = grant.agency.toLowerCase();
  const agencyMatch = PRIORITY_AGENCIES.some((a) => agencyLower.includes(a));
  if (agencyMatch) {
    score += 15;
    reasons.push(`From ${grant.agency} — a key agency for FQHCs`);
  }

  // 6. Deadline proximity (up to 10 pts)
  const daysLeft = daysUntilDeadline(grant.deadline);
  if (daysLeft !== null) {
    if (daysLeft < 0) {
      riskFlags.push("Deadline has passed");
      score = Math.max(0, score - 20);
    } else if (daysLeft <= 7) {
      score += 0;
      riskFlags.push(`Deadline in ${daysLeft} day${daysLeft === 1 ? "" : "s"} — may be too tight`);
    } else if (daysLeft <= 30) {
      score += 5;
      riskFlags.push(`Deadline in ${daysLeft} days — act soon`);
    } else {
      score += 10;
    }
  } else {
    riskFlags.push("No deadline information available");
  }

  // Additional risk flags
  if (!grant.summary && !grant.eligibilityText) {
    riskFlags.push("Limited description available — review full listing on Grants.gov");
  }

  if (grant.amountMax && grant.amountMax > 5000000) {
    riskFlags.push("Large grant — may require significant matching funds or capacity");
  }

  if (!grant.amountMin && !grant.amountMax) {
    riskFlags.push("Funding amount not specified");
  }

  // Clamp score
  score = Math.min(100, Math.max(0, score));

  // Determine label — adjusted thresholds for realistic score distribution
  let fitLabel: "High" | "Medium" | "Low";
  if (score >= 50) fitLabel = "High";
  else if (score >= 25) fitLabel = "Medium";
  else fitLabel = "Low";

  // Build fit reason
  const fitReason =
    reasons.length > 0
      ? reasons.join(". ") + "."
      : "Limited keyword overlap with clinic profile — review manually.";

  // Recommended action
  let recommendedAction: string;
  if (fitLabel === "High") {
    if (daysLeft !== null && daysLeft <= 14) {
      recommendedAction = "High priority — review eligibility requirements immediately";
    } else {
      recommendedAction = "Strong fit — add to pipeline and review eligibility this week";
    }
  } else if (fitLabel === "Medium") {
    recommendedAction = "Worth a closer look — check full listing for eligibility details";
  } else {
    recommendedAction = "Low match — skip unless specific program details change the picture";
  }

  // Confidence notes
  const confidenceNotes =
    !grant.summary && !grant.eligibilityText
      ? "Score based on title and agency only — confidence is low"
      : undefined;

  return {
    grantId: grant.id,
    fitScore: score,
    fitLabel,
    fitReason,
    riskFlags,
    recommendedAction,
    confidenceNotes,
  };
}
