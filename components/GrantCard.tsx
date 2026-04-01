import { GrantOpportunity, GrantAssessment } from "@/lib/types";
import { formatAgencyDisplay } from "@/lib/agencyDisplay";
import {
  eligibilityTierForGrant,
  eligibilityShortLabel,
  type FqhcEligibilityTier,
} from "@/lib/eligibility";
import { estimateEffort } from "@/lib/effort";
import FitBadge from "./FitBadge";
import DeadlineBadge from "./DeadlineBadge";

const ELIGIBILITY_BADGE: Record<
  FqhcEligibilityTier,
  string
> = {
  yes: "bg-emerald-100 text-emerald-800 border-emerald-200",
  likely: "bg-blue-100 text-blue-800 border-blue-200",
  verify: "bg-amber-100 text-amber-800 border-amber-200",
  unlikely: "bg-red-100 text-red-800 border-red-200",
};

interface GrantCardProps {
  grant: GrantOpportunity;
  assessment: GrantAssessment;
  isSelected: boolean;
  isInPipeline: boolean;
  isNew?: boolean;
  onClick: () => void;
  isInCompare?: boolean;
  onToggleCompare?: () => void;
}

function formatAmount(min?: number, max?: number): string {
  if (max) {
    const formatted = max >= 1000000
      ? `$${(max / 1000000).toFixed(1)}M`
      : `$${(max / 1000).toFixed(0)}K`;
    return `Up to ${formatted}`;
  }
  if (min) {
    return `From $${(min / 1000).toFixed(0)}K`;
  }
  return "";
}

export default function GrantCard({
  grant,
  assessment,
  isSelected,
  isInPipeline,
  isNew,
  onClick,
  isInCompare,
  onToggleCompare,
}: GrantCardProps) {
  const agency = formatAgencyDisplay(grant.agency);
  const eligTier = eligibilityTierForGrant(grant);
  const effort = estimateEffort(grant);
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 border rounded-xl transition-all hover:shadow-md ${
        isSelected
          ? "border-rockland-teal bg-rockland-teal/5 shadow-md"
          : "border-rockland-gray bg-white hover:border-rockland-teal/40"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <FitBadge label={assessment.fitLabel} score={assessment.fitScore} />
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${ELIGIBILITY_BADGE[eligTier]}`}
            title={`Eligibility signal from title/agency/listing (open grant for full analysis)`}
          >
            {eligibilityShortLabel(eligTier)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {isNew && (
            <span className="text-[10px] px-1.5 py-0.5 bg-rockland-green/15 text-rockland-green rounded font-semibold animate-fade-in">
              New
            </span>
          )}
          {isInPipeline && (
            <span className="text-[10px] px-1.5 py-0.5 bg-rockland-teal/15 text-rockland-teal rounded font-medium">
              In Pipeline
            </span>
          )}
          {onToggleCompare && (
            <span
              role="checkbox"
              aria-checked={isInCompare}
              aria-label={isInCompare ? "Remove from comparison" : "Add to comparison"}
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onToggleCompare();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  e.preventDefault();
                  onToggleCompare();
                }
              }}
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium border cursor-pointer transition-colors ${
                isInCompare
                  ? "bg-rockland-green/15 text-rockland-green border-rockland-green/30"
                  : "text-rockland-navy/35 border-rockland-gray hover:text-rockland-navy/60 hover:border-rockland-navy/30"
              }`}
            >
              {isInCompare ? "Comparing" : "Compare"}
            </span>
          )}
        </div>
      </div>

      <h3 className="text-sm font-semibold text-rockland-navy leading-tight mb-1 line-clamp-2">
        {grant.title}
      </h3>

      <p
        className="text-xs text-rockland-navy/60 mb-2 truncate"
        title={agency.title}
      >
        {agency.label}
      </p>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <DeadlineBadge deadline={grant.deadline} />
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${
              effort.level === "low"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : effort.level === "moderate"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-red-50 text-red-700 border-red-200"
            }`}
            title={`${effort.hours} — ${effort.reason}`}
          >
            {effort.label}
          </span>
        </div>
        {(grant.amountMin || grant.amountMax) && (
          <span className="text-xs font-medium text-rockland-navy/70">
            {formatAmount(grant.amountMin, grant.amountMax)}
          </span>
        )}
      </div>

      <p className="text-xs text-rockland-navy/50 mt-2 line-clamp-1" title={assessment.fitReason}>
        {assessment.fitReason.split(".")[0]}
      </p>
    </button>
  );
}
