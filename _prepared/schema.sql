-- Rockland Grant Discovery — Neon Postgres Schema
-- Run: psql $DATABASE_URL -f schema.sql

-- Synthetic grant opportunities (seeded data for demo)
CREATE TABLE IF NOT EXISTS grants (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  agency TEXT NOT NULL,
  deadline DATE,
  amount_min INTEGER,
  amount_max INTEGER,
  eligibility_text TEXT,
  summary TEXT,
  url TEXT,
  source TEXT NOT NULL DEFAULT 'synthetic',
  raw_tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pipeline items (user-saved grants with status tracking)
CREATE TABLE IF NOT EXISTS pipeline_items (
  id TEXT PRIMARY KEY,
  grant_id TEXT NOT NULL,
  grant_title TEXT NOT NULL,
  grant_deadline DATE,
  grant_url TEXT,
  status TEXT NOT NULL DEFAULT 'To Review',
  next_step TEXT,
  note TEXT,
  saved_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Clinic profiles
CREATE TABLE IF NOT EXISTS clinic_profiles (
  id TEXT PRIMARY KEY,
  clinic_name TEXT NOT NULL,
  state TEXT NOT NULL,
  clinic_type TEXT NOT NULL,
  focus_areas TEXT[] NOT NULL,
  patient_population_notes TEXT,
  org_size_band TEXT,
  scoring_keywords TEXT[],
  profile_summary TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for pipeline lookups
CREATE INDEX IF NOT EXISTS idx_pipeline_grant_id ON pipeline_items(grant_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_status ON pipeline_items(status);
CREATE INDEX IF NOT EXISTS idx_grants_source ON grants(source);
