import { GrantOpportunity, GrantAssessment } from "@/lib/types";
import {
  eligibilityTierForGrant,
  eligibilityShortLabel,
  type FqhcEligibilityTier,
} from "@/lib/eligibility";
import FitBadge from "./FitBadge";
import DeadlineBadge from "./DeadlineBadge";

interface GrantComparisonProps {
  grants: GrantOpportunity[];
  assessments: GrantAssessment[];
  onSelectGrant: (id: string) => void;
  onRemoveFromCompare: (id: string) => void;
}

function formatAmount(amt?: number): string {
  if (!amt) return "—";
  return `$${amt.toLocaleString()}`;
}

const TIER_ORDER: Record<FqhcEligibilityTier, number> = {
  yes: 0,
  likely: 1,
  verify: 2,
  unlikely: 3,
};

const TIER_COLORS: Record<FqhcEligibilityTier, string> = {
  yes: "text-rockland-green",
  likely: "text-blue-600",
  verify: "text-amber-600",
  unlikely: "text-red-500",
};

export default function GrantComparison({
  grants,
  assessments,
  onSelectGrant,
  onRemoveFromCompare,
}: GrantComparisonProps) {
  if (grants.length < 2) {
    return (
      <div className="flex items-center justify-center h-[300px] text-rockland-navy/40 text-center">
        <div>
          <p className="text-2xl mb-2">⚖️</p>
          <p className="text-lg font-medium mb-1">Select grants to compare</p>
          <p className="text-sm max-w-xs">
            Toggle the &quot;Compare&quot; badge on 2–3 grants from the list to see them side by side
          </p>
        </div>
      </div>
    );
  }

  // Find best values for highlighting
  const scores = assessments.map((a) => a.fitScore);
  const bestScore = Math.max(...scores);
  const tiers = grants.map((g) => eligibilityTierForGrant(g));
  const bestTierIdx = Math.min(...tiers.map((t) => TIER_ORDER[t]));
  const riskCounts = assessments.map((a) => a.riskFlags.length);
  const fewestRisks = Math.min(...riskCounts);

  const rows: {
    label: string;
    cells: { value: React.ReactNode; isBest: boolean }[];
  }[] = [
    {
      label: "Fit Score",
      cells: assessments.map((a) => ({
        value: <FitBadge label={a.fitLabel} score={a.fitScore} />,
        isBest: a.fitScore === bestScore,
      })),
    },
    {
      label: "FQHC Eligibility",
      cells: tiers.map((tier) => ({
        value: (
          <span className={`text-sm font-medium ${TIER_COLORS[tier]}`}>
            {eligibilityShortLabel(tier)}
          </span>
        ),
        isBest: TIER_ORDER[tier] === bestTierIdx,
      })),
    },
    {
      label: "Funding",
      cells: grants.map((g) => {
        const amt = g.amountMax
          ? `Up to ${formatAmount(g.amountMax)}`
          : g.amountMin
            ? `From ${formatAmount(g.amountMin)}`
            : "Not specified";
        return { value: <span className="text-sm">{amt}</span>, isBest: false };
      }),
    },
    {
      label: "Deadline",
      cells: grants.map((g) => ({
        value: <DeadlineBadge deadline={g.deadline} />,
        isBest: false,
      })),
    },
    {
      label: "Risk Flags",
      cells: assessments.map((a, i) => ({
        value: (
          <span className="text-sm">
            {a.riskFlags.length === 0 ? (
              <span className="text-rockland-green font-medium">None</span>
            ) : (
              <span className="text-amber-600">
                {a.riskFlags.length} flag{a.riskFlags.length !== 1 ? "s" : ""}
              </span>
            )}
          </span>
        ),
        isBest: riskCounts[i] === fewestRisks,
      })),
    },
    {
      label: "Next Step",
      cells: assessments.map((a) => ({
        value: (
          <span className="text-xs text-rockland-navy/70 leading-snug">
            {a.recommendedAction}
          </span>
        ),
        isBest: false,
      })),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-rockland-navy">
          Grant Comparison
          <span className="text-rockland-navy/40 font-normal ml-1.5">
            ({grants.length})
          </span>
        </h2>
      </div>

      {/* Comparison table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="text-[10px] uppercase tracking-wide text-rockland-navy/40 font-semibold py-2 pr-4 w-28">
                &nbsp;
              </th>
              {grants.map((g) => (
                <th
                  key={g.id}
                  className="py-2 px-3 min-w-[200px] align-top"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-rockland-navy leading-tight line-clamp-2">
                      {g.title}
                    </p>
                    <p className="text-[10px] text-rockland-navy/50 truncate">
                      {g.agency}
                    </p>
                    <div className="flex gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => onSelectGrant(g.id)}
                        className="text-[10px] text-rockland-teal hover:underline font-medium"
                      >
                        View Detail
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveFromCompare(g.id)}
                        className="text-[10px] text-rockland-navy/40 hover:text-red-500 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-rockland-gray/50">
                <td className="text-[10px] uppercase tracking-wide text-rockland-navy/40 font-semibold py-3 pr-4 align-top">
                  {row.label}
                </td>
                {row.cells.map((cell, i) => (
                  <td
                    key={i}
                    className={`py-3 px-3 align-top ${
                      cell.isBest
                        ? "bg-rockland-green/5 rounded"
                        : ""
                    }`}
                  >
                    {cell.value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
