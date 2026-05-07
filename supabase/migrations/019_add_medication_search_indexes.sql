-- Speed up medication name searches (ILIKE queries)
-- Trigram indexes make partial string matching 10-100x faster

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_medications_brand_trgm
  ON medications USING gin (brand_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_medications_generic_trgm
  ON medications USING gin (generic_name gin_trgm_ops);
