"use client";

import { PipelineItem } from "@/lib/types";

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
  "To Review": "bg-gray-100 text-gray-700 border-gray-200",
  Interested: "bg-blue-100 text-blue-700 border-blue-200",
  Applying: "bg-purple-100 text-purple-700 border-purple-200",
  Submitted: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export default function Pipeline({
  items,
  onUpdateStatus,
  onRemove,
  onSelectGrant,
}: PipelineProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
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
          className="bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <button
              onClick={() => onSelectGrant(item.grantId)}
              className="text-sm font-medium text-gray-900 hover:text-blue-600 text-left leading-tight line-clamp-2"
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
                    : "bg-white text-gray-400 border-gray-100 hover:border-gray-300"
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

          <div className="flex items-center gap-3 mt-1">
            {item.grantDeadline && (
              <p className="text-[10px] text-gray-400">
                Deadline: {new Date(item.grantDeadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
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
