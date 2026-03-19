import { GrantOpportunity } from "./types";

// Grants.gov v1 search2 hit shape (actual observed fields)
interface GrantsGovHit {
  id?: string | number;
  number?: string;
  title?: string;
  agencyCode?: string;
  agency?: string;
  openDate?: string;
  closeDate?: string;
  oppStatus?: string;
  docType?: string;
  cfdaList?: string[];
  awardCeiling?: number;
  awardFloor?: number;
  synopsis?: {
    synopsisDesc?: string;
    applicantTypes?: string[];
    fundingActivityCategories?: string[];
  };
}

export interface GrantsGovSearchResponse {
  errorcode?: number;
  msg?: string;
  data?: {
    hitCount?: number;
    oppHits?: GrantsGovHit[];
  };
}

/**
 * Decode common HTML entities that appear in Grants.gov data
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/**
 * Parse Grants.gov date format (MM/DD/YYYY) to ISO string (YYYY-MM-DD)
 */
function parseGrantDate(dateStr: string): string {
  if (!dateStr) return "";
  // Handle MM/DD/YYYY format
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
  }
  // Already ISO or some other format
  return dateStr;
}

export function normalizeGrant(hit: GrantsGovHit): GrantOpportunity {
  const id = String(hit.id || hit.number || Math.random().toString(36).slice(2));
  const oppNumber = hit.number || "";

  return {
    id,
    title: decodeHtmlEntities(hit.title || "Untitled Opportunity"),
    agency: decodeHtmlEntities(hit.agency || hit.agencyCode || "Unknown Agency"),
    deadline: parseGrantDate(hit.closeDate || ""),
    amountMin: hit.awardFloor || undefined,
    amountMax: hit.awardCeiling || undefined,
    eligibilityText: hit.synopsis?.applicantTypes?.join(", ") || undefined,
    summary: hit.synopsis?.synopsisDesc || undefined,
    url: oppNumber
      ? `https://www.grants.gov/search-results-detail/${oppNumber}`
      : undefined,
    source: "grants.gov",
    rawTags: hit.synopsis?.fundingActivityCategories || hit.cfdaList || undefined,
  };
}

export function normalizeGrantsResponse(
  response: GrantsGovSearchResponse
): GrantOpportunity[] {
  const hits = response.data?.oppHits || [];
  return hits.map(normalizeGrant);
}
