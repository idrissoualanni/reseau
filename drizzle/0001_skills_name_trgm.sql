-- Index trigramme exigé par les fiches F04/F09 (autocomplétion et tolérance aux fautes).
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS skills_name_trgm ON skills USING gin (name gin_trgm_ops);
