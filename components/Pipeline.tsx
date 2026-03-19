"use client";

import { PipelineItem } from "@/lib/types";
import DeadlineBadge from "./DeadlineBadge";

interface PipelineProps {
  items: PipelineItem[];
  onUpdateStatus: (grantId: string, status: PipelineItem["status"]) => void;
  onRemove: (grantId: string) => void;
  onSelectGrant: (grantId: string) => void;
}

const STATUSES: PipelineItem["status"][] = [
  "To Review",
  "Interested",
  "Applying",
  "Submitted",
];

const STATUS_COLORS: Record<PipelineItem["status"], string> = {
  "To Review": "bg-rockland-gray text-rockland-navy border-rockland-gray",
  Interested: "bg-rockland-teal/20 text-rockland-teal border-rockland-teal/30",
  Applying: "bg-rockland-navy/10 text-rockland-navy border-rockland-navy/20",
  Submitted: "bg-rockland-green/20 text-rockland-green border-rockland-green/30",
};

export default function Pipeline({
  items,
  onUpdateStatus,
  onRemove,
  onSelectGrant,
}: PipelineProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-rockland-navy/40">
        <p className="text-sm font-medium">No grants saved yet</p>
        <p className="text-xs mt-1">
          Save grants from the list to track your pipeline
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-white border border-rockland-gray rounded-xl p-3 hover:border-rockland-teal/30 transition-colors"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <button
              onClick={() => onSelectGrant(item.grantId)}
              className="text-sm font-medium text-rockland-navy hover:text-rockland-teal text-left leading-tight line-clamp-2"
            >
              {item.grantTitle}
            </button>
            <button
              onClick={() => onRemove(item.grantId)}
              className="text-gray-400 hover:text-red-500 text-xs shrink-0"
              title="Remove from pipeline"
            >
              &#10005;
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => onUpdateStatus(item.grantId, status)}
                className={`px-2 py-0.5 text-[11px] font-medium rounded-full border transition-all ${
                  item.status === status
                    ? STATUS_COLORS[status]
                    : "bg-white text-rockland-navy/40 border-rockland-gray/50 hover:border-rockland-teal/30"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {item.nextStep && (
            <p className="text-xs text-gray-500 mt-2">
              Next: {item.nextStep}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2">
            {item.grantDeadline && (
              <DeadlineBadge deadline={item.grantDeadline} />
            )}
            <p className="text-[10px] text-gray-300">
              Saved {new Date(item.savedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
