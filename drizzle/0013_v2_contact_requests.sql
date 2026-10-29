-- V2 — demandes de contact (F34). Migration additive et idempotente.
-- Aucune conversation n'est créée avant acceptation ; aucun contenu n'est
-- stocké (le serveur ne doit jamais voir de texte en clair).

DO $$
BEGIN
  CREATE TYPE conversation_request_status AS ENUM ('pending', 'accepted', 'declined');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS conversation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status conversation_request_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT conversation_requests_distinct_check CHECK (requester_id <> recipient_id)
);

-- Une seule demande en attente par paire ordonnée (expéditeur → destinataire).
CREATE UNIQUE INDEX IF NOT EXISTS conversation_requests_pending_uq
  ON conversation_requests (requester_id, recipient_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS conversation_requests_recipient_idx
  ON conversation_requests (recipient_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS conversation_requests_requester_idx
  ON conversation_requests (requester_id, status, created_at DESC);
