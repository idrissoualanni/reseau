import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { authOtpAudit } from "@/db/schema";
import type { AdminOtpEventRecord } from "@/lib/types";

// Journal des envois OTP (F17, option A). Aucune valeur de code n'y transite.

export type OtpEventInput = {
  email: string;
  type: string;
  outcome: string;
  errorCode?: string | null;
};

export async function insertOtpEvent(input: OtpEventInput): Promise<void> {
  await db.insert(authOtpAudit).values({
    email: input.email,
    type: input.type,
    outcome: input.outcome,
    errorCode: input.errorCode ?? null,
  });
}

export async function listOtpEvents(limit: number): Promise<AdminOtpEventRecord[]> {
  const rows = await db
    .select()
    .from(authOtpAudit)
    .orderBy(desc(authOtpAudit.createdAt), desc(authOtpAudit.id))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    type: row.type,
    outcome: row.outcome,
    errorCode: row.errorCode,
    createdAt: row.createdAt,
  }));
}
