"use client";

import { useState, useEffect } from "react";
import { SignInButton } from "@clerk/nextjs";
import { ClinicProfile } from "@/lib/types";
import { isClerkConfigured } from "@/lib/clerk-client";

const PROFILE_STORAGE_KEY = "rockland-clinic-profile";

interface OnboardingWizardProps {
  onComplete: (profile: ClinicProfile) => void;
  /** When set (e.g. user clicked Edit), pre-fill all steps from saved profile + localStorage extras */
  initialProfile?: ClinicProfile | null;
  /** Clerk session; use `{ isLoaded: true, isSignedIn: false }` when Clerk is not configured */
  clerkAuth: { isSignedIn: boolean; isLoaded: boolean };
}

const FOCUS_AREA_OPTIONS = [
  "behavioral health",
  "dental",
  "preventive care",
  "substance abuse treatment",
  "maternal health",
  "pediatric care",
  "chronic disease management",
  "telehealth",
  "HIV/AIDS services",
  "geriatric care",
];

const CLINIC_TYPES = ["FQHC", "FQHC Look-Alike", "Community Health Center", "Rural Health Clinic", "Free Clinic"];

const STAFF_SIZES = ["1-25 staff", "25-50 staff", "50-100 staff", "100-200 staff", "200-500 staff", "500+ staff"];

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming",
];

const SAMPLE_PRESETS = [
  {
    label: "Rural FQHC",
    clinicName: "Sunrise Community Health Center",
    state: "Colorado",
    clinicType: "FQHC",
    staffSize: "100-200 staff",
    focusAreas: ["behavioral health", "dental", "preventive care", "chronic disease management"],
    patientDescription: "Low-income, uninsured/underinsured patients in rural and semi-urban areas. High rates of diabetes, hypertension, and behavioral health needs.",
    currentGrants: "HRSA Health Center Program",
    biggestNeed: "Expanding behavioral health and dental services",
  },
  {
    label: "Urban Safety-Net",
    clinicName: "Metro Community Health",
    state: "California",
    clinicType: "FQHC",
    staffSize: "200-500 staff",
    focusAreas: ["behavioral health", "substance abuse treatment", "HIV/AIDS services", "maternal health"],
    patientDescription: "Predominantly Medicaid and uninsured patients in urban setting. Diverse immigrant populations with language barriers. High prevalence of substance use disorders and mental health needs.",
    currentGrants: "SAMHSA CCBHC grant, Ryan White HIV/AIDS Program",
    biggestNeed: "Integrated behavioral health and primary care",
  },
  {
    label: "Small Rural Clinic",
    clinicName: "Valley Family Health",
    state: "Montana",
    clinicType: "Rural Health Clinic",
    staffSize: "25-50 staff",
    focusAreas: ["preventive care", "maternal health", "telehealth", "chronic disease management"],
    patientDescription: "Rural farming communities, elderly patients, migrant workers. Limited specialist access — nearest hospital is 60 miles away.",
    currentGrants: "",
    biggestNeed: "Telehealth expansion and maternal care",
  },
];

async function syncProfileToServer(profile: ClinicProfile): Promise<void> {
  try {
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
  } catch {
    // Signed-out or DB unset — ignore
  }
}

