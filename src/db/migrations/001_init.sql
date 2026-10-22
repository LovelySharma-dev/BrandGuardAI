CREATE TABLE IF NOT EXISTS schema_migrations (
  id text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organisations (
  id text PRIMARY KEY,
  name text NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES organisations (id),
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('author', 'reviewer', 'admin')),
  password_hash text NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users (id),
  expires_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS snapshots (
  id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES organisations (id),
  kit_version text NOT NULL,
  source_ids jsonb NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES organisations (id),
  title text NOT NULL,
  body text NOT NULL,
  intent jsonb NOT NULL,
  status text NOT NULL,
  kit_version text NOT NULL,
  snapshot_id text REFERENCES snapshots (id),
  findings jsonb NOT NULL,
  revisions jsonb NOT NULL,
  error_message text,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS reviews_org_updated_idx
  ON reviews (org_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS audit_events (
  seq bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id text NOT NULL UNIQUE,
  org_id text NOT NULL REFERENCES organisations (id),
  actor_id text NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  before jsonb,
  after jsonb,
  at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS audit_events_org_seq_idx
  ON audit_events (org_id, seq);
