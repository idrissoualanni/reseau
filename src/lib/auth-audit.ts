import { requirePlatformAdmin, type AdminContext } from "@/lib/admin";
import { insertOtpEvent, listOtpEvents } from "@/lib/repositories/auth-audit";
import type { AdminOtpEventRecord } from "@/lib/types";

// Journal des envois OTP (F17). On trace **qu'un code est parti** (adresse, type,
// résultat, date) : jamais le code, qui n'est jamais reçu par l'app.

// Même borne que les autres vues « tout voir » de la console admin.
export const OTP_EVENTS_LIMIT = 200;

export type OtpSendType = "email-verification" | "forgot-password";

// Écriture best-effort : une panne d'audit ne doit jamais casser l'authentification.
export async function recordOtpSend(input: {
  email: string;
  type: OtpSendType;
  ok: boolean;
  errorCode?: string | null;
}): Promise<void> {
  try {
    await insertOtpEvent({
      email: input.email.trim().toLowerCase(),
      type: input.type,
      outcome: input.ok ? "sent" : "failed",
      errorCode: input.errorCode ?? null,
    });
  } catch {
    // Journal best-effort : on n'échoue jamais le parcours utilisateur pour l'audit.
  }
}

export async function listOtpEventsForAdmin(
  ctx: AdminContext,
): Promise<AdminOtpEventRecord[]> {
  await requirePlatformAdmin(ctx);
  return listOtpEvents(OTP_EVENTS_LIMIT);
}
