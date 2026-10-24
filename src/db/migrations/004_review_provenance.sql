ALTER TABLE snapshots ADD COLUMN IF NOT EXISTS passages jsonb;

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS created_by text;

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS decision jsonb;
