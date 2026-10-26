-- V1.5 — J'aime des posts (F11) et mise à jour image-only (F20).
-- Migration additive et idempotente.

CREATE TABLE IF NOT EXISTS post_likes (
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, profile_id)
);

CREATE INDEX IF NOT EXISTS post_likes_profile_idx ON post_likes (profile_id, created_at DESC);

-- Une mise à jour projet peut être une simple image (body vide).
ALTER TABLE project_updates DROP CONSTRAINT IF EXISTS project_updates_body_check;
ALTER TABLE project_updates
  ADD CONSTRAINT project_updates_body_check
  CHECK (char_length(body) BETWEEN 0 AND 5000);
