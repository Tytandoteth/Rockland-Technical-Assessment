"use client";

import { useEffect, useRef, useState } from "react";
import { PipelineItem } from "@/lib/types";
import DeadlineBadge from "./DeadlineBadge";

type DeadlineBucket = "overdue" | "due14" | "later" | "none";

function deadlineBucket(deadline?: string): DeadlineBucket {
  if (!deadline) return "none";
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return "none";
  const days = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
  if (days < 0) return "overdue";
  if (days <= 14) return "due14";
  return "later";
}

function bucketSortKey(item: PipelineItem): number {
  const d = item.grantDeadline ? new Date(item.grantDeadline) : null;
  if (!d || isNaN(d.getTime())) return Number.POSITIVE_INFINITY;
  return d.getTime();
}

function NoteField({
  grantId,
  savedNote,
  onSave,
}: {
  grantId: string;
  savedNote?: string;
  onSave: (grantId: string, note: string) => void;
}) {
  const [text, setText] = useState(savedNote ?? "");
  const [savedFlash, setSavedFlash] = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync persisted pipeline note into local draft when parent updates
    setText(savedNote ?? "");
  }, [savedNote]);

  useEffect(() => {
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, []);

  const handleBlur = (): void => {
    const next = text.trim();
    const prev = (savedNote ?? "").trim();
    if (next === prev) return;
    onSave(grantId, next);
    setSavedFlash(true);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setSavedFlash(false), 2000);
  };

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <label className="text-[10px] uppercase tracking-wide text-rockland-navy/40 font-semibold">
          Note
        </label>
        {savedFlash && (
          <span className="text-[10px] text-rockland-teal font-medium">
            Saved
          </span>
        )}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        placeholder="e.g., Waiting on CFO, check state eligibility…"
        rows={2}
        className="w-full text-xs text-rockland-navy/80 border border-rockland-gray rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-rockland-teal resize-none bg-rockland-cream/30"
      />
    </div>
  );
}

interface PipelineProps {
  items: PipelineItem[];
  onUpdateStatus: (grantId: string, status: PipelineItem["status"]) => void;
  onRemove: (grantId: string) => void;
  onSelectGrant: (grantId: string) => void;
  onUpdateNote: (grantId: string, note: string) => void;
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

const BUCKET_LABEL: Record<DeadlineBucket, string> = {
  overdue: "Overdue",
  due14: "Due within 14 days",
  later: "Later",
  none: "No deadline",
};

function isOverdue(deadline?: string): boolean {
  if (!deadline) return false;
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
}

function isDueInNext14Days(deadline?: string): boolean {
  if (!deadline) return false;
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return false;
  const days = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
  return days >= 0 && days <= 14;
}

export default function Pipeline({
  items,
  onUpdateStatus,
  onRemove,
  onSelectGrant,
  onUpdateNote,
}: PipelineProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-rockland-navy/40">
        <p className="text-2xl mb-2">📋</p>
        <p className="text-sm font-medium mb-1">Your pipeline is empty</p>
        <p className="text-xs">
          Click &quot;Save to Pipeline&quot; on any grant detail to start tracking it here
        </p>
      </div>
    );
  }

  const statusCounts: Record<PipelineItem["status"], number> = {
    "To Review": 0,
    Interested: 0,
    Applying: 0,
    Submitted: 0,
  };
  let overdueN = 0;
  let due14N = 0;
  let totalPipelineValue = 0;
  let grantsWithFunding = 0;
  for (const item of items) {
    statusCounts[item.status] += 1;
    if (isOverdue(item.grantDeadline)) overdueN += 1;
    else if (isDueInNext14Days(item.grantDeadline)) due14N += 1;
    if (item.grantAmountMax) {
      totalPipelineValue += item.grantAmountMax;
      grantsWithFunding += 1;
    }
  }

  const buckets: Record<DeadlineBucket, PipelineItem[]> = {
    overdue: [],
    due14: [],
    later: [],
    none: [],
  };
  for (const item of items) {
    buckets[deadlineBucket(item.grantDeadline)].push(item);
  }

  const bucketOrder: DeadlineBucket[] = ["overdue", "due14", "later", "none"];
  for (const b of bucketOrder) {
    buckets[b].sort((a, b) => bucketSortKey(a) - bucketSortKey(b));
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-rockland-gray bg-rockland-cream/40 px-3 py-2.5">
        <p className="text-[10px] uppercase tracking-wide text-rockland-navy/40 font-semibold mb-2">
          Pipeline summary
        </p>
        <div className="flex flex-wrap gap-2 mb-2">
          {STATUSES.map((s) => (
            <span
              key={s}
              className="text-[11px] px-2 py-0.5 rounded-md bg-white border border-rockland-gray/60 text-rockland-navy/80"
            >
              <span className="font-medium text-rockland-navy">{statusCounts[s]}</span>{" "}
              {s}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-rockland-navy/70">
          {totalPipelineValue > 0 && (
            <span>
              <span className="font-semibold text-rockland-green">
                ${totalPipelineValue >= 1_000_000
                  ? `${(totalPipelineValue / 1_000_000).toFixed(1)}M`
                  : `${(totalPipelineValue / 1_000).toFixed(0)}K`}
              </span>{" "}
              pipeline value{grantsWithFunding < items.length ? ` (${grantsWithFunding} of ${items.length} priced)` : ""}
            </span>
          )}
          <span>
            <span className="font-semibold text-red-700/90">{overdueN}</span>{" "}
            overdue
          </span>
          <span>
            <span className="font-semibold text-amber-700/90">{due14N}</span>{" "}
            due in next 14 days
          </span>
          <span>
            <span className="font-semibold text-rockland-navy">{items.length}</span>{" "}
            total saved
          </span>
        </div>
      </div>

      {bucketOrder.map((bucket) => {
        const group = buckets[bucket];
        if (group.length === 0) return null;
        return (
          <div key={bucket}>
            <h3 className="text-[11px] uppercase tracking-wide text-rockland-navy/45 font-semibold mb-2">
              {BUCKET_LABEL[bucket]}{" "}
              <span className="text-rockland-navy/35">({group.length})</span>
            </h3>
            <div className="space-y-2">
              {group.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-rockland-gray rounded-xl p-3 hover:border-rockland-teal/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => onSelectGrant(item.grantId)}
                      className="text-sm font-medium text-rockland-navy hover:text-rockland-teal text-left leading-tight line-clamp-2"
                    >
                      {item.grantTitle}
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(item.grantId)}
                      className="text-gray-400 hover:text-red-500 text-xs shrink-0"
                      title="Remove from pipeline"
                      aria-label={`Remove ${item.grantTitle} from pipeline`}
                    >
                      &#10005;
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {STATUSES.map((status) => (
                      <button
                        key={status}
                        type="button"
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

                  <NoteField
                    grantId={item.grantId}
                    savedNote={item.note}
                    onSave={onUpdateNote}
                  />

                  <div className="flex items-center gap-3 mt-2">
                    {item.grantDeadline && (
                      <DeadlineBadge deadline={item.grantDeadline} />
                    )}
                    <p className="text-[10px] text-gray-300">
                      Saved{" "}
                      {new Date(item.savedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
