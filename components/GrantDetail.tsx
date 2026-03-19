import { GrantOpportunity, GrantAssessment } from "@/lib/types";
import FitBadge from "./FitBadge";
import DeadlineBadge from "./DeadlineBadge";

interface EnrichedDetail {
  description: string;
  estimatedFunding: number | null;
  awardCeiling: number | null;
  awardFloor: number | null;
  numberOfAwards: number | null;
  costSharing: boolean;
  applicantTypes: string[];
  estimatedPostDate: string | null;
  estimatedResponseDate: string | null;
  contactName: string | null;
  contactEmail: string | null;
  programTitle: string | null;
}

interface GrantDetailProps {
  grant: GrantOpportunity;
  assessment: GrantAssessment;
  isInPipeline: boolean;
  onSaveToPipeline: () => void;
  aiSummary: string | null;
  aiSummarySource: "ai" | "heuristic" | null;
  aiSummaryLoading: boolean;
  onRequestSummary: () => void;
  enrichedDetail: EnrichedDetail | null;
  enrichedLoading: boolean;
}

function formatAmount(min?: number, max?: number): string {
  const parts: string[] = [];
  if (min) parts.push(`$${min.toLocaleString()}`);
  if (max) parts.push(`$${max.toLocaleString()}`);
  if (parts.length === 2) return `${parts[0]} – ${parts[1]}`;
  if (parts.length === 1) return max ? `Up to ${parts[0]}` : `From ${parts[0]}`;
  return "Not specified";
}

function formatFunding(enriched: EnrichedDetail | null, grant: GrantOpportunity): string {
  if (enriched) {
    if (enriched.awardCeiling && enriched.awardFloor) {
      return `$${enriched.awardFloor.toLocaleString()} – $${enriched.awardCeiling.toLocaleString()}`;
    }
    if (enriched.awardCeiling) return `Up to $${enriched.awardCeiling.toLocaleString()}`;
    if (enriched.estimatedFunding) {
      const perAward = enriched.numberOfAwards
        ? ` (~$${Math.round(enriched.estimatedFunding / enriched.numberOfAwards).toLocaleString()}/award)`
        : "";
      return `$${enriched.estimatedFunding.toLocaleString()} total${perAward}`;
    }
  }
  return formatAmount(grant.amountMin, grant.amountMax);
}

