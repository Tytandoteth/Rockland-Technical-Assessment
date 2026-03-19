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
      className={`w-full text-left p-4 border rounded-lg transition-all hover:shadow-md ${
        isSelected
          ? "border-blue-500 bg-blue-50 shadow-md"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <FitBadge label={assessment.fitLabel} score={assessment.fitScore} />
        {isInPipeline && (
          <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
            In Pipeline
          </span>
        )}
      </div>

      <h3 className="text-sm font-semibold text-gray-900 leading-tight mb-1 line-clamp-2">
        {grant.title}
      </h3>

      <p className="text-xs text-gray-500 mb-2">{grant.agency}</p>

      <div className="flex items-center justify-between gap-2">
        <DeadlineBadge deadline={grant.deadline} />
        {(grant.amountMin || grant.amountMax) && (
          <span className="text-xs font-medium text-gray-600">
            {formatAmount(grant.amountMin, grant.amountMax)}
          </span>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-2 line-clamp-1">
        {assessment.fitReason.split(".")[0]}
      </p>
    </button>
  );
}
