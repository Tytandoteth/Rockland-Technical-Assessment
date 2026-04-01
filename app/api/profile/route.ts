import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import type { ClinicProfile } from "@/lib/types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isValidProfileBody(v: unknown): v is ClinicProfile & Record<string, unknown> {
  if (!isRecord(v)) return false;
  if (typeof v.id !== "string" || !v.id) return false;
  if (typeof v.clinicName !== "string") return false;
  if (typeof v.state !== "string") return false;
  if (typeof v.clinicType !== "string") return false;
  if (!Array.isArray(v.focusAreas)) return false;
  return v.focusAreas.every((x) => typeof x === "string");
}

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ profile: null, source: "localStorage" as const });
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ profile: null, source: "localStorage" as const });
    }

    const sql = getDb();
    const rows = await sql`
      SELECT profile FROM clinic_profiles WHERE user_id = ${userId} LIMIT 1
    `;
    const row = rows[0] as { profile: unknown } | undefined;
    if (!row?.profile) {
      return NextResponse.json({ profile: null, source: "database" as const });
    }

    const profile =
      typeof row.profile === "string"
        ? JSON.parse(row.profile)
        : row.profile;
    return NextResponse.json({
      profile,
      source: "database" as const,
    });
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return NextResponse.json({
      profile: null,
      source: "localStorage" as const,
      error: "Database unavailable",
    });
  }
}

export async function PUT(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: true, source: "localStorage" as const });
  }

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: true, source: "localStorage" as const });
    }

    const body: unknown = await request.json();
    if (!isValidProfileBody(body)) {
      return NextResponse.json(
        { error: "Invalid profile body" },
        { status: 400 }
      );
    }

    const payload = JSON.stringify(body);
    const sql = getDb();
    await sql`
      INSERT INTO clinic_profiles (user_id, profile, updated_at)
      VALUES (${userId}, ${payload}::jsonb, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        profile = EXCLUDED.profile,
        updated_at = NOW()
    `;

    return NextResponse.json({ success: true, source: "database" as const });
  } catch (error) {
    console.error("Failed to save profile:", error);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
