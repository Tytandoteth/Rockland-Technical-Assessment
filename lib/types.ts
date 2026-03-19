export interface ClinicProfile {
  id: string;
  clinicName: string;
  state: string;
  clinicType: string;
  focusAreas: string[];
  patientPopulationNotes?: string;
  orgSizeBand?: string;
}

export interface GrantOpportunity {
  id: string;
  title: string;
  agency: string;
  deadline: string;
  amountMin?: number;
  amountMax?: number;
  eligibilityText?: string;
  summary?: string;
  url?: string;
  source: "grants.gov" | "fallback";
  rawTags?: string[];
}

export interface GrantAssessment {
  grantId: string;
  fitScore: number;
  fitLabel: "High" | "Medium" | "Low";
  fitReason: string;
  riskFlags: string[];
  recommendedAction: string;
  confidenceNotes?: string;
}

export interface PipelineItem {
  id: string;
  grantId: string;
  grantTitle: string;
  grantDeadline?: string;
  grantUrl?: string;
  status: "To Review" | "Interested" | "Applying" | "Submitted";
  nextStep?: string;
  note?: string;
  savedAt: string;
}

export interface GrantsApiResponse {
  grants: GrantOpportunity[];
  assessments: GrantAssessment[];
  source: "grants.gov" | "fallback";
  totalResults: number;
}
