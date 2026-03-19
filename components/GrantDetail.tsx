import { GrantOpportunity, GrantAssessment } from "@/lib/types";
import FitBadge from "./FitBadge";
import DeadlineBadge from "./DeadlineBadge";

interface GrantDetailProps {
  grant: GrantOpportunity;
  assessment: GrantAssessment;
  isInPipeline: boolean;
  onSaveToPipeline: () => void;
  aiSummary: string | null;
  aiSummarySource: "ai" | "heuristic" | null;
  aiSummaryLoading: boolean;
  onRequestSummary: () => void;
}

function formatAmount(min?: number, max?: number): string {
  const parts: string[] = [];
  if (min) parts.push(`$${min.toLocaleString()}`);
  if (max) parts.push(`$${max.toLocaleString()}`);
  if (parts.length === 2) return `${parts[0]} – ${parts[1]}`;
  if (parts.length === 1) return max ? `Up to ${parts[0]}` : `From ${parts[0]}`;
  return "Not specified";
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
}: GrantDetailProps) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <FitBadge label={assessment.fitLabel} score={assessment.fitScore} />
          <DeadlineBadge deadline={grant.deadline} />
        </div>
        <h2 className="text-lg font-bold text-gray-900 leading-tight">
          {grant.title}
        </h2>
        <p className="text-sm text-gray-500 mt-1">{grant.agency}</p>
      </div>

      {/* Key Facts */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-0.5">
            Funding
          </p>
          <p className="text-sm font-semibold text-gray-800">
            {formatAmount(grant.amountMin, grant.amountMax)}
          </p>
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
              : "Not specified"}
          </p>
        </div>
      </div>

      {/* Why This Fits */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-emerald-900 mb-2">
          Why This Fits Your Clinic
        </h3>
        <p className="text-sm text-emerald-800">{assessment.fitReason}</p>
        {assessment.confidenceNotes && (
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
      {assessment.riskFlags.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-amber-900 mb-2">
            Unknowns & Risk Flags
          </h3>
          <ul className="space-y-1">
            {assessment.riskFlags.map((flag, i) => (
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

      {/* Summary */}
      {grant.summary && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">
            Grant Summary
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {grant.summary.length > 500
              ? grant.summary.slice(0, 500) + "..."
              : grant.summary}
          </p>
        </div>
      )}

      {/* Eligibility */}
      {grant.eligibilityText && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">
            Eligibility
          </h3>
          <p className="text-sm text-gray-600">{grant.eligibilityText}</p>
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
