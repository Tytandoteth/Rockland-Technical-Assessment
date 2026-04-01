"use client";

import { useState, useCallback } from "react";
import {
  GrantOpportunity,
  GrantAssessment,
  ClinicProfile,
} from "@/lib/types";
import type { AiPick } from "@/app/api/ai-picks/route";
import FitBadge from "./FitBadge";

interface AiTopPicksProps {
  grants: GrantOpportunity[];
  assessments: GrantAssessment[];
  profile: ClinicProfile;
  onSelectGrant: (id: string) => void;
  onSaveToPipeline: (grantId: string) => void;
  pipelineGrantIds: Set<string>;
}

const RANK_STYLES = [
  "from-amber-400 to-amber-500",
  "from-slate-300 to-slate-400",
  "from-amber-600 to-amber-700",
  "from-rockland-teal to-rockland-teal/80",
  "from-rockland-teal to-rockland-teal/80",
];

export default function AiTopPicks({
  grants,
  assessments,
  profile,
  onSelectGrant,
  onSaveToPipeline,
  pipelineGrantIds,
}: AiTopPicksProps) {
  const [picks, setPicks] = useState<AiPick[] | null>(null);
  const [portfolioInsight, setPortfolioInsight] = useState<string | null>(null);
  const [source, setSource] = useState<"ai" | "heuristic" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grants, assessments, profile }),
      });
      if (!res.ok) throw new Error("Failed to get AI recommendations");
      const data = await res.json();
      setPicks(data.picks);
      setPortfolioInsight(data.portfolioInsight);
      setSource(data.source);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [grants, assessments, profile]);

  // Not yet activated — show the premium CTA
  if (!picks && !loading) {
    return (
      <div className="relative overflow-hidden rounded-xl border-2 border-transparent bg-gradient-to-r from-rockland-navy via-rockland-teal to-rockland-green p-[2px]">
        <div className="rounded-[10px] bg-white px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-rockland-teal to-rockland-green text-white text-lg">
                ✦
              </div>
              <div>
                <h3 className="text-sm font-bold text-rockland-navy">
                  AI Grant Advisor
                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider bg-gradient-to-r from-rockland-teal to-rockland-green text-white rounded">
                    Premium
                  </span>
                </h3>
                <p className="text-xs text-rockland-navy/50 mt-0.5">
                  Get AI-curated top picks tailored to your clinic&apos;s profile and strategic needs
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={grants.length === 0}
              className="shrink-0 px-4 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-rockland-teal to-rockland-green text-white hover:opacity-90 disabled:opacity-40 transition-opacity shadow-sm"
            >
              Find My Best Opportunities →
            </button>
          </div>
          {error && (
            <p className="text-xs text-red-500 mt-2">{error}</p>
          )}
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-xl border-2 border-transparent bg-gradient-to-r from-rockland-navy via-rockland-teal to-rockland-green p-[2px]">
        <div className="rounded-[10px] bg-white px-5 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-rockland-teal to-rockland-green text-white text-lg animate-pulse">
              ✦
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-rockland-navy">
                AI is analyzing {grants.length} grants against your profile...
              </p>
              <div className="flex gap-3 mt-2">
                {["Reviewing eligibility", "Scoring strategic fit", "Building portfolio"].map(
                  (step, i) => (
                    <span
                      key={step}
                      className="text-[10px] text-rockland-teal/70 flex items-center gap-1"
                      style={{ animationDelay: `${i * 0.5}s` }}
                    >
                      <span className="inline-block w-2 h-2 rounded-full bg-rockland-teal/30 animate-pulse" />
                      {step}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Results
  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-transparent bg-gradient-to-r from-rockland-navy via-rockland-teal to-rockland-green p-[2px]">
      <div className="rounded-[10px] bg-white">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-rockland-gray/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">✦</span>
              <h3 className="text-sm font-bold text-rockland-navy">
                AI Grant Advisor
              </h3>
              <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider bg-gradient-to-r from-rockland-teal to-rockland-green text-white rounded">
                {source === "ai" ? "AI-Powered" : "Heuristic"}
              </span>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              className="text-[10px] text-rockland-teal hover:text-rockland-teal/70 font-medium transition-colors"
            >
              Refresh
            </button>
          </div>

          {/* Portfolio insight */}
          {portfolioInsight && (
            <div className="mt-2 bg-gradient-to-r from-rockland-teal/5 to-rockland-green/5 rounded-lg px-3 py-2">
              <p className="text-xs text-rockland-navy/70 leading-relaxed">
                <span className="font-semibold text-rockland-navy">Portfolio Strategy:</span>{" "}
                {portfolioInsight}
              </p>
            </div>
          )}
        </div>

        {/* Picks */}
        <div className="px-5 py-3 space-y-3">
          {picks?.map((pick) => {
            const grant = grants.find((g) => g.id === pick.grantId);
            const assessment = assessments.find(
              (a) => a.grantId === pick.grantId
            );
            if (!grant || !assessment) return null;
            const isInPipeline = pipelineGrantIds.has(grant.id);

            return (
              <div
                key={pick.grantId}
                className="group relative flex gap-3 rounded-lg border border-rockland-gray/50 p-3 hover:border-rockland-teal/40 hover:shadow-sm transition-all animate-fade-in"
              >
                {/* Rank badge */}
                <div
                  className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br ${RANK_STYLES[pick.rank - 1] || RANK_STYLES[3]} text-white text-xs font-bold shadow-sm`}
                >
                  {pick.rank}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onSelectGrant(pick.grantId)}
                        className="text-sm font-semibold text-rockland-navy hover:text-rockland-teal leading-tight text-left line-clamp-2 transition-colors"
                      >
                        {grant.title}
                      </button>
                      <p className="text-[10px] text-rockland-navy/40 mt-0.5 truncate">
                        {grant.agency}
                      </p>
                    </div>
                    <FitBadge
                      label={assessment.fitLabel}
                      score={assessment.fitScore}
                    />
                  </div>

                  {/* Strategic fit tag */}
                  <span className="inline-flex items-center mt-1.5 px-2 py-0.5 text-[10px] font-medium rounded-full bg-rockland-teal/10 text-rockland-teal border border-rockland-teal/20">
                    {pick.strategicFit}
                  </span>

                  {/* AI reasoning */}
                  <p className="text-xs text-rockland-navy/60 leading-relaxed mt-1.5">
                    {pick.reasoning}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => onSelectGrant(pick.grantId)}
                      className="text-[10px] font-semibold text-rockland-teal hover:underline"
                    >
                      View Full Detail →
                    </button>
                    {!isInPipeline ? (
                      <button
                        type="button"
                        onClick={() => onSaveToPipeline(pick.grantId)}
                        className="text-[10px] font-semibold text-rockland-green hover:underline"
                      >
                        + Add to Pipeline
                      </button>
                    ) : (
                      <span className="text-[10px] text-rockland-navy/30">
                        In Pipeline
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
