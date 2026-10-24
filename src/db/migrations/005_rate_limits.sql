CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  bucket text NOT NULL,
  window_start timestamptz NOT NULL,
  count integer NOT NULL,
  PRIMARY KEY (bucket, window_start)
);
