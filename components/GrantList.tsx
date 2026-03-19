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
}

export default function GrantList({
  grants,
  assessments,
  selectedGrantId,
  pipelineGrantIds,
  onSelectGrant,
  source,
  isLoading,
}: GrantListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-32 bg-gray-100 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (grants.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg font-medium mb-1">No grants found</p>
        <p className="text-sm">Try adjusting your clinic profile focus areas</p>
      </div>
    );
  }

  return (
    <div>
      {source === "fallback" && (
        <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          Showing sample data — Grants.gov API is temporarily unavailable
        </div>
      )}
      <div className="space-y-3">
        {grants.map((grant, index) => (
          <GrantCard
            key={grant.id}
            grant={grant}
            assessment={assessments[index]}
            isSelected={selectedGrantId === grant.id}
            isInPipeline={pipelineGrantIds.has(grant.id)}
            onClick={() => onSelectGrant(grant.id)}
          />
        ))}
      </div>
    </div>
  );
}