export default function GrantDetail({
  grant,
  assessment,
  isInPipeline,
  onSaveToPipeline,
  aiSummary,
  aiSummarySource,
  aiSummaryLoading,
  onRequestSummary,
  enrichedDetail,
  enrichedLoading,
}: GrantDetailProps) {
  const description = enrichedDetail?.description || grant.summary;
  const eligibility = enrichedDetail?.applicantTypes?.length
    ? enrichedDetail.applicantTypes.join(", ")
    : grant.eligibilityText;

  // Filter out risk flags that are resolved by enriched data
  const riskFlags = enrichedDetail
    ? assessment.riskFlags.filter((flag) => {
        if (enrichedDetail.estimatedFunding && flag.includes("Funding amount not specified")) return false;
        if (enrichedDetail.description && flag.includes("Limited description available")) return false;
        if (enrichedDetail.applicantTypes?.length && flag.includes("No eligibility information")) return false;
        if ((enrichedDetail.estimatedPostDate || enrichedDetail.estimatedResponseDate) && flag.includes("No deadline information")) return false;
        return true;
      })
    : assessment.riskFlags;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <FitBadge label={assessment.fitLabel} score={assessment.fitScore} />
          <DeadlineBadge deadline={grant.deadline} />
          {enrichedLoading && (
            <span className="text-[10px] text-gray-400 flex items-center gap-1">
              <span className="inline-block w-3 h-3 border border-gray-300 border-t-gray-500 rounded-full animate-spin" />
              Loading details...
            </span>
          )}
        </div>
        <h2 className="text-lg font-bold text-gray-900 leading-tight">
          {grant.title}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {grant.agency}
          {enrichedDetail?.programTitle && (
            <span className="text-gray-400"> · {enrichedDetail.programTitle}</span>
          )}
        </p>
      </div>

      {/* Key Facts */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-0.5">
            Funding
          </p>
          <p className="text-sm font-semibold text-gray-800">
            {formatFunding(enrichedDetail, grant)}
          </p>
          {enrichedDetail?.numberOfAwards && (
            <p className="text-[10px] text-gray-400 mt-0.5">
              {enrichedDetail.numberOfAwards} expected award{enrichedDetail.numberOfAwards !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-0.5">
            Deadline
          </p>
          <p className="text-sm font-semibold text-gray-800">
            {grant.deadline
              ? new Date(grant.deadline).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              : enrichedDetail?.estimatedResponseDate
                ? `Est. ${enrichedDetail.estimatedResponseDate}`
                : enrichedDetail?.estimatedPostDate
                  ? `Posting est. ${enrichedDetail.estimatedPostDate}`
                  : "Not specified"}
          </p>
          {enrichedDetail?.costSharing && (
            <p className="text-[10px] text-amber-600 mt-0.5">Cost sharing required</p>
          )}
        </div>
      </div>

      {/* Why This Fits */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-emerald-900 mb-2">
          Why This Fits Your Clinic
        </h3>
        <p className="text-sm text-emerald-800">{assessment.fitReason}</p>
        {assessment.confidenceNotes && !enrichedDetail && (
          <p className="text-xs text-emerald-600 mt-2 italic">
            {assessment.confidenceNotes}
          </p>
        )}
      </div>

      {/* AI Summary / Second Opinion */}
      <div className="bg-violet-50 border border-violet-100 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-violet-900">
            Quick Take
          </h3>
          {aiSummarySource && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-600 font-medium">
              {aiSummarySource === "ai" ? "AI-generated" : "Heuristic"}
            </span>
          )}
        </div>
        {aiSummaryLoading ? (
          <div className="flex items-center gap-2 text-sm text-violet-600">
            <span className="inline-block w-4 h-4 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
            Generating summary...
          </div>
        ) : aiSummary ? (
          <p className="text-sm text-violet-800 leading-relaxed">{aiSummary}</p>
        ) : (
          <button
            onClick={onRequestSummary}
            className="text-sm text-violet-600 hover:text-violet-800 font-medium underline underline-offset-2"
          >
            Get AI-powered recommendation
          </button>
        )}
      </div>

      {/* Risk Flags */}
      {riskFlags.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-amber-900 mb-2">
            Unknowns & Risk Flags
          </h3>
          <ul className="space-y-1">
            {riskFlags.map((flag, i) => (
              <li
                key={i}
                className="text-sm text-amber-800 flex items-start gap-2"
              >
                <span className="text-amber-500 mt-0.5">&#9888;</span>
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Next Step */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-1">
          Recommended Next Step
        </h3>
        <p className="text-sm text-blue-800">{assessment.recommendedAction}</p>
      </div>

      {/* Description (from enriched or original) */}
      {description && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">
            Grant Description
            {enrichedDetail?.description && (
              <span className="text-[10px] text-gray-400 font-normal ml-2">from Grants.gov</span>
            )}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {description.length > 800
              ? description.slice(0, 800) + "..."
              : description}
          </p>
        </div>
      )}

      {/* Eligibility */}
      {eligibility && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">
            Eligibility
          </h3>
          <p className="text-sm text-gray-600">{eligibility}</p>
        </div>
      )}

      {/* Contact Info (from enriched) */}
      {enrichedDetail?.contactName && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">
            Agency Contact
          </h3>
          <p className="text-sm text-gray-600">
            {enrichedDetail.contactName}
            {enrichedDetail.contactEmail && (
              <> · <a href={`mailto:${enrichedDetail.contactEmail}`} className="text-blue-600 hover:underline">{enrichedDetail.contactEmail}</a></>
            )}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {!isInPipeline ? (
          <button
            onClick={onSaveToPipeline}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save to Pipeline
          </button>
        ) : (
          <div className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-500 text-sm font-semibold rounded-lg text-center">
            Already in Pipeline
          </div>
        )}
        {grant.url && (
          <a
            href={grant.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            View on Grants.gov
          </a>
        )}
      </div>
    </div>
  );
}
