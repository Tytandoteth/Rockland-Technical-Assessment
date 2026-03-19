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
          <DeadlineBadge deadline={grant.deadline || enrichedDetail?.estimatedPostDate || enrichedDetail?.estimatedResponseDate || ""} />
          {enrichedLoading && (
            <span className="text-[10px] text-rockland-navy/40 flex items-center gap-1">
              <span className="inline-block w-3 h-3 border border-rockland-gray border-t-rockland-teal rounded-full animate-spin" />
              Loading details...
            </span>
          )}
        </div>
        <h2 className="text-lg font-bold text-rockland-navy leading-tight">
          {grant.title}
        </h2>
        <p className="text-sm text-rockland-navy/60 mt-1">
          {grant.agency}
          {enrichedDetail?.programTitle && (
            <span className="text-rockland-navy/40"> · {enrichedDetail.programTitle}</span>
          )}
        </p>
      </div>

      {/* Key Facts */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-rockland-cream rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-wide text-rockland-navy/40 font-semibold mb-0.5">
            Funding
          </p>
          <p className="text-sm font-semibold text-rockland-navy">
            {formatFunding(enrichedDetail, grant)}
          </p>
          {enrichedDetail?.numberOfAwards && (
            <p className="text-[10px] text-rockland-navy/40 mt-0.5">
              {enrichedDetail.numberOfAwards} expected award{enrichedDetail.numberOfAwards !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="bg-rockland-cream rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-wide text-rockland-navy/40 font-semibold mb-0.5">
            Deadline
          </p>
          <p className="text-sm font-semibold text-rockland-navy">
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
      <div className="bg-rockland-green/10 border border-rockland-green/20 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-rockland-green mb-2">
          Why This Fits Your Clinic
        </h3>
        <p className="text-sm text-rockland-navy">{assessment.fitReason}</p>
        {assessment.confidenceNotes && !enrichedDetail && (
          <p className="text-xs text-rockland-green/70 mt-2 italic">
            {assessment.confidenceNotes}
          </p>
        )}
      </div>

      {/* AI Analysis */}
      {aiSummary ? (
        <div className="bg-rockland-teal/10 border border-rockland-teal/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-rockland-teal">
              AI Grant Analysis
            </h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rockland-teal/15 text-rockland-teal font-medium">
              {aiSummarySource === "ai" ? "AI-generated" : "Heuristic"}
            </span>
          </div>
          <div className="text-sm text-rockland-navy leading-relaxed space-y-2 [&>p]:mb-2">
            {aiSummary.split("\n").map((line, i) => {
              const trimmed = line.trim();
              if (!trimmed) return null;
              // Bold headers like **Recommendation:**
              if (trimmed.startsWith("**")) {
                const match = trimmed.match(/^\*\*(.+?)\*\*\s*(.*)/);
                if (match) {
                  return (
                    <p key={i}>
                      <span className="font-semibold text-rockland-navy">{match[1]}</span>{" "}
                      <span className="text-rockland-navy/80">{match[2]}</span>
                    </p>
                  );
                }
              }
              // Bullet points
              if (trimmed.startsWith("- ")) {
                return (
                  <p key={i} className="pl-3 text-rockland-navy/80">
                    <span className="text-rockland-teal mr-1.5">&#8226;</span>
                    {trimmed.slice(2)}
                  </p>
                );
              }
              return <p key={i} className="text-rockland-navy/80">{trimmed}</p>;
            })}
          </div>
        </div>
      ) : aiSummaryLoading ? (
        <div className="bg-rockland-teal/10 border border-rockland-teal/20 rounded-lg p-5">
          <div className="flex items-center gap-3 text-sm text-rockland-teal">
            <span className="inline-block w-5 h-5 border-2 border-rockland-teal/30 border-t-rockland-teal rounded-full animate-spin" />
            <div>
              <p className="font-medium">Analyzing this grant...</p>
              <p className="text-rockland-teal/70 text-xs mt-0.5">Reviewing eligibility, funding fit, and next steps</p>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={onRequestSummary}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rockland-teal text-white text-sm font-semibold rounded-lg hover:bg-rockland-teal/90 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Get AI Analysis →
        </button>
      )}

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
      <div className="bg-rockland-navy/5 border border-rockland-navy/10 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-rockland-navy mb-1">
          Recommended Next Step
        </h3>
        <p className="text-sm text-rockland-navy/80">{assessment.recommendedAction}</p>
      </div>

      {/* Description */}
      {description && (
        <div>
          <h3 className="text-sm font-semibold text-rockland-navy mb-1">
            Grant Description
            {enrichedDetail?.description && (
              <span className="text-[10px] text-rockland-navy/40 font-normal ml-2">from Grants.gov</span>
            )}
          </h3>
          <p className="text-sm text-rockland-navy/70 leading-relaxed whitespace-pre-line">
            {description.length > 800
              ? description.slice(0, 800) + "..."
              : description}
          </p>
        </div>
      )}

      {/* Eligibility */}
      {eligibility && (
        <div>
          <h3 className="text-sm font-semibold text-rockland-navy mb-1">
            Eligibility
          </h3>
          <p className="text-sm text-rockland-navy/70">{eligibility}</p>
        </div>
      )}

      {/* Contact */}
      {enrichedDetail?.contactName && (
        <div>
          <h3 className="text-sm font-semibold text-rockland-navy mb-1">
            Agency Contact
          </h3>
          <p className="text-sm text-rockland-navy/70">
            {enrichedDetail.contactName}
            {enrichedDetail.contactEmail && (
              <> · <a href={`mailto:${enrichedDetail.contactEmail}`} className="text-rockland-teal hover:underline">{enrichedDetail.contactEmail}</a></>
            )}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {!isInPipeline ? (
          <button
            onClick={onSaveToPipeline}
            className="flex-1 px-4 py-2.5 bg-rockland-green text-white text-sm font-semibold rounded-lg hover:bg-rockland-green/90 transition-colors"
          >
            Save to Pipeline →
          </button>
        ) : (
          <div className="flex-1 px-4 py-2.5 bg-rockland-gray text-rockland-navy/50 text-sm font-semibold rounded-lg text-center">
            Already in Pipeline
          </div>
        )}
        {grant.url && (
          <a
            href={grant.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 border border-rockland-gray text-rockland-navy text-sm font-semibold rounded-lg hover:bg-rockland-cream transition-colors"
          >
            View on Grants.gov →
          </a>
        )}
      </div>
    </div>
  );
}
