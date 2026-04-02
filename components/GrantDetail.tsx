"use client";

import { useCallback, useState } from "react";
import {
  GrantOpportunity,
  GrantAssessment,
  ClinicProfile,
} from "@/lib/types";
import { formatAgencyDisplay } from "@/lib/agencyDisplay";
import { analyzeEligibility, EligibilityTag } from "@/lib/eligibility";
import { estimateEffort, type EffortLevel } from "@/lib/effort";
import FitBadge from "./FitBadge";
import DeadlineBadge from "./DeadlineBadge";

const EFFORT_STYLES: Record<EffortLevel, string> = {
  low: "bg-emerald-50 border-emerald-200 text-emerald-800",
  moderate: "bg-amber-50 border-amber-200 text-amber-800",
  high: "bg-red-50 border-red-200 text-red-800",
};

const EFFORT_ICONS: Record<EffortLevel, string> = {
  low: "⚡",
  moderate: "📝",
  high: "📚",
};

interface EnrichedDetail {
  description: string;
  estimatedFunding: number | null;
  awardCeiling: number | null;
  awardFloor: number | null;
  numberOfAwards: number | null;
  costSharing: boolean;
  applicantTypes: string[];
  estimatedPostDate: string | null;
  estimatedResponseDate: string | null;
  contactName: string | null;
  contactEmail: string | null;
  programTitle: string | null;
  additionalEligibilityInfo: string | null;
}

interface GrantDetailProps {
  grant: GrantOpportunity;
  assessment: GrantAssessment;
  profile: ClinicProfile;
  isInPipeline: boolean;
  onSaveToPipeline: () => void;
  aiSummary: string | null;
  aiSummarySource: "ai" | "heuristic" | null;
  aiSummaryLoading: boolean;
  onRequestSummary: () => void;
  enrichedDetail: EnrichedDetail | null;
  enrichedLoading: boolean;
}

const TAG_STYLES: Record<EligibilityTag["category"], string> = {
  eligible: "bg-emerald-100 text-emerald-800 border-emerald-200",
  likely: "bg-blue-100 text-blue-800 border-blue-200",
  verify: "bg-amber-100 text-amber-800 border-amber-200",
  info: "bg-rockland-navy/5 text-rockland-navy/70 border-rockland-navy/10",
};

const VERDICT_STYLES: Record<string, string> = {
  yes: "bg-emerald-50 border-emerald-200 text-emerald-900",
  likely: "bg-blue-50 border-blue-200 text-blue-900",
  verify: "bg-amber-50 border-amber-200 text-amber-900",
  unlikely: "bg-red-50 border-red-200 text-red-900",
};

const VERDICT_ICONS: Record<string, string> = {
  yes: "✓",
  likely: "○",
  verify: "?",
  unlikely: "✗",
};

