-- V1.5 — galerie de 5 images par post et par projet (V1.5).
-- Migration additive et idempotente : la couverture reste `image_key` /
-- `cover_key`, `image_keys` porte les images 2 à 5 (max 4).

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS image_keys text[] NOT NULL DEFAULT '{}'::text[];

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS image_keys text[] NOT NULL DEFAULT '{}'::text[];

ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_image_keys_check;
ALTER TABLE posts
  ADD CONSTRAINT posts_image_keys_check
  CHECK (cardinality(image_keys) BETWEEN 0 AND 4);

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_image_keys_check;
ALTER TABLE projects
  ADD CONSTRAINT projects_image_keys_check
  CHECK (cardinality(image_keys) BETWEEN 0 AND 4);