export default function OnboardingWizard({
  onComplete,
  initialProfile = null,
  clerkAuth,
}: OnboardingWizardProps) {
  const { isSignedIn, isLoaded } = clerkAuth;
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Basics
  const [clinicName, setClinicName] = useState("");
  const [state, setState] = useState("");
  const [clinicType, setClinicType] = useState("FQHC");
  const [staffSize, setStaffSize] = useState("50-100 staff");

  // Step 2: Focus Areas
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>([]);
  const [otherFocusArea, setOtherFocusArea] = useState("");

  // Step 3: Population & Needs
  const [patientDescription, setPatientDescription] = useState("");
  const [currentGrants, setCurrentGrants] = useState("");
  const [biggestNeed, setBiggestNeed] = useState("");

  useEffect(() => {
    if (!initialProfile) return;
    setClinicName(initialProfile.clinicName);
    setState(initialProfile.state);
    setClinicType(initialProfile.clinicType);
    setStaffSize(initialProfile.orgSizeBand || "50-100 staff");
    setSelectedFocusAreas([...initialProfile.focusAreas]);
    setOtherFocusArea("");
    setPatientDescription(initialProfile.patientPopulationNotes || "");
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (raw) {
        const o = JSON.parse(raw) as {
          currentGrants?: string;
          biggestNeed?: string;
        };
        setCurrentGrants(o.currentGrants || "");
        setBiggestNeed(o.biggestNeed || "");
      }
    } catch {
      setCurrentGrants("");
      setBiggestNeed("");
    }
    setStep(1);
  }, [initialProfile]);

  function loadPreset(preset: typeof SAMPLE_PRESETS[number]) {
    setClinicName(preset.clinicName);
    setState(preset.state);
    setClinicType(preset.clinicType);
    setStaffSize(preset.staffSize);
    setSelectedFocusAreas(preset.focusAreas);
    setOtherFocusArea("");
    setPatientDescription(preset.patientDescription);
    setCurrentGrants(preset.currentGrants);
    setBiggestNeed(preset.biggestNeed);
    setStep(3); // Jump to final step so user can review and submit
  }

  function toggleFocusArea(area: string) {
    setSelectedFocusAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  }

  async function handleSubmit() {
    setIsSubmitting(true);

    const focusAreas =
      selectedFocusAreas.length > 0
        ? selectedFocusAreas
        : ["behavioral health", "preventive care", "underserved populations"];

    try {
      const res = await fetch("/api/profile/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicName: clinicName || "My Health Center",
          state: state || "Colorado",
          clinicType,
          staffSize,
          focusAreas,
          otherFocusArea: otherFocusArea || undefined,
          patientDescription,
          currentGrants: currentGrants || undefined,
          biggestNeed: biggestNeed || undefined,
        }),
      });

      const data = await res.json();

      const profile: ClinicProfile = {
        id: initialProfile?.id ?? `clinic-${Date.now()}`,
        clinicName: clinicName || "My Health Center",
        state: state || "Colorado",
        clinicType,
        focusAreas: data.focusAreas || focusAreas,
        patientPopulationNotes: data.patientPopulationNotes || patientDescription || undefined,
        orgSizeBand: staffSize,
      };

      // Store AI-generated scoring keywords alongside the profile
      const enrichedProfile = {
        ...profile,
        scoringKeywords: data.scoringKeywords || [],
        profileSummary: data.profileSummary || "",
        source: data.source || "heuristic",
        currentGrants: currentGrants || undefined,
        biggestNeed: biggestNeed || undefined,
      };

      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(enrichedProfile));
      if (isClerkConfigured() && isLoaded && isSignedIn) {
        await syncProfileToServer(enrichedProfile as ClinicProfile);
      }
      onComplete(enrichedProfile as ClinicProfile);
    } catch {
      // Fallback: use raw input
      let prevKeywords: string[] = [];
      try {
        const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
        if (raw) prevKeywords = JSON.parse(raw).scoringKeywords || [];
      } catch {
        prevKeywords = [];
      }
      const profile: ClinicProfile = {
        id: initialProfile?.id ?? `clinic-${Date.now()}`,
        clinicName: clinicName || "My Health Center",
        state: state || "Colorado",
        clinicType,
        focusAreas,
        patientPopulationNotes: patientDescription || undefined,
        orgSizeBand: staffSize,
      };
      const withExtras = {
        ...profile,
        scoringKeywords: prevKeywords.length > 0 ? prevKeywords : undefined,
        currentGrants: currentGrants || undefined,
        biggestNeed: biggestNeed || undefined,
      };
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(withExtras));
      if (isClerkConfigured() && isLoaded && isSignedIn) {
        await syncProfileToServer(withExtras as ClinicProfile);
      }
      onComplete(withExtras as ClinicProfile);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-rockland-cream flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-rockland-gray shadow-lg p-8 max-w-lg w-full relative">
        <div className="absolute top-4 right-4">
          {isClerkConfigured() && !isSignedIn && (
            <SignInButton mode="modal">
              <button
                type="button"
                className="text-[10px] font-semibold text-rockland-teal hover:text-rockland-teal/80"
              >
                Sign in
              </button>
            </SignInButton>
          )}
        </div>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-rockland-navy">
            Rockland
            <span className="text-rockland-teal ml-1.5 text-sm font-medium">
              Grant Discovery
            </span>
          </h1>
          <p className="text-sm text-rockland-navy/60 mt-1">
            {initialProfile
              ? "Update your clinic profile — your previous answers are pre-filled below."
              : "Tell us about your clinic so we can find the best grants for you."}
          </p>
          {/* Progress */}
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-rockland-teal" : "bg-rockland-gray"
                }`}
              />
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5">
            Step {step} of 3
          </p>
        </div>

        {/* Sample Presets */}
        {step === 1 && (
          <div className="mb-5 pb-5 border-b border-gray-100">
            <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-2">
              Quick Start — use a sample clinic
            </p>
            <div className="flex gap-2 flex-wrap">
              {SAMPLE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => loadPreset(preset)}
                  className="px-3 py-1.5 text-xs font-medium bg-rockland-cream text-rockland-navy/70 border border-rockland-gray rounded-lg hover:bg-rockland-teal/10 hover:border-rockland-teal/30 hover:text-rockland-teal transition-all"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Basics */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-rockland-navy">
              Clinic Basics
            </h2>

            <div>
              <label className="text-xs font-medium text-rockland-navy/70 block mb-1">
                Clinic Name
              </label>
              <input
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder="e.g., Sunrise Community Health Center"
                className="w-full px-3 py-2 text-sm border border-rockland-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-rockland-teal focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-rockland-navy/70 block mb-1">
                  State
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-rockland-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-rockland-teal bg-white"
                >
                  <option value="">Select state</option>
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-rockland-navy/70 block mb-1">
                  Clinic Type
                </label>
                <select
                  value={clinicType}
                  onChange={(e) => setClinicType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-rockland-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-rockland-teal bg-white"
                >
                  {CLINIC_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-rockland-navy/70 block mb-1">
                Staff Size
              </label>
              <select
                value={staffSize}
                onChange={(e) => setStaffSize(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-rockland-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-rockland-teal bg-white"
              >
                {STAFF_SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full px-4 py-2.5 bg-rockland-green text-white text-sm font-semibold rounded-lg hover:bg-rockland-green/90 transition-colors mt-2"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Focus Areas */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-rockland-navy">
              What does your clinic focus on?
            </h2>
            <p className="text-xs text-gray-500">
              Select all that apply. This helps us match relevant grants.
            </p>

            <div className="flex flex-wrap gap-2">
              {FOCUS_AREA_OPTIONS.map((area) => (
                <button
                  key={area}
                  onClick={() => toggleFocusArea(area)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                    selectedFocusAreas.includes(area)
                      ? "bg-rockland-green text-white border-blue-600"
                      : "bg-white text-rockland-navy/70 border-rockland-gray hover:border-rockland-teal"
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs font-medium text-rockland-navy/70 block mb-1">
                Other focus area (optional)
              </label>
              <input
                type="text"
                value={otherFocusArea}
                onChange={(e) => setOtherFocusArea(e.target.value)}
                placeholder="e.g., refugee health, school-based clinics"
                className="w-full px-3 py-2 text-sm border border-rockland-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-rockland-teal"
              />
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2.5 border border-rockland-gray text-rockland-navy text-sm font-semibold rounded-lg hover:bg-rockland-cream transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 px-4 py-2.5 bg-rockland-green text-white text-sm font-semibold rounded-lg hover:bg-rockland-green/90 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Population & Needs */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-rockland-navy">
              Tell us about your patients and needs
            </h2>

            <div>
              <label className="text-xs font-medium text-rockland-navy/70 block mb-1">
                Who do you serve?
              </label>
              <textarea
                value={patientDescription}
                onChange={(e) => setPatientDescription(e.target.value)}
                placeholder="e.g., Low-income families, Medicaid patients, rural communities with high rates of diabetes and behavioral health needs..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-rockland-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-rockland-teal resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-rockland-navy/70 block mb-1">
                Any current or recent grants? (optional)
              </label>
              <input
                type="text"
                value={currentGrants}
                onChange={(e) => setCurrentGrants(e.target.value)}
                placeholder="e.g., HRSA Health Center Program, SAMHSA block grant"
                className="w-full px-3 py-2 text-sm border border-rockland-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-rockland-teal"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-rockland-navy/70 block mb-1">
                Biggest funding need right now? (optional)
              </label>
              <input
                type="text"
                value={biggestNeed}
                onChange={(e) => setBiggestNeed(e.target.value)}
                placeholder="e.g., Expanding behavioral health services, new dental clinic"
                className="w-full px-3 py-2 text-sm border border-rockland-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-rockland-teal"
              />
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2.5 border border-rockland-gray text-rockland-navy text-sm font-semibold rounded-lg hover:bg-rockland-cream transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-rockland-green text-white text-sm font-semibold rounded-lg hover:bg-rockland-green/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Setting up your profile...
                  </span>
                ) : initialProfile ? (
                  "Save changes"
                ) : (
                  "Find My Grants"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Skip option */}
        <button
          onClick={() => {
            const defaultProfile: ClinicProfile = {
              id: "clinic-default",
              clinicName: "Sample Health Center",
              state: "Colorado",
              clinicType: "FQHC",
              focusAreas: ["behavioral health", "dental", "preventive care", "underserved populations", "Medicaid populations"],
              patientPopulationNotes: "Low-income, uninsured/underinsured patients in rural and semi-urban areas.",
              orgSizeBand: "100-200 staff",
            };
            localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(defaultProfile));
            onComplete(defaultProfile);
          }}
          className="w-full mt-4 text-xs text-rockland-navy/40 hover:text-rockland-navy/60 transition-colors text-center"
        >
          Skip — use sample clinic profile
        </button>
      </div>
    </div>
  );
}