function EligibilitySection({
  applicantTypes,
  eligibilityText,
  additionalEligibilityInfo,
  grantTitle,
  grantAgency,
  grantDescription,
  enrichedLoading,
}: {
  applicantTypes: string[];
  eligibilityText?: string;
  additionalEligibilityInfo?: string | null;
  grantTitle: string;
  grantAgency: string;
  grantDescription?: string;
  enrichedLoading: boolean;
}) {
  // Parse comma-separated eligibilityText as fallback if no typed array
  const types =
    applicantTypes.length > 0
      ? applicantTypes
      : eligibilityText
        ? eligibilityText.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

  const analysis = analyzeEligibility(
    types,
    grantTitle,
    grantAgency,
    grantDescription,
    additionalEligibilityInfo || undefined
  );

  if (enrichedLoading) {
    return (
      <div className="animate-pulse">
        <h3 className="text-sm font-semibold text-rockland-navy mb-2">
          Eligibility
        </h3>
        {/* Verdict banner skeleton */}
        <div className="rounded-lg border border-rockland-gray/40 px-3 py-2 mb-3 flex items-start gap-2">
          <div className="w-5 h-5 bg-rockland-navy/10 rounded-full mt-0.5" />
          <div className="flex-1">
            <div className="h-4 w-40 bg-rockland-navy/10 rounded mb-1" />
            <div className="h-3 w-56 bg-rockland-navy/5 rounded" />
          </div>
        </div>
        {/* Tag pills skeleton */}
        <div className="flex flex-wrap gap-1.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-6 rounded-full bg-rockland-navy/5"
              style={{ width: `${60 + i * 20}px` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-rockland-navy mb-2">
        Eligibility
      </h3>

      {/* FQHC Verdict Banner */}
      <div
        className={`rounded-lg border px-3 py-2 mb-3 flex items-start gap-2 ${VERDICT_STYLES[analysis.fqhcEligible]}`}
      >
        <span className="text-base font-bold leading-none mt-0.5">
          {VERDICT_ICONS[analysis.fqhcEligible]}
        </span>
        <div>
          <p className="text-sm font-semibold">{analysis.tags[0]?.label}</p>
          <p className="text-xs mt-0.5 opacity-80">{analysis.fqhcVerdict}</p>
        </div>
      </div>

      {/* Tags */}
      {analysis.tags.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {analysis.tags.slice(1).map((tag, i) => (
            <span
              key={i}
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${TAG_STYLES[tag.category]}`}
              title={tag.tooltip}
            >
              {tag.label}
            </span>
          ))}
        </div>
      )}

      {/* Additional Eligibility Info (from Grants.gov) */}
      {additionalEligibilityInfo && (
        <details className="group" open>
          <summary className="text-xs font-medium text-rockland-navy/60 cursor-pointer hover:text-rockland-navy/80 transition-colors">
            Additional Eligibility Requirements
          </summary>
          <div className="mt-2 bg-rockland-cream/60 border border-rockland-navy/10 rounded-lg p-3">
            <p className="text-xs text-rockland-navy/70 leading-relaxed whitespace-pre-line">
              {additionalEligibilityInfo}
            </p>
          </div>
        </details>
      )}

      {/* Expandable raw list */}
      {analysis.rawTypes.length > 3 && (
        <details className="group">
          <summary className="text-xs text-rockland-navy/40 cursor-pointer hover:text-rockland-navy/60 transition-colors">
            View all {analysis.rawTypes.length} eligible entity types
          </summary>
          <ul className="mt-2 space-y-0.5 text-xs text-rockland-navy/60">
            {analysis.rawTypes.map((type, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-rockland-navy/30 mt-px">•</span>
                {type}
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* No data state */}
      {analysis.rawTypes.length === 0 && !additionalEligibilityInfo && !analysis.fqhcVerdict.includes("FQHC") && (
        <p className="text-xs text-rockland-navy/40 italic">
          Eligibility details not available — check the full listing on
          Grants.gov
        </p>
      )}
    </div>
  );
}

function formatAmount(min?: number, max?: number): string {
  const parts: string[] = [];
  if (min) parts.push(`$${min.toLocaleString()}`);
  if (max) parts.push(`$${max.toLocaleString()}`);
  if (parts.length === 2) return `${parts[0]} – ${parts[1]}`;
  if (parts.length === 1) return max ? `Up to ${parts[0]}` : `From ${parts[0]}`;
  return "Not specified";
}

function formatFunding(enriched: EnrichedDetail | null, grant: GrantOpportunity): string {
  if (enriched) {
    if (enriched.awardCeiling && enriched.awardFloor) {
      return `$${enriched.awardFloor.toLocaleString()} – $${enriched.awardCeiling.toLocaleString()}`;
    }
    if (enriched.awardCeiling) return `Up to $${enriched.awardCeiling.toLocaleString()}`;
    if (enriched.estimatedFunding) {
      const perAward = enriched.numberOfAwards
        ? ` (~$${Math.round(enriched.estimatedFunding / enriched.numberOfAwards).toLocaleString()}/award)`
        : "";
      return `$${enriched.estimatedFunding.toLocaleString()} total${perAward}`;
    }
  }
  return formatAmount(grant.amountMin, grant.amountMax);
}

export default function GrantDetail({
  grant,
  assessment,
  profile,
  isInPipeline,
  onSaveToPipeline,
  aiSummary,
  aiSummarySource,
  aiSummaryLoading,
  onRequestSummary,
  enrichedDetail,
  enrichedLoading,
}: GrantDetailProps) {
  const [briefMarkdown, setBriefMarkdown] = useState<string | null>(null);
  const [briefFilename, setBriefFilename] = useState("grant-brief.md");
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [briefCopyFlash, setBriefCopyFlash] = useState(false);

  const [descExpanded, setDescExpanded] = useState(false);
  const [emailCopyFlash, setEmailCopyFlash] = useState(false);

  const [samUei, setSamUei] = useState("");
  const [samLoading, setSamLoading] = useState(false);
  const [samMessage, setSamMessage] = useState<string | null>(null);
  const [samFound, setSamFound] = useState<boolean | null>(null);
  const [samStatus, setSamStatus] = useState<
    "idle" | "ok" | "unconfigured" | "unavailable" | "error"
  >("idle");

  const agencyDisplay = formatAgencyDisplay(grant.agency);
  const description = enrichedDetail?.description || grant.summary;
  const effort = estimateEffort(grant);

  const handleGenerateBrief = useCallback(async () => {
    setBriefLoading(true);
    setBriefError(null);
    try {
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant,
          assessment,
          profile,
          enrichedDetail,
        }),
      });
      const data: { markdown?: string; filename?: string; error?: string } =
        await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not generate brief");
      }
      if (!data.markdown) throw new Error("Empty brief response");
      setBriefMarkdown(data.markdown);
      if (data.filename) setBriefFilename(data.filename);
    } catch (e) {
      setBriefError(e instanceof Error ? e.message : "Brief failed");
      setBriefMarkdown(null);
    } finally {
      setBriefLoading(false);
    }
  }, [grant, assessment, profile, enrichedDetail]);

  const handleCopyBrief = useCallback(async () => {
    if (!briefMarkdown) return;
    try {
      await navigator.clipboard.writeText(briefMarkdown);
      setBriefCopyFlash(true);
      setTimeout(() => setBriefCopyFlash(false), 2000);
    } catch {
      setBriefError("Clipboard not available");
    }
  }, [briefMarkdown]);

  const handleDownloadBrief = useCallback(() => {
    if (!briefMarkdown) return;
    const blob = new Blob([briefMarkdown], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = briefFilename.endsWith(".md") ? briefFilename : `${briefFilename}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [briefMarkdown, briefFilename]);

  const handleSamVerify = useCallback(async () => {
    setSamLoading(true);
    setSamMessage(null);
    setSamFound(null);
    setSamStatus("idle");
    try {
      const res = await fetch("/api/sam/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uei: samUei }),
      });
      const data: {
        status?: string;
        message?: string;
        found?: boolean;
        error?: string;
      } = await res.json();

      if (data.status === "unconfigured") {
        setSamStatus("unconfigured");
        setSamMessage(data.message ?? "SAM.gov not configured.");
        return;
      }
      if (data.status === "unavailable") {
        setSamStatus("unavailable");
        setSamMessage(data.message ?? "SAM.gov unavailable.");
        return;
      }
      if (!res.ok) {
        setSamStatus("error");
        setSamMessage(data.error || data.message || "Verification failed");
        return;
      }
      if (data.status === "ok") {
        setSamStatus("ok");
        setSamFound(Boolean(data.found));
        setSamMessage(
          data.message ??
            (data.found ? "Entity found in SAM." : "No matching entity.")
        );
        return;
      }
      setSamStatus("unavailable");
      setSamMessage("Unexpected response from verification service.");
    } catch (e) {
      setSamStatus("unavailable");
      setSamMessage(e instanceof Error ? e.message : "Network error");
    } finally {
      setSamLoading(false);
    }
  }, [samUei]);

  const riskFlags = enrichedDetail
    ? assessment.riskFlags.filter((flag) => {
        if (enrichedDetail.estimatedFunding && flag.includes("Funding amount not specified")) return false;
        if (enrichedDetail.description && flag.includes("Limited description available")) return false;
        if (enrichedDetail.applicantTypes?.length && flag.includes("No eligibility information")) return false;
        if ((enrichedDetail.estimatedPostDate || enrichedDetail.estimatedResponseDate) && flag.includes("No deadline information")) return false;
        return true;
      })
    : assessment.riskFlags;

  const handleCopyEmailSummary = useCallback(async () => {
    const deadline = grant.deadline
      ? new Date(grant.deadline).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : "Not specified";
    const funding = formatFunding(enrichedDetail, grant);
    const flags = assessment.riskFlags;
    const text = [
      `Grant: ${grant.title}`,
      `Agency: ${agencyDisplay.label}`,
      `Fit: ${assessment.fitLabel} (${assessment.fitScore}/100)`,
      `Funding: ${funding}`,
      `Deadline: ${deadline}`,
      `Effort: ${effort.label} (${effort.hours})`,
      "",
      `Why it fits: ${assessment.fitReason}`,
      "",
      flags.length > 0
        ? `Risks: ${flags.join("; ")}`
        : "Risks: None identified",
      "",
      `Next step: ${assessment.recommendedAction}`,
      "",
      grant.url ? `Full listing: ${grant.url}` : "",
    ].filter(Boolean).join("\n");

    let copied = false;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        copied = true;
      } catch {
        // clipboard denied — fall through to mailto
      }
    }
    if (!copied) {
      // Fallback: open mailto link in a new tab
      const subject = encodeURIComponent(`Grant Opportunity: ${grant.title}`);
      const body = encodeURIComponent(text);
      const a = document.createElement("a");
      a.href = `mailto:?subject=${subject}&body=${body}`;
      a.target = "_blank";
      a.rel = "noopener";
      a.click();
    }
    setEmailCopyFlash(true);
    setTimeout(() => setEmailCopyFlash(false), 2000);
  }, [grant, assessment, enrichedDetail, agencyDisplay, effort]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <FitBadge label={assessment.fitLabel} score={assessment.fitScore} />
          <DeadlineBadge deadline={grant.deadline || enrichedDetail?.estimatedPostDate || enrichedDetail?.estimatedResponseDate || ""} />
          {enrichedLoading && (
            <span className="text-[10px] text-rockland-navy/40 flex items-center gap-1">
              <span className="inline-block w-3 h-3 border border-rockland-gray border-t-rockland-teal rounded-full animate-spin" />
              Loading details...
            </span>
          )}
        </div>
        <h2 className="text-lg font-bold text-rockland-navy leading-tight">
          {grant.title}
        </h2>
        <p className="text-sm text-rockland-navy/60 mt-1" title={agencyDisplay.title}>
          {agencyDisplay.label}
          {enrichedDetail?.programTitle && (
            <span className="text-rockland-navy/40"> · {enrichedDetail.programTitle}</span>
          )}
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-rockland-navy/45 mt-2 pt-2 border-t border-rockland-gray/40">
          <span>
            Fit data:{" "}
            <span className="font-medium text-rockland-navy/65">
              {assessment.scoringSource === "enriched"
                ? "Enriched Grants.gov listing"
                : "Search hit (preview scoring)"}
            </span>
          </span>
          <span>
            Eligibility source:{" "}
            <span className="font-medium text-rockland-navy/65">
              {enrichedLoading
                ? "Loading applicant types…"
                : enrichedDetail?.applicantTypes?.length
                  ? "Typed applicant types from Grants.gov"
                  : grant.eligibilityText
                    ? "Listing text only (parsed from search)"
                    : "Limited — open full listing on Grants.gov"}
            </span>
          </span>
        </div>
      </div>

      {/* Key Facts */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-rockland-cream rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-wide text-rockland-navy/40 font-semibold mb-0.5">
            Funding
          </p>
          <p className="text-sm font-semibold text-rockland-navy">
            {formatFunding(enrichedDetail, grant)}
          </p>
          {enrichedDetail?.numberOfAwards && (
            <p className="text-[10px] text-rockland-navy/40 mt-0.5">
              {enrichedDetail.numberOfAwards} expected award{enrichedDetail.numberOfAwards !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="bg-rockland-cream rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-wide text-rockland-navy/40 font-semibold mb-0.5">
            Deadline
          </p>
          <p className="text-sm font-semibold text-rockland-navy">
            {grant.deadline
              ? new Date(grant.deadline).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              : enrichedDetail?.estimatedResponseDate
                ? `Est. ${enrichedDetail.estimatedResponseDate}`
                : enrichedDetail?.estimatedPostDate
                  ? `Posting est. ${enrichedDetail.estimatedPostDate}`
                  : "Not specified"}
          </p>
          {enrichedDetail?.costSharing && (
            <p className="text-[10px] text-amber-600 mt-0.5">Cost sharing required</p>
          )}
        </div>
      </div>

      {/* Application Effort Estimate */}
      <div className={`rounded-lg border p-3 flex items-start gap-3 ${EFFORT_STYLES[effort.level]}`}>
        <span className="text-lg leading-none mt-0.5">{EFFORT_ICONS[effort.level]}</span>
        <div>
          <p className="text-sm font-semibold">
            {effort.label}
            <span className="font-normal opacity-70 ml-1.5">({effort.hours})</span>
          </p>
          <p className="text-xs mt-0.5 opacity-80">{effort.reason}</p>
        </div>
      </div>

      {/* Why This Fits */}
      <div className="bg-rockland-green/10 border border-rockland-green/20 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-rockland-green mb-2">
          Why This Fits Your Clinic
        </h3>
        <p className="text-sm text-rockland-navy">{assessment.fitReason}</p>
        {assessment.confidenceNotes && !enrichedDetail && (
          <p className="text-xs text-rockland-green/70 mt-2 italic">
            {assessment.confidenceNotes}
          </p>
        )}
      </div>

      {/* AI Analysis */}
      {aiSummary ? (
        <div className="bg-rockland-teal/10 border border-rockland-teal/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-rockland-teal">
              AI Grant Analysis
            </h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rockland-teal/15 text-rockland-teal font-medium">
              {aiSummarySource === "ai" ? "AI-generated" : "Heuristic"}
            </span>
          </div>
          <div className="text-sm text-rockland-navy leading-relaxed space-y-2 [&>p]:mb-2">
            {aiSummary.split("\n").map((line, i) => {
              const trimmed = line.trim();
              if (!trimmed) return null;
              // Bold headers like **Recommendation:**
              if (trimmed.startsWith("**")) {
                const match = trimmed.match(/^\*\*(.+?)\*\*\s*(.*)/);
                if (match) {
                  return (
                    <p key={i}>
                      <span className="font-semibold text-rockland-navy">{match[1]}</span>{" "}
                      <span className="text-rockland-navy/80">{match[2]}</span>
                    </p>
                  );
                }
              }
              // Bullet points
              if (trimmed.startsWith("- ")) {
                return (
                  <p key={i} className="pl-3 text-rockland-navy/80">
                    <span className="text-rockland-teal mr-1.5">&#8226;</span>
                    {trimmed.slice(2)}
                  </p>
                );
              }
              return <p key={i} className="text-rockland-navy/80">{trimmed}</p>;
            })}
          </div>
        </div>
      ) : aiSummaryLoading ? (
        <div className="bg-rockland-teal/10 border border-rockland-teal/20 rounded-lg p-5">
          <div className="flex items-center gap-3 text-sm text-rockland-teal">
            <span className="inline-block w-5 h-5 border-2 border-rockland-teal/30 border-t-rockland-teal rounded-full animate-spin" />
            <div>
              <p className="font-medium">Analyzing this grant...</p>
              <p className="text-rockland-teal/70 text-xs mt-0.5">Reviewing eligibility, funding fit, and next steps</p>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={onRequestSummary}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rockland-teal text-white text-sm font-semibold rounded-lg hover:bg-rockland-teal/90 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Get AI Analysis →
        </button>
      )}

      {/* Risk Flags */}
      {riskFlags.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-amber-900 mb-2">
            Unknowns & Risk Flags
          </h3>
          <ul className="space-y-1">
            {riskFlags.map((flag, i) => (
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
      <div className="bg-rockland-navy/5 border border-rockland-navy/10 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-rockland-navy mb-1">
          Recommended Next Step
        </h3>
        <p className="text-sm text-rockland-navy/80">{assessment.recommendedAction}</p>
      </div>

      {/* One-page brief (CFO handoff) */}
      <div className="border border-rockland-teal/25 rounded-lg p-4 bg-rockland-teal/5">
        <h3 className="text-sm font-semibold text-rockland-navy mb-2">
          One-page brief
        </h3>
        <p className="text-xs text-rockland-navy/55 mb-3">
          Compose a markdown summary for email or files — fit, eligibility signal,
          risks, and next step.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleGenerateBrief}
            disabled={briefLoading}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-rockland-teal text-white hover:bg-rockland-teal/90 disabled:opacity-50"
          >
            {briefLoading ? "Generating…" : "Generate brief"}
          </button>
          <button
            type="button"
            onClick={handleCopyBrief}
            disabled={!briefMarkdown}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-rockland-gray text-rockland-navy hover:bg-rockland-cream disabled:opacity-40"
          >
            {briefCopyFlash ? "Copied" : "Copy markdown"}
          </button>
          <button
            type="button"
            onClick={handleDownloadBrief}
            disabled={!briefMarkdown}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-rockland-gray text-rockland-navy hover:bg-rockland-cream disabled:opacity-40"
          >
            Download .md
          </button>
        </div>
        {briefError && (
          <p className="text-xs text-red-600 mt-2">{briefError}</p>
        )}
      </div>

      {/* Description */}
      {description && (
        <div>
          <h3 className="text-sm font-semibold text-rockland-navy mb-1">
            Grant Description
            {enrichedDetail?.description && (
              <span className="text-[10px] text-rockland-navy/40 font-normal ml-2">from Grants.gov</span>
            )}
          </h3>
          <p className="text-sm text-rockland-navy/70 leading-relaxed whitespace-pre-line">
            {description.length > 800 && !descExpanded
              ? description.slice(0, 800) + "..."
              : description}
          </p>
          {description.length > 800 && (
            <button
              type="button"
              onClick={() => setDescExpanded(!descExpanded)}
              className="text-xs text-rockland-teal hover:text-rockland-teal/70 font-medium mt-1 transition-colors"
            >
              {descExpanded ? "Show less" : "Read full description"}
            </button>
          )}
        </div>
      )}

      {/* Eligibility */}
      <EligibilitySection
        applicantTypes={enrichedDetail?.applicantTypes || []}
        eligibilityText={grant.eligibilityText}
        additionalEligibilityInfo={enrichedDetail?.additionalEligibilityInfo}
        grantTitle={grant.title}
        grantAgency={grant.agency}
        grantDescription={enrichedDetail?.description}
        enrichedLoading={enrichedLoading}
      />

      {/* SAM.gov optional verification (does not block Grants.gov workflow) */}
      <div className="border border-dashed border-rockland-gray rounded-lg p-4 bg-rockland-cream/20">
        <h3 className="text-sm font-semibold text-rockland-navy mb-1">
          SAM.gov entity check (optional)
        </h3>
        <p className="text-xs text-rockland-navy/50 mb-3">
          Spike: confirm whether a 12-character UEI returns a public SAM entity
          record. Federal assistance workflows often require active SAM
          registration — this is a lightweight signal, not legal advice.
        </p>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[140px]">
            <label className="text-[10px] uppercase tracking-wide text-rockland-navy/40 font-semibold block mb-1">
              UEI
            </label>
            <input
              type="text"
              value={samUei}
              onChange={(e) => setSamUei(e.target.value.toUpperCase())}
              placeholder="12-character UEI"
              maxLength={12}
              className="w-full text-sm border border-rockland-gray rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-rockland-teal"
            />
          </div>
          <button
            type="button"
            onClick={handleSamVerify}
            disabled={samLoading || samUei.trim().length !== 12}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-rockland-navy text-white hover:bg-rockland-navy/90 disabled:opacity-40"
          >
            {samLoading ? "Checking…" : "Verify UEI"}
          </button>
        </div>
        {samMessage && (
          <p
            className={`text-xs mt-3 ${
              samStatus === "ok" && samFound === true
                ? "text-emerald-800"
                : samStatus === "ok" && samFound === false
                  ? "text-amber-800"
                  : samStatus === "unconfigured"
                    ? "text-rockland-navy/60"
                    : "text-amber-800"
            }`}
          >
            {samMessage}
          </p>
        )}
      </div>

      {/* Contact */}
      {enrichedDetail?.contactName && (
        <div>
          <h3 className="text-sm font-semibold text-rockland-navy mb-1">
            Agency Contact
          </h3>
          <p className="text-sm text-rockland-navy/70">
            {enrichedDetail.contactName}
            {enrichedDetail.contactEmail && (
              <> · <a href={`mailto:${enrichedDetail.contactEmail}`} className="text-rockland-teal hover:underline">{enrichedDetail.contactEmail}</a></>
            )}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-2">
        {!isInPipeline ? (
          <button
            onClick={onSaveToPipeline}
            className="flex-1 min-w-[140px] px-4 py-2.5 bg-rockland-green text-white text-sm font-semibold rounded-lg hover:bg-rockland-green/90 transition-colors"
          >
            Save to Pipeline →
          </button>
        ) : (
          <div className="flex-1 min-w-[140px] px-4 py-2.5 bg-rockland-gray text-rockland-navy/50 text-sm font-semibold rounded-lg text-center">
            Already in Pipeline
          </div>
        )}
        <button
          type="button"
          onClick={handleCopyEmailSummary}
          className="px-4 py-2.5 border border-rockland-teal/30 text-rockland-teal text-sm font-semibold rounded-lg hover:bg-rockland-teal/5 transition-colors"
          title="Copy a plain-text summary to paste into email"
        >
          {emailCopyFlash ? "Copied to clipboard!" : "Share via Email"}
        </button>
        {grant.url && (
          <a
            href={grant.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 border border-rockland-gray text-rockland-navy text-sm font-semibold rounded-lg hover:bg-rockland-cream transition-colors"
          >
            View on Grants.gov →
          </a>
        )}
      </div>
    </div>
  );
}
