import { GrantOpportunity } from "./types";

export type EffortLevel = "low" | "moderate" | "high";

interface EffortEstimate {
  level: EffortLevel;
  label: string;
  hours: string;
  reason: string;
}

const HIGH_EFFORT_AGENCIES = ["nih", "nsf", "national institutes", "national science"];
const LOW_EFFORT_AGENCIES = ["hrsa", "samhsa"];

const HIGH_EFFORT_KEYWORDS = [
  "r01", "r21", "r61", "r33", "p30", "u01", "clinical trial",
  "research", "cooperative agreement",
];
const LOW_EFFORT_KEYWORDS = [
  "planning", "technical assistance", "supplement", "continuation",
  "letter of intent", "loi",
];

export function estimateEffort(grant: GrantOpportunity): EffortEstimate {
  const title = grant.title.toLowerCase();
  const agency = grant.agency.toLowerCase();
  const amount = grant.amountMax || grant.amountMin || 0;

  let score = 0; // higher = more effort

  // Agency signals
  if (HIGH_EFFORT_AGENCIES.some((a) => agency.includes(a))) score += 2;
  if (LOW_EFFORT_AGENCIES.some((a) => agency.includes(a))) score -= 1;

  // Title/type signals
  if (HIGH_EFFORT_KEYWORDS.some((kw) => title.includes(kw))) score += 2;
  if (LOW_EFFORT_KEYWORDS.some((kw) => title.includes(kw))) score -= 2;

  // Funding size signals
  if (amount > 5_000_000) score += 2;
  else if (amount > 1_000_000) score += 1;
  else if (amount > 0 && amount < 200_000) score -= 1;

  if (score >= 3) {
    return {
      level: "high",
      label: "High Effort",
      hours: "80–200+ hrs",
      reason: buildReason(grant, "high"),
    };
  }
  if (score <= -1) {
    return {
      level: "low",
      label: "Low Effort",
      hours: "10–30 hrs",
      reason: buildReason(grant, "low"),
    };
  }
  return {
    level: "moderate",
    label: "Moderate Effort",
    hours: "30–80 hrs",
    reason: buildReason(grant, "moderate"),
  };
}

function buildReason(grant: GrantOpportunity, level: EffortLevel): string {
  const title = grant.title.toLowerCase();
  const agency = grant.agency.toLowerCase();

  if (level === "high") {
    const parts: string[] = [];
    if (HIGH_EFFORT_KEYWORDS.some((kw) => title.includes(kw)))
      parts.push("research-style application");
    if (HIGH_EFFORT_AGENCIES.some((a) => agency.includes(a)))
      parts.push("NIH/NSF-level review process");
    if ((grant.amountMax || 0) > 5_000_000) parts.push("large award size");
    return parts.length > 0
      ? `Likely requires ${parts.join(", ")}`
      : "Complex application based on grant characteristics";
  }
  if (level === "low") {
    const parts: string[] = [];
    if (LOW_EFFORT_KEYWORDS.some((kw) => title.includes(kw)))
      parts.push("streamlined application type");
    if (LOW_EFFORT_AGENCIES.some((a) => agency.includes(a)))
      parts.push("HRSA/SAMHSA standard process");
    return parts.length > 0
      ? `Typically ${parts.join(", ")}`
      : "Straightforward application expected";
  }
  return "Standard federal grant application process";
}
