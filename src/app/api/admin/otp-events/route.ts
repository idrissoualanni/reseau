import { toAdminContext } from "@/lib/admin";
import { toOtpEventDto } from "@/lib/api/mappers/admin";
import { ok, withApi } from "@/lib/api/respond";
import { requireSession } from "@/lib/auth";
import { listOtpEventsForAdmin } from "@/lib/auth-audit";

// Journal des envois OTP (F17), lecture seule. **Ne contient jamais de code.**
export const GET = withApi(async () => {
  const session = await requireSession();
  const entries = await listOtpEventsForAdmin(toAdminContext(session));
  return ok({ items: entries.map(toOtpEventDto) });
});
