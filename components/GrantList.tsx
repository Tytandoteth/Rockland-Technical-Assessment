import { GrantOpportunity, GrantAssessment } from "@/lib/types";
import GrantCard from "./GrantCard";

interface GrantListProps {
  grants: GrantOpportunity[];
  assessments: GrantAssessment[];
  selectedGrantId: string | null;
  pipelineGrantIds: Set<string>;
  onSelectGrant: (grantId: string) => void;
  source: "grants.gov" | "fallback";
  isLoading: boolean;
  compareGrantIds?: Set<string>;
  onToggleCompare?: (grantId: string) => void;
  newGrantIds?: Set<string>;
}

export default function GrantList({
  grants,
  assessments,
  selectedGrantId,
  pipelineGrantIds,
  onSelectGrant,
  source,
  isLoading,
  compareGrantIds,
  onToggleCompare,
  newGrantIds,
}: GrantListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-full p-4 border border-rockland-gray rounded-xl bg-white animate-pulse"
          >
            {/* Badge row */}
            <div className="flex items-center gap-1.5 mb-2">
              <div className="h-5 w-16 bg-rockland-gray/50 rounded-full" />
              <div className="h-5 w-20 bg-rockland-gray/40 rounded" />
            </div>
            {/* Title */}
            <div className="h-4 w-4/5 bg-rockland-gray/50 rounded mb-1.5" />
            <div className="h-4 w-3/5 bg-rockland-gray/40 rounded mb-2" />
            {/* Agency */}
            <div className="h-3 w-2/5 bg-rockland-gray/30 rounded mb-2" />
            {/* Bottom row: deadline + amount */}
            <div className="flex items-center justify-between">
              <div className="h-5 w-24 bg-rockland-gray/40 rounded-full" />
              <div className="h-4 w-16 bg-rockland-gray/30 rounded" />
            </div>
            {/* Fit reason */}
            <div className="h-3 w-3/4 bg-rockland-gray/25 rounded mt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (grants.length === 0) {
    return (
      <div className="text-center py-12 text-rockland-navy/50">
        <p className="text-2xl mb-2">🔍</p>
        <p className="text-lg font-medium mb-1">No matching grants</p>
        <p className="text-sm">Try a different search keyword or adjust your eligibility filter above</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {source === "fallback" && (
        <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          Showing sample data — Grants.gov API is temporarily unavailable
        </div>
      )}
      <div className="space-y-3">
        {grants.map((grant) => {
          const assessment = assessments.find((a) => a.grantId === grant.id);
          if (!assessment) return null;
          return (
            <GrantCard
              key={grant.id}
              grant={grant}
              assessment={assessment}
              isSelected={selectedGrantId === grant.id}
              isInPipeline={pipelineGrantIds.has(grant.id)}
              isNew={newGrantIds?.has(grant.id) ?? false}
              onClick={() => onSelectGrant(grant.id)}
              isInCompare={compareGrantIds?.has(grant.id) ?? false}
              onToggleCompare={onToggleCompare ? () => onToggleCompare(grant.id) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
