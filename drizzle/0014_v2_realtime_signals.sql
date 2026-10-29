-- V2 — signaux temps réel : saisie en cours + présence. Additive et idempotente.

CREATE TABLE IF NOT EXISTS conversation_typing (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, profile_id)
);

CREATE INDEX IF NOT EXISTS conversation_typing_updated_idx
  ON conversation_typing (updated_at);

CREATE TABLE IF NOT EXISTS profile_presence (
  profile_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
