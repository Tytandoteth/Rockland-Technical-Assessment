import { NextRequest, NextResponse } from "next/server";

/** Narrow spike: does this UEI return a public SAM.gov entity record? */
const SAM_ENTITIES_URL = "https://api.sam.gov/entity-information/v3/entities";

interface SamVerifyBody {
  uei?: string;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** UEI SAM is 12 alphanumeric characters */
function normalizeUei(raw: string): string | null {
  const s = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (!/^[A-Z0-9]{12}$/.test(s)) return null;
  return s;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const apiKey = process.env.SAM_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({
      status: "unconfigured" as const,
      message:
        "SAM.gov verification is not configured. Set SAM_API_KEY to enable entity lookup (see ARCHITECTURE.md).",
    });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isRecord(raw)) {
    return NextResponse.json({ error: "Expected JSON object" }, { status: 400 });
  }

  const uei = normalizeUei(String((raw as SamVerifyBody).uei ?? ""));
  if (!uei) {
    return NextResponse.json(
      {
        error: "Invalid UEI",
        message: "Provide a 12-character Unique Entity ID (UEI).",
      },
      { status: 400 }
    );
  }

  try {
    const url = new URL(SAM_ENTITIES_URL);
    url.searchParams.set("ueiSAM", uei);
    url.searchParams.set("api_key", apiKey);

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json({
        status: "unavailable" as const,
        message: `SAM.gov returned ${res.status}. Verification could not be completed.`,
        detail: text.slice(0, 200),
      });
    }

    const data: unknown = await res.json();
    const entityList = extractEntityList(data);
    const found = entityList.length > 0;

    return NextResponse.json({
      status: "ok" as const,
      uei,
      found,
      message: found
        ? "SAM.gov returned at least one entity record for this UEI (public data)."
        : "No active public entity record matched this UEI in the response. Confirm the UEI or check registration status on SAM.gov.",
      recordCount: entityList.length,
    });
  } catch (e) {
    return NextResponse.json({
      status: "unavailable" as const,
      message:
        e instanceof Error
          ? `Network error: ${e.message}`
          : "Unknown error calling SAM.gov",
    });
  }
}

function extractEntityList(data: unknown): unknown[] {
  if (!isRecord(data)) return [];
  // Common SAM v3 shapes — tolerate variations
  const direct = data.entityData;
  if (Array.isArray(direct)) return direct;
  const nested = data.entityManagementRegistrationResponse;
  if (isRecord(nested) && Array.isArray(nested.entityData)) {
    return nested.entityData;
  }
  if (Array.isArray(data.entities)) return data.entities;
  return [];
}
