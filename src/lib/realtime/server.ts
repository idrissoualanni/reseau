import {
  createRealtime,
  pgParam,
  rawSql,
  type RawSqlQuery,
  type RealtimeServer,
  type SealedLiveQuery,
} from "@neon/realtime/server";

// Realtime côté serveur uniquement : le secret ne doit jamais atteindre le bundle.
// Les requêtes scellées portent l'autorisation de la session.

let cached: RealtimeServer<RawSqlQuery<unknown>> | undefined;

function databaseName(url: string | undefined): string {
  if (!url) throw new Error("DATABASE_URL manquant pour Realtime.");
  const parsed = new URL(url);
  const name = parsed.pathname.replace(/^\//, "");
  if (!name) throw new Error("Nom de base introuvable dans DATABASE_URL.");
  return name;
}

function realtimeServer(): RealtimeServer<RawSqlQuery<unknown>> {
  if (cached) return cached;
  const secret = process.env.NEON_REALTIME_SECRET;
  if (!secret) throw new Error("NEON_REALTIME_SECRET manquant pour Realtime.");
  cached = createRealtime({
    secret,
    db: databaseName(process.env.DATABASE_URL),
  });
  return cached;
}

export type LiveMessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  client_id: string;
  ciphertext: string;
  iv: string;
  key_version: number;
  sender_key_id: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  reactions: LiveReactionRow[];
};

export type LiveReactionRow = {
  profile_id: string;
  ciphertext: string;
  iv: string;
  key_version: number;
  created_at: string;
  updated_at: string;
};

export function messagesLiveQuery(
  profileId: string,
  conversationId: string,
): RawSqlQuery<LiveMessageRow> {
  return rawSql<LiveMessageRow>(
    `SELECT m.id, m.conversation_id, m.sender_id, m.client_id, m.ciphertext, m.iv,
            m.key_version, m.sender_key_id, m.created_at, m.edited_at, m.deleted_at,
            COALESCE((
              SELECT json_agg(json_build_object(
                'profile_id', r.profile_id,
                'ciphertext', r.ciphertext,
                'iv', r.iv,
                'key_version', r.key_version,
                'created_at', r.created_at,
                'updated_at', r.updated_at
              ) ORDER BY r.created_at)
              FROM message_reactions r
              WHERE r.message_id = m.id
            ), '[]'::json) AS reactions
     FROM messages m
     INNER JOIN conversation_participants p
       ON p.conversation_id = m.conversation_id AND p.profile_id = $2
     WHERE m.conversation_id = $1
     ORDER BY m.created_at DESC, m.id DESC
     LIMIT 50`,
    [
      pgParam.text("uuid", conversationId),
      pgParam.text("uuid", profileId),
    ],
  );
}

export async function sealMessagesQuery(
  profileId: string,
  conversationId: string,
): Promise<SealedLiveQuery<LiveMessageRow>> {
  return realtimeServer().seal({ query: messagesLiveQuery(profileId, conversationId) });
}
