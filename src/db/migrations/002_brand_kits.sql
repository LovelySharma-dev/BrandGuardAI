CREATE TABLE IF NOT EXISTS brand_kits (
  id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES organisations (id),
  name text NOT NULL,
  version text NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'published')),
  document jsonb NOT NULL,
  published_at timestamptz,
  UNIQUE (org_id, version)
);

CREATE UNIQUE INDEX IF NOT EXISTS brand_kits_one_draft_per_org
  ON brand_kits (org_id)
  WHERE status = 'draft';
