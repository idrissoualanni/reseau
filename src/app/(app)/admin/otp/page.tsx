import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { formatDateTime } from "@/components/admin/format";
import { toAdminContext } from "@/lib/admin";
import { requireSession } from "@/lib/auth";
import { listOtpEventsForAdmin } from "@/lib/auth-audit";

export const instant = false;

const TYPE_LABELS: Record<string, string> = {
  "email-verification": "Vérification d'e-mail",
  "forgot-password": "Mot de passe oublié",
};

// Journal des envois OTP (F17) : lecture seule. **Jamais le code.**
export default async function AdminOtpEventsPage() {
  const session = await requireSession();
  const events = await listOtpEventsForAdmin(toAdminContext(session));

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Chaque ligne indique qu'un code a été <strong>envoyé</strong>. Le code n'est jamais
        conservé : Neon Auth le génère et l'envoie directement à l'utilisateur.
      </p>

      {events.length === 0 ? (
        <EmptyState
          title="Aucun envoi"
          description="Aucun code n'a encore été envoyé depuis l'activation du journal."
        />
      ) : (
        <ul className="divide-border divide-y rounded-lg border">
          {events.map((event) => (
            <li key={event.id} className="flex flex-wrap items-center gap-3 p-4">
              <span className="min-w-0 flex-1 truncate font-medium">{event.email}</span>
              <span className="text-muted-foreground text-sm">
                {TYPE_LABELS[event.type] ?? event.type}
              </span>
              <Badge variant={event.outcome === "sent" ? "success" : "destructive"}>
                {event.outcome === "sent" ? "Envoyé" : "Échec"}
              </Badge>
              <span className="text-muted-foreground text-sm tabular-nums">
                {formatDateTime(event.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
