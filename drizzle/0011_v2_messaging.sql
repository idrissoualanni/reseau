-- V2 — messagerie chiffrée de bout en bout (F34).
-- Migration additive et idempotente. Aucun contenu clair, aucune clé privée.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_kind') THEN
    CREATE TYPE conversation_kind AS ENUM ('direct', 'group');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_role') THEN
    CREATE TYPE conversation_role AS ENUM ('member', 'owner');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind conversation_kind NOT NULL DEFAULT 'direct',
  direct_key text,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversations_direct_key_check CHECK (
    (kind = 'group' AND direct_key IS NULL)
    OR (kind = 'direct' AND direct_key IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS conversations_direct_key_uq ON conversations (direct_key);
CREATE INDEX IF NOT EXISTS conversations_last_message_idx
  ON conversations (last_message_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role conversation_role NOT NULL DEFAULT 'member',
  last_read_at timestamptz NOT NULL DEFAULT now(),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, profile_id)
);

CREATE INDEX IF NOT EXISTS conversation_participants_profile_idx
  ON conversation_participants (profile_id, conversation_id);

CREATE TABLE IF NOT EXISTS messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  ciphertext text NOT NULL,
  iv text NOT NULL,
  key_version integer NOT NULL DEFAULT 1,
  sender_key_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  CONSTRAINT messages_ciphertext_check CHECK (char_length(ciphertext) BETWEEN 1 AND 22000),
  CONSTRAINT messages_iv_check CHECK (char_length(iv) BETWEEN 16 AND 24),
  CONSTRAINT messages_key_version_check CHECK (key_version > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS messages_sender_client_uq ON messages (sender_id, client_id);
CREATE INDEX IF NOT EXISTS messages_conversation_idx
  ON messages (conversation_id, created_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS message_reactions (
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ciphertext text NOT NULL,
  iv text NOT NULL,
  key_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, profile_id),
  CONSTRAINT message_reactions_ciphertext_check CHECK (char_length(ciphertext) BETWEEN 1 AND 2000),
  CONSTRAINT message_reactions_iv_check CHECK (char_length(iv) BETWEEN 16 AND 24),
  CONSTRAINT message_reactions_key_version_check CHECK (key_version > 0)
);

CREATE INDEX IF NOT EXISTS message_reactions_profile_idx ON message_reactions (profile_id);

CREATE TABLE IF NOT EXISTS message_receipts (
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  delivered_at timestamptz,
  read_at timestamptz,
  PRIMARY KEY (message_id, profile_id)
);

CREATE INDEX IF NOT EXISTS message_receipts_profile_idx ON message_receipts (profile_id, read_at);

CREATE TABLE IF NOT EXISTS profile_keys (
  profile_id uuid NOT NULL PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  key_id text NOT NULL,
  public_key_jwk jsonb NOT NULL,
  algorithm text NOT NULL DEFAULT 'ECDH-P256',
  created_at timestamptz NOT NULL DEFAULT now(),
  rotated_at timestamptz,
  CONSTRAINT profile_keys_algorithm_check CHECK (algorithm = 'ECDH-P256')
);

CREATE TABLE IF NOT EXISTS conversation_keys (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  key_id text NOT NULL,
  wrapped_key text NOT NULL,
  iv text NOT NULL,
  algorithm text NOT NULL DEFAULT 'AES-256-GCM',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, profile_id, key_id),
  CONSTRAINT conversation_keys_wrapped_check CHECK (char_length(wrapped_key) BETWEEN 1 AND 2000),
  CONSTRAINT conversation_keys_iv_check CHECK (char_length(iv) BETWEEN 16 AND 24),
  CONSTRAINT conversation_keys_algorithm_check CHECK (algorithm = 'AES-256-GCM')
);
