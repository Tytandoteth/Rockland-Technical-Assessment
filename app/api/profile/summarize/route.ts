import { NextRequest, NextResponse } from "next/server";

interface ProfileInput {
  clinicName: string;
  state: string;
  clinicType: string;
  staffSize: string;
  focusAreas: string[];
  otherFocusArea?: string;
  patientDescription: string;
  currentGrants?: string;
  biggestNeed?: string;
}

interface ProfileSummary {
  focusAreas: string[];
  patientPopulationNotes: string;
  scoringKeywords: string[];
  profileSummary: string;
}

function buildPrompt(input: ProfileInput): string {
  return `You are helping an FQHC (Federally Qualified Health Center) set up a grant discovery tool. Based on the clinic's self-description below, produce a structured profile that will be used to match grants.

Clinic Info:
- Name: ${input.clinicName}
- State: ${input.state}
- Type: ${input.clinicType}
- Staff size: ${input.staffSize}
- Selected focus areas: ${input.focusAreas.join(", ")}${input.otherFocusArea ? `, ${input.otherFocusArea}` : ""}
- Patient population: ${input.patientDescription}
- Current/recent grants: ${input.currentGrants || "Not specified"}
- Biggest funding need: ${input.biggestNeed || "Not specified"}

Return a JSON object with exactly these fields:
{
  "focusAreas": [array of 5-8 lowercase focus area strings optimized for grant keyword matching, based on what the clinic described],
  "patientPopulationNotes": "A 1-2 sentence summary of who this clinic serves, written for grant matching context",
  "scoringKeywords": [array of 10-15 lowercase keywords that should boost grant relevance scoring — include medical specialties, population descriptors, service types, and regulatory terms relevant to this clinic],
  "profileSummary": "A 2-3 sentence summary of this clinic's profile for display purposes"
}

Return ONLY valid JSON, no markdown fences.`;
}

function buildFallbackProfile(input: ProfileInput): ProfileSummary {
  const focusAreas = [
    ...input.focusAreas.map((a) => a.toLowerCase()),
    ...(input.otherFocusArea ? [input.otherFocusArea.toLowerCase()] : []),
  ];

  return {
    focusAreas,
    patientPopulationNotes:
      input.patientDescription || "Community health center serving diverse populations.",
    scoringKeywords: [
      ...focusAreas,
      input.clinicType.toLowerCase(),
      "community health",
      "health center",
      "underserved",
      "primary care",
    ],
    profileSummary: `${input.clinicName} is a ${input.clinicType} in ${input.state} with ${input.staffSize} staff, focusing on ${focusAreas.slice(0, 3).join(", ")}.`,
  };
}

export async function POST(request: NextRequest) {
  let input: ProfileInput;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      ...buildFallbackProfile(input),
      source: "heuristic",
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: buildPrompt(input) }],
        max_tokens: 500,
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) throw new Error(`OpenAI returned ${response.status}`);

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) throw new Error("Empty response");

    // Parse JSON, stripping markdown fences if present
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed: ProfileSummary = JSON.parse(cleaned);

    return NextResponse.json({ ...parsed, source: "ai" });
  } catch (error) {
    console.error("Profile summarization failed:", error);
    return NextResponse.json({
      ...buildFallbackProfile(input),
      source: "heuristic",
    });
  }
}
