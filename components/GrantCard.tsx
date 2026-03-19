import { GrantOpportunity, GrantAssessment } from "@/lib/types";
import FitBadge from "./FitBadge";
import DeadlineBadge from "./DeadlineBadge";

interface GrantCardProps {
  grant: GrantOpportunity;
  assessment: GrantAssessment;
  isSelected: boolean;
  isInPipeline: boolean;
  onClick: () => void;
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
  onClick,
}: GrantCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 border rounded-xl transition-all hover:shadow-md ${
        isSelected
          ? "border-rockland-teal bg-rockland-teal/5 shadow-md"
          : "border-rockland-gray bg-white hover:border-rockland-teal/40"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <FitBadge label={assessment.fitLabel} score={assessment.fitScore} />
        {isInPipeline && (
          <span className="text-[10px] px-1.5 py-0.5 bg-rockland-teal/15 text-rockland-teal rounded font-medium">
            In Pipeline
          </span>
        )}
      </div>

      <h3 className="text-sm font-semibold text-rockland-navy leading-tight mb-1 line-clamp-2">
        {grant.title}
      </h3>

      <p className="text-xs text-rockland-navy/60 mb-2">{grant.agency}</p>

      <div className="flex items-center justify-between gap-2">
        <DeadlineBadge deadline={grant.deadline} />
        {(grant.amountMin || grant.amountMax) && (
          <span className="text-xs font-medium text-rockland-navy/70">
            {formatAmount(grant.amountMin, grant.amountMax)}
          </span>
        )}
      </div>

      <p className="text-xs text-rockland-navy/50 mt-2 line-clamp-1">
        {assessment.fitReason.split(".")[0]}
      </p>
    </button>
  );
}
