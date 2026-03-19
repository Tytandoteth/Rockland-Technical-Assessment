"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ClinicProfile as ClinicProfileType,
  GrantOpportunity,
  GrantAssessment,
  PipelineItem,
  GrantsApiResponse,
} from "@/lib/types";
import { DEFAULT_CLINIC_PROFILE } from "@/lib/clinic-profile";
import {
  getPipeline,
  saveToPipeline,
  updatePipelineItem,
  removeFromPipeline,
} from "@/lib/pipeline";
import OnboardingWizard from "@/components/OnboardingWizard";
import ClinicProfile from "@/components/ClinicProfile";
import GrantList from "@/components/GrantList";
import GrantDetail from "@/components/GrantDetail";
import Pipeline from "@/components/Pipeline";

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

export default function Home() {
  const [profile, setProfile] = useState<ClinicProfileType | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const [grants, setGrants] = useState<GrantOpportunity[]>([]);
  const [assessments, setAssessments] = useState<GrantAssessment[]>([]);
  const [selectedGrantId, setSelectedGrantId] = useState<string | null>(null);
  const [pipeline, setPipeline] = useState<PipelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [source, setSource] = useState<"grants.gov" | "fallback">("grants.gov");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"detail" | "pipeline">("detail");

  // AI summary state
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiSummarySource, setAiSummarySource] = useState<"ai" | "heuristic" | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const lastSummarizedGrantId = useRef<string | null>(null);

  // Enriched detail state
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
  }
  const [enrichedDetail, setEnrichedDetail] = useState<EnrichedDetail | null>(null);
  const [enrichedLoading, setEnrichedLoading] = useState(false);
  const lastEnrichedGrantId = useRef<string | null>(null);

  // Initialize: check for saved profile
  useEffect(() => {
    const saved = loadSavedProfile();
    if (saved) {
      setProfile(saved);
      setShowWizard(false);
    } else {
      setShowWizard(true);
    }
    setInitialized(true);
  }, []);

  // Fetch grants when profile is available
  const fetchGrants = useCallback(async (p: ClinicProfileType) => {
    setIsLoading(true);
    setError(null);
    try {
      // Send full stored profile (may include AI-generated scoringKeywords)
      const storedRaw = localStorage.getItem(PROFILE_KEY);
      const fullProfile = storedRaw ? JSON.parse(storedRaw) : p;

      const res = await fetch("/api/grants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: fullProfile }),
      });

      if (!res.ok) throw new Error("Failed to fetch grants");

      const data: GrantsApiResponse = await res.json();
      setGrants(data.grants);
      setAssessments(data.assessments);
      setSource(data.source);

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

  // Load pipeline from localStorage
  useEffect(() => {
    setPipeline(getPipeline());
  }, []);

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
  }, [selectedGrant, selectedAssessment, profile]);

  const handleSaveToPipeline = useCallback(() => {
    if (!selectedGrant || !selectedAssessment) return;
    const item: PipelineItem = {
      id: `pipeline-${Date.now()}`,
      grantId: selectedGrant.id,
      grantTitle: selectedGrant.title,
      grantDeadline: selectedGrant.deadline || undefined,
      grantUrl: selectedGrant.url || undefined,
      status: "To Review",
      nextStep: selectedAssessment.recommendedAction,
      savedAt: new Date().toISOString(),
    };
    const updated = saveToPipeline(item);
    setPipeline(updated);
    setActiveTab("pipeline");
  }, [selectedGrant, selectedAssessment]);

  const handleUpdateStatus = useCallback(
    (grantId: string, status: PipelineItem["status"]) => {
      const updated = updatePipelineItem(grantId, { status });
      setPipeline(updated);
    },
    []
  );

  const handleRemoveFromPipeline = useCallback((grantId: string) => {
    const updated = removeFromPipeline(grantId);
    setPipeline(updated);
  }, []);

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

  const handleEditProfile = useCallback(() => {
    setShowWizard(true);
  }, []);

  // Don't render until we've checked localStorage
  if (!initialized) return null;

  // Show wizard if no profile
  if (showWizard || !profile) {
    return <OnboardingWizard onComplete={handleWizardComplete} />;
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
          <div className="text-right">
            <p className="text-xs text-rockland-navy/70 font-medium">
              {profile.clinicName}
            </p>
            <p className="text-[10px] text-rockland-navy/40">
              {profile.clinicType} · {profile.state}
            </p>
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

            {/* Grant List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-rockland-navy">
                  Recommended Grants
                  {!isLoading && (
                    <span className="text-rockland-navy/40 font-normal ml-1.5">
                      ({grants.length})
                    </span>
                  )}
                </h2>
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
              <div className="max-h-[calc(100vh-420px)] overflow-y-auto pr-1">
                <GrantList
                  grants={grants}
                  assessments={assessments}
                  selectedGrantId={selectedGrantId}
                  pipelineGrantIds={pipelineGrantIds}
                  onSelectGrant={(id) => {
                    setSelectedGrantId(id);
                    setActiveTab("detail");
                  }}
                  source={source}
                  isLoading={isLoading}
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
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl border border-rockland-gray p-6 min-h-[400px]">
              {activeTab === "detail" ? (
                selectedGrant && selectedAssessment ? (
                  <GrantDetail
                    grant={selectedGrant}
                    assessment={selectedAssessment}
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
                      <p className="text-lg font-medium mb-1">
                        Select a grant to review
                      </p>
                      <p className="text-sm">
                        Click any grant from the list to see details and
                        qualification info
                      </p>
                    </div>
                  </div>
                )
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
