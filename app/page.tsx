"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAuth, SignInButton, UserButton } from "@clerk/nextjs";
import {
  ClinicProfile as ClinicProfileType,
  GrantOpportunity,
  GrantAssessment,
  PipelineItem,
  GrantsApiResponse,
} from "@/lib/types";
import {
  getPipeline,
  saveToPipeline,
  updatePipelineItem,
  removeFromPipeline,
} from "@/lib/pipeline";
import { scoreGrant, mergeGrantWithEnrichment } from "@/lib/scoring";
import {
  eligibilityTierForGrant,
  type FqhcEligibilityTier,
} from "@/lib/eligibility";
import { getSeenGrantIds, markVisitAndGrants } from "@/lib/newGrants";
import OnboardingWizard from "@/components/OnboardingWizard";
import { isClerkConfigured } from "@/lib/clerk-client";
import ClinicProfile from "@/components/ClinicProfile";
import GrantList from "@/components/GrantList";
import GrantDetail from "@/components/GrantDetail";
import Pipeline from "@/components/Pipeline";
import GrantComparison from "@/components/GrantComparison";
import AiTopPicks from "@/components/AiTopPicks";

const PROFILE_KEY = "rockland-clinic-profile";

function loadSavedProfile(): ClinicProfileType | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function HomeContent({
  isLoaded,
  isSignedIn,
}: {
  isLoaded: boolean;
  isSignedIn: boolean;
}) {
  const [profile, setProfile] = useState<ClinicProfileType | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);

  const [grants, setGrants] = useState<GrantOpportunity[]>([]);
  const [assessments, setAssessments] = useState<GrantAssessment[]>([]);
  const [selectedGrantId, setSelectedGrantId] = useState<string | null>(null);
  const [pipeline, setPipeline] = useState<PipelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [source, setSource] = useState<"grants.gov" | "fallback">("grants.gov");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"detail" | "pipeline" | "compare" | "ai-advisor">("detail");
  const [compareGrantIds, setCompareGrantIds] = useState<Set<string>>(new Set());
  const [sortMode, setSortMode] = useState<"fit" | "urgent">("fit");
  const [eligibilityFilter, setEligibilityFilter] = useState<
    "all" | FqhcEligibilityTier
  >("all");
  const [searchKeyword, setSearchKeyword] = useState("community health");
  const [searchInput, setSearchInput] = useState("community health");
  const [newGrantIds, setNewGrantIds] = useState<Set<string>>(new Set());

  // AI summary state
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiSummarySource, setAiSummarySource] = useState<"ai" | "heuristic" | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const lastSummarizedGrantId = useRef<string | null>(null);

  // Enriched detail state
  interface EnrichedDetail {
    id: string;
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
  const [enrichedDetail, setEnrichedDetail] = useState<EnrichedDetail | null>(null);
  const [enrichedLoading, setEnrichedLoading] = useState(false);
  const lastEnrichedGrantId = useRef<string | null>(null);

  // Bootstrap: Clerk + localStorage or database-backed profile/pipeline
  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;

    async function bootstrap(): Promise<void> {
      try {
        if (isSignedIn) {
          const [pipeRes, profRes] = await Promise.all([
            fetch("/api/pipeline"),
            fetch("/api/profile"),
          ]);
          let pipe: { source?: string; items?: PipelineItem[] } = {};
          let prof: { source?: string; profile?: unknown } = {};
          try {
            if (pipeRes.ok) pipe = await pipeRes.json();
          } catch {
            /* non-JSON or empty */
          }
          try {
            if (profRes.ok) prof = await profRes.json();
          } catch {
            /* non-JSON or empty */
          }
          if (cancelled) return;
          if (pipe.source === "database") {
            setPipeline(pipe.items ?? []);
          } else {
            setPipeline(getPipeline());
          }
          if (prof.source === "database" && prof.profile) {
            setProfile(prof.profile as ClinicProfileType);
            setShowWizard(false);
          } else {
            const local = loadSavedProfile();
            if (local) {
              setProfile(local);
              setShowWizard(false);
            } else {
              setProfile(null);
              setShowWizard(true);
            }
          }
        } else {
          setPipeline(getPipeline());
          const saved = loadSavedProfile();
          if (saved) {
            setProfile(saved);
            setShowWizard(false);
          } else {
            setProfile(null);
            setShowWizard(true);
          }
        }
      } catch (e) {
        console.error("Rockland bootstrap failed:", e);
        if (!cancelled) {
          setPipeline(getPipeline());
          const saved = loadSavedProfile();
          if (saved) {
            setProfile(saved);
            setShowWizard(false);
          } else {
            setProfile(null);
            setShowWizard(true);
          }
        }
      } finally {
        if (!cancelled) setBootstrapped(true);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  const refreshPipelineFromApi = useCallback(async () => {
    const res = await fetch("/api/pipeline");
    const data = await res.json();
    if (data.source === "database" && Array.isArray(data.items)) {
      setPipeline(data.items);
    }
  }, []);

  // Fetch grants when profile is available
  const fetchGrants = useCallback(async (p: ClinicProfileType, keyword?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const fullProfile = p;
      const kw = keyword ?? searchKeyword;

      const res = await fetch("/api/grants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: fullProfile, keyword: kw }),
      });

      if (!res.ok) throw new Error("Failed to fetch grants");

      const data: GrantsApiResponse = await res.json();
      setGrants(data.grants);
      setAssessments(data.assessments);
      setSource(data.source);

      // Determine which grants are new since last visit
      const previouslySeen = getSeenGrantIds();
      const currentIds = data.grants.map((g: GrantOpportunity) => g.id);
      const freshIds = new Set(currentIds.filter((id: string) => !previouslySeen.has(id)));
      setNewGrantIds(freshIds);
      markVisitAndGrants(currentIds);

      if (data.grants.length > 0) {
        setSelectedGrantId(data.grants[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load grants");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profile) {
      fetchGrants(profile);
    }
  }, [profile, fetchGrants]);

  // Re-score selected grant when Grants.gov detail enrichment loads (full description + eligibility)
  useEffect(() => {
    if (!profile || !selectedGrantId || !enrichedDetail) return;
    if (enrichedDetail.id !== selectedGrantId) return;
    const grant = grants.find((g) => g.id === selectedGrantId);
    if (!grant || grant.source !== "grants.gov") return;

    const keywords = profile.scoringKeywords ?? [];

    const merged = mergeGrantWithEnrichment(grant, {
      description: enrichedDetail.description,
      applicantTypes: enrichedDetail.applicantTypes,
      awardCeiling: enrichedDetail.awardCeiling,
      awardFloor: enrichedDetail.awardFloor,
      additionalEligibilityInfo: enrichedDetail.additionalEligibilityInfo,
    });

    const next = scoreGrant(merged, profile, keywords);
    setAssessments((prev) =>
      prev.map((a) =>
        a.grantId === selectedGrantId
          ? { ...next, scoringSource: "enriched" as const }
          : a
      )
    );
  }, [enrichedDetail, selectedGrantId, profile, grants]);

  // Clear AI summary and fetch enriched detail when grant selection changes
  useEffect(() => {
    if (selectedGrantId !== lastSummarizedGrantId.current) {
      setAiSummary(null);
      setAiSummarySource(null);
      setAiSummaryLoading(false);
    }

    if (selectedGrantId && selectedGrantId !== lastEnrichedGrantId.current) {
      setEnrichedDetail(null);
      lastEnrichedGrantId.current = selectedGrantId;

      const grant = grants.find((g) => g.id === selectedGrantId);
      if (grant && grant.source === "grants.gov") {
        setEnrichedLoading(true);
        fetch("/api/grants/detail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ opportunityId: Number(selectedGrantId) }),
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data && lastEnrichedGrantId.current === selectedGrantId) {
              setEnrichedDetail(data);
            }
          })
          .catch(() => {})
          .finally(() => setEnrichedLoading(false));
      }
    }
  }, [selectedGrantId, grants]);

  const pipelineGrantIds = new Set(pipeline.map((p) => p.grantId));

  const selectedGrant = grants.find((g) => g.id === selectedGrantId) || null;
  const selectedAssessment =
    assessments.find((a) => a.grantId === selectedGrantId) || null;
  const selectedPipelineItem =
    !selectedGrant && selectedGrantId
      ? pipeline.find((p) => p.grantId === selectedGrantId) || null
      : null;

  const { displayGrants, displayAssessments } = useMemo(() => {
    function urgencyKey(deadline: string): number {
      if (!deadline) return 1_000_000;
      const d = new Date(deadline);
      if (isNaN(d.getTime())) return 1_000_000;
      return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
    }
    const pairs: { grant: GrantOpportunity; assessment: GrantAssessment }[] = [];
    for (const g of grants) {
      const assessment = assessments.find((a) => a.grantId === g.id);
      if (assessment) pairs.push({ grant: g, assessment });
    }
    const filtered =
      eligibilityFilter === "all"
        ? pairs
        : pairs.filter(
            (p) => eligibilityTierForGrant(p.grant) === eligibilityFilter
          );
    const sorted = [...filtered];
    if (sortMode === "fit") {
      sorted.sort((x, y) => y.assessment.fitScore - x.assessment.fitScore);
    } else {
      sorted.sort((x, y) => urgencyKey(x.grant.deadline) - urgencyKey(y.grant.deadline));
    }
    return {
      displayGrants: sorted.map((x) => x.grant),
      displayAssessments: sorted.map((x) => x.assessment),
    };
  }, [grants, assessments, sortMode, eligibilityFilter]);

  const eligibilityCounts = useMemo(() => {
    const counts: Record<FqhcEligibilityTier, number> = {
      yes: 0,
      likely: 0,
      verify: 0,
      unlikely: 0,
    };
    for (const g of grants) {
      counts[eligibilityTierForGrant(g)] += 1;
    }
    return counts;
  }, [grants]);

  const handleRequestSummary = useCallback(async () => {
    if (!selectedGrant || !selectedAssessment || !profile) return;
    setAiSummaryLoading(true);
    lastSummarizedGrantId.current = selectedGrant.id;

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant: selectedGrant,
          profile,
          assessment: selectedAssessment,
          enrichedDetail,
        }),
      });

      if (!res.ok) throw new Error("Summary request failed");

      const data = await res.json();
      if (lastSummarizedGrantId.current === selectedGrant.id) {
        setAiSummary(data.summary);
        setAiSummarySource(data.source);
      }
    } catch {
      if (lastSummarizedGrantId.current === selectedGrant.id) {
        setAiSummary(selectedAssessment.recommendedAction);
        setAiSummarySource("heuristic");
      }
    } finally {
      setAiSummaryLoading(false);
    }
  }, [selectedGrant, selectedAssessment, profile, enrichedDetail]);

  const handleSaveToPipeline = useCallback(async () => {
    if (!selectedGrant || !selectedAssessment) return;
    const item: PipelineItem = {
      id: `pipeline-${Date.now()}`,
      grantId: selectedGrant.id,
      grantTitle: selectedGrant.title,
      grantDeadline: selectedGrant.deadline || undefined,
      grantUrl: selectedGrant.url || undefined,
      grantAmountMax: selectedGrant.amountMax || undefined,
      status: "To Review",
      nextStep: selectedAssessment.recommendedAction,
      savedAt: new Date().toISOString(),
    };
    if (isSignedIn) {
      try {
        const res = await fetch("/api/pipeline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
        if (res.ok) await refreshPipelineFromApi();
      } catch {
        /* keep UI; user can retry */
      }
    } else {
      const updated = saveToPipeline(item);
      setPipeline(updated);
    }
    setActiveTab("pipeline");
  }, [
    selectedGrant,
    selectedAssessment,
    isSignedIn,
    refreshPipelineFromApi,
  ]);

  const handleUpdateStatus = useCallback(
    async (grantId: string, status: PipelineItem["status"]) => {
      if (isSignedIn) {
        try {
          const res = await fetch("/api/pipeline", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ grantId, status }),
          });
          if (res.ok) await refreshPipelineFromApi();
        } catch {
          /* noop */
        }
      } else {
        const updated = updatePipelineItem(grantId, { status });
        setPipeline(updated);
      }
    },
    [isSignedIn, refreshPipelineFromApi]
  );

  const handleRemoveFromPipeline = useCallback(
    async (grantId: string) => {
      if (isSignedIn) {
        try {
          const res = await fetch("/api/pipeline", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ grantId }),
          });
          if (res.ok) await refreshPipelineFromApi();
        } catch {
          /* noop */
        }
      } else {
        const updated = removeFromPipeline(grantId);
        setPipeline(updated);
      }
    },
    [isSignedIn, refreshPipelineFromApi]
  );

  const handleUpdatePipelineNote = useCallback(
    async (grantId: string, note: string) => {
      if (isSignedIn) {
        try {
          const res = await fetch("/api/pipeline", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ grantId, note: note || undefined }),
          });
          if (res.ok) await refreshPipelineFromApi();
        } catch {
          /* noop */
        }
      } else {
        const updated = updatePipelineItem(grantId, { note: note || undefined });
        setPipeline(updated);
      }
    },
    [isSignedIn, refreshPipelineFromApi]
  );

  const handleSelectGrantFromPipeline = useCallback(
    (grantId: string) => {
      setSelectedGrantId(grantId);
      setActiveTab("detail");
    },
    []
  );

  const handleWizardComplete = useCallback((newProfile: ClinicProfileType) => {
    setProfile(newProfile);
    setShowWizard(false);
  }, []);

  const handleSaveToPipelineById = useCallback(
    async (grantId: string) => {
      const grant = grants.find((g) => g.id === grantId);
      const assessment = assessments.find((a) => a.grantId === grantId);
      if (!grant || !assessment) return;
      const item: PipelineItem = {
        id: `pipeline-${Date.now()}`,
        grantId: grant.id,
        grantTitle: grant.title,
        grantDeadline: grant.deadline || undefined,
        grantUrl: grant.url || undefined,
        grantAmountMax: grant.amountMax || undefined,
        status: "To Review",
        nextStep: assessment.recommendedAction,
        savedAt: new Date().toISOString(),
      };
      if (isSignedIn) {
        try {
          const res = await fetch("/api/pipeline", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
          });
          if (res.ok) await refreshPipelineFromApi();
        } catch {
          /* keep UI; user can retry */
        }
      } else {
        const updated = saveToPipeline(item);
        setPipeline(updated);
      }
    },
    [grants, assessments, isSignedIn, refreshPipelineFromApi]
  );

  const handleToggleCompare = useCallback((grantId: string) => {
    setCompareGrantIds((prev) => {
      const next = new Set(prev);
      if (next.has(grantId)) {
        next.delete(grantId);
      } else if (next.size < 3) {
        next.add(grantId);
      }
      return next;
    });
  }, []);

  const handleEditProfile = useCallback(() => {
    setShowWizard(true);
  }, []);

  if (!isLoaded || !bootstrapped) {
    return (
      <div className="min-h-screen bg-rockland-cream flex flex-col items-center justify-center gap-3 p-6">
        <div className="h-8 w-8 border-2 border-rockland-gray border-t-rockland-teal rounded-full animate-spin" />
        <p className="text-sm text-rockland-navy/60">Loading Rockland…</p>
      </div>
    );
  }

  // Show wizard if no profile
  if (showWizard || !profile) {
    return (
      <OnboardingWizard
        onComplete={handleWizardComplete}
        initialProfile={profile}
        clerkAuth={{ isLoaded, isSignedIn }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-rockland-cream">
      {/* Header */}
      <header className="bg-white border-b border-rockland-gray px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-rockland-navy">
              Rockland
              <span className="text-rockland-teal ml-1.5 text-sm font-medium">
                Grant Discovery
              </span>
            </h1>
            <p className="text-xs text-rockland-navy/40 mt-0.5">
              Which grants are worth your attention right now?
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-rockland-navy/70 font-medium">
                {profile.clinicName}
              </p>
              <p className="text-[10px] text-rockland-navy/40">
                {profile.clinicType} · {profile.state}
              </p>
            </div>
            {isClerkConfigured() &&
              (!isSignedIn ? (
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rockland-navy text-white hover:bg-rockland-navy/90"
                  >
                    Sign in
                  </button>
                </SignInButton>
              ) : (
                <UserButton />
              ))}
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => fetchGrants(profile)}
              className="ml-3 px-3 py-1 text-xs font-semibold bg-red-100 hover:bg-red-200 rounded transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Clinic Profile + Grant List */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Clinic Profile */}
            <div className="bg-white rounded-xl border border-rockland-gray p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs uppercase tracking-wide text-rockland-navy/40 font-semibold">
                  Your Clinic Profile
                </h2>
                <button
                  onClick={handleEditProfile}
                  className="text-[10px] text-rockland-teal hover:text-rockland-teal/70 font-medium transition-colors"
                >
                  Edit
                </button>
              </div>
              <ClinicProfile profile={profile} />
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl border border-rockland-gray p-4">
              <h2 className="text-xs uppercase tracking-wide text-rockland-navy/40 font-semibold mb-2">
                Search Grants.gov
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const kw = searchInput.trim() || "community health";
                  setSearchKeyword(kw);
                  if (profile) fetchGrants(profile, kw);
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="community health"
                  className="flex-1 text-sm px-3 py-1.5 border border-rockland-gray rounded-lg focus:outline-none focus:border-rockland-teal text-rockland-navy"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-3 py-1.5 text-xs font-semibold bg-rockland-teal text-white rounded-lg hover:bg-rockland-teal/90 disabled:opacity-50 transition-colors"
                >
                  Search
                </button>
              </form>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {["behavioral health", "dental", "maternal care", "substance abuse", "rural health", "community health"].map((kw) => (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => {
                      setSearchInput(kw);
                      setSearchKeyword(kw);
                      if (profile) fetchGrants(profile, kw);
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                      searchKeyword === kw
                        ? "bg-rockland-teal/15 border-rockland-teal/30 text-rockland-teal font-medium"
                        : "border-rockland-gray text-rockland-navy/50 hover:text-rockland-navy hover:border-rockland-navy/30"
                    }`}
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </div>

            {/* Grant List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-semibold text-rockland-navy">
                    Recommended Grants
                    {!isLoading && (
                      <span className="text-rockland-navy/40 font-normal ml-1.5">
                        ({displayGrants.length})
                      </span>
                    )}
                  </h2>
                  {!isLoading && newGrantIds.size > 0 && (
                    <p className="text-[10px] text-rockland-green font-medium mt-0.5">
                      {newGrantIds.size} new since your last visit
                    </p>
                  )}
                </div>
                {!isLoading && (
                  <button
                    onClick={() => fetchGrants(profile)}
                    className="text-xs text-rockland-teal/60 hover:text-rockland-teal font-medium transition-colors"
                    title="Refresh grants from Grants.gov"
                  >
                    Refresh
                  </button>
                )}
              </div>
              {!isLoading && grants.length > 0 && (
                <>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-[10px] uppercase tracking-wide text-rockland-navy/40 font-semibold">
                      Sort
                    </span>
                    <button
                      type="button"
                      onClick={() => setSortMode("fit")}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                        sortMode === "fit"
                          ? "bg-rockland-teal/15 text-rockland-teal"
                          : "text-rockland-navy/50 hover:text-rockland-navy"
                      }`}
                    >
                      Best fit
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortMode("urgent")}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                        sortMode === "urgent"
                          ? "bg-rockland-teal/15 text-rockland-teal"
                          : "text-rockland-navy/50 hover:text-rockland-navy"
                      }`}
                    >
                      Deadline soon
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <span className="text-[10px] uppercase tracking-wide text-rockland-navy/40 font-semibold mr-1">
                      Eligibility
                    </span>
                    {(
                      [
                        { id: "all" as const, label: "All", count: grants.length },
                        {
                          id: "yes" as const,
                          label: "FQHC Eligible",
                          count: eligibilityCounts.yes,
                        },
                        {
                          id: "likely" as const,
                          label: "Likely",
                          count: eligibilityCounts.likely,
                        },
                        {
                          id: "verify" as const,
                          label: "Verify",
                          count: eligibilityCounts.verify,
                        },
                        {
                          id: "unlikely" as const,
                          label: "Unlikely",
                          count: eligibilityCounts.unlikely,
                        },
                      ] as const
                    ).map(({ id, label, count }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setEligibilityFilter(id)}
                        className={`text-[11px] px-2 py-1 rounded-md font-medium border transition-colors ${
                          eligibilityFilter === id
                            ? "bg-rockland-navy/10 border-rockland-navy/25 text-rockland-navy"
                            : "border-transparent text-rockland-navy/45 hover:text-rockland-navy"
                        }`}
                      >
                        {label}
                        <span className="text-rockland-navy/35 ml-0.5">
                          ({count})
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
              <div className="max-h-[calc(100vh-420px)] overflow-y-auto pr-1">
                <GrantList
                  grants={displayGrants}
                  assessments={displayAssessments}
                  selectedGrantId={selectedGrantId}
                  pipelineGrantIds={pipelineGrantIds}
                  onSelectGrant={(id) => {
                    setSelectedGrantId(id);
                    setActiveTab("detail");
                  }}
                  source={source}
                  isLoading={isLoading}
                  compareGrantIds={compareGrantIds}
                  onToggleCompare={handleToggleCompare}
                  newGrantIds={newGrantIds}
                />
              </div>
            </div>
          </div>

          {/* Right: Detail + Pipeline */}
          <div className="col-span-12 lg:col-span-8">
            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-rockland-gray/50 p-1 rounded-lg w-fit">
              <button
                onClick={() => setActiveTab("detail")}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  activeTab === "detail"
                    ? "bg-white text-rockland-navy shadow-sm"
                    : "text-rockland-navy/50 hover:text-rockland-navy"
                }`}
              >
                Grant Detail
              </button>
              <button
                onClick={() => setActiveTab("pipeline")}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  activeTab === "pipeline"
                    ? "bg-white text-rockland-navy shadow-sm"
                    : "text-rockland-navy/50 hover:text-rockland-navy"
                }`}
              >
                Pipeline
                {pipeline.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-rockland-teal/15 text-rockland-teal rounded-full">
                    {pipeline.length}
                  </span>
                )}
              </button>
              {compareGrantIds.size >= 2 && (
                <button
                  onClick={() => setActiveTab("compare")}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                    activeTab === "compare"
                      ? "bg-white text-rockland-navy shadow-sm"
                      : "text-rockland-navy/50 hover:text-rockland-navy"
                  }`}
                >
                  Compare
                  <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-rockland-green/15 text-rockland-green rounded-full">
                    {compareGrantIds.size}
                  </span>
                </button>
              )}
              <button
                onClick={() => setActiveTab("ai-advisor")}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  activeTab === "ai-advisor"
                    ? "bg-white text-rockland-navy shadow-sm"
                    : "text-rockland-navy/50 hover:text-rockland-navy"
                }`}
              >
                <span className="bg-gradient-to-r from-rockland-teal to-rockland-green bg-clip-text text-transparent font-semibold">
                  ✦ AI Advisor
                </span>
              </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl border border-rockland-gray p-6 min-h-[400px]">
              {activeTab === "detail" ? (
                selectedGrant && selectedAssessment ? (
                  <GrantDetail
                    grant={selectedGrant}
                    assessment={selectedAssessment}
                    profile={profile}
                    isInPipeline={pipelineGrantIds.has(selectedGrant.id)}
                    onSaveToPipeline={handleSaveToPipeline}
                    aiSummary={aiSummary}
                    aiSummarySource={aiSummarySource}
                    aiSummaryLoading={aiSummaryLoading}
                    onRequestSummary={handleRequestSummary}
                    enrichedDetail={enrichedDetail}
                    enrichedLoading={enrichedLoading}
                  />
                ) : selectedPipelineItem ? (
                  <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                      <p className="text-sm text-amber-700">
                        This grant is no longer in the current search results. Showing saved info.
                      </p>
                    </div>
                    <h2 className="text-lg font-bold text-rockland-navy">{selectedPipelineItem.grantTitle}</h2>
                    {selectedPipelineItem.grantDeadline && (
                      <div className="bg-rockland-cream rounded-lg p-3">
                        <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-0.5">
                          Deadline
                        </p>
                        <p className="text-sm font-semibold text-rockland-navy">
                          {new Date(selectedPipelineItem.grantDeadline).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    )}
                    <div className="bg-rockland-cream rounded-lg p-3">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-0.5">
                        Pipeline Status
                      </p>
                      <p className="text-sm font-semibold text-rockland-navy">{selectedPipelineItem.status}</p>
                    </div>
                    {selectedPipelineItem.nextStep && (
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-blue-900 mb-1">Next Step</h3>
                        <p className="text-sm text-blue-800">{selectedPipelineItem.nextStep}</p>
                      </div>
                    )}
                    {selectedPipelineItem.note && (
                      <div className="bg-rockland-cream border border-rockland-gray rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-rockland-navy mb-1">Your note</h3>
                        <p className="text-sm text-rockland-navy/80 whitespace-pre-wrap">
                          {selectedPipelineItem.note}
                        </p>
                      </div>
                    )}
                    {selectedPipelineItem.grantUrl && (
                      <a
                        href={selectedPipelineItem.grantUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-4 py-2.5 border border-rockland-gray text-rockland-navy text-sm font-semibold rounded-lg hover:bg-rockland-cream transition-colors"
                      >
                        View on Grants.gov
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[400px] text-rockland-navy/40">
                    <div className="text-center">
                      <p className="text-2xl mb-2">👈</p>
                      <p className="text-lg font-medium mb-1">
                        Select a grant to review
                      </p>
                      <p className="text-sm max-w-xs">
                        Click any grant from the list to see eligibility details, AI analysis, and recommended next steps
                      </p>
                    </div>
                  </div>
                )
              ) : activeTab === "compare" ? (
                <GrantComparison
                  grants={grants.filter((g) => compareGrantIds.has(g.id))}
                  assessments={assessments.filter((a) => compareGrantIds.has(a.grantId))}
                  onSelectGrant={(id) => {
                    setSelectedGrantId(id);
                    setActiveTab("detail");
                  }}
                  onRemoveFromCompare={handleToggleCompare}
                />
              ) : activeTab === "ai-advisor" ? (
                <AiTopPicks
                  grants={grants}
                  assessments={assessments}
                  profile={profile}
                  onSelectGrant={(id) => {
                    setSelectedGrantId(id);
                    setActiveTab("detail");
                  }}
                  onSaveToPipeline={handleSaveToPipelineById}
                  pipelineGrantIds={pipelineGrantIds}
                />
              ) : (
                <div>
                  <h2 className="text-sm font-semibold text-rockland-navy mb-4">
                    Your Grant Pipeline
                  </h2>
                  <Pipeline
                    items={pipeline}
                    onUpdateStatus={handleUpdateStatus}
                    onRemove={handleRemoveFromPipeline}
                    onSelectGrant={handleSelectGrantFromPipeline}
                    onUpdateNote={handleUpdatePipelineNote}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function HomeWithClerk() {
  const { isLoaded, isSignedIn } = useAuth();
  return (
    <HomeContent
      isLoaded={Boolean(isLoaded)}
      isSignedIn={Boolean(isSignedIn)}
    />
  );
}

export default function Home() {
  if (!isClerkConfigured()) {
    return <HomeContent isLoaded isSignedIn={false} />;
  }
  return <HomeWithClerk />;
}
