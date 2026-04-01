-- Run in Neon SQL editor (or psql) after creating a project.
-- Pipeline: one row per user + grant; upsert on (user_id, grant_id).

CREATE TABLE IF NOT EXISTS pipeline_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  grant_id TEXT NOT NULL,
  grant_title TEXT NOT NULL,
  grant_deadline DATE,
  grant_url TEXT,
  status TEXT NOT NULL,
  next_step TEXT,
  note TEXT,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, grant_id)
);

CREATE INDEX IF NOT EXISTS idx_pipeline_items_user_id ON pipeline_items (user_id);

CREATE TABLE IF NOT EXISTS clinic_profiles (
  user_id TEXT PRIMARY KEY,
  profile JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
