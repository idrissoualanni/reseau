import { createHash, timingSafeEqual } from "node:crypto";
import { ValidationError } from "@/lib/errors";
import type {
  MembershipVerification,
  SpaceAccessKind,
  SpaceAccessMethod,
} from "@/lib/types";

// Domaine pur des méthodes d'accès (F15) : aucune dépendance base ni HTTP.
// Ajouter une méthode = une implémentation ici + une ligne de config en base.

// Empreinte d'un secret (code d'invitation, jeton de lien). Jamais en clair en base.
export function hashSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

// Comparaison à temps constant. Les deux empreintes font la même longueur (hex
// SHA-256) ; une longueur différente trahit un hash invalide et vaut `false`.
export function verifySecret(secret: string, hash: string): boolean {
  const computed = Buffer.from(hashSecret(secret), "utf8");
  const stored = Buffer.from(hash, "utf8");
  if (computed.length !== stored.length) return false;
  return timingSafeEqual(computed, stored);
}

// Résultat de la résolution : quelle appartenance créer, et quelle action journaliser.
export type AccessDecision = {
  action: "join" | "request";
  verificationLevel: MembershipVerification;
  verifiedVia: SpaceAccessKind;
};

export interface AccessMethod {
  kind: SpaceAccessKind;
  resolve(
    method: SpaceAccessMethod,
    input: { code?: string; token?: string },
  ): AccessDecision;
}

const openMethod: AccessMethod = {
  kind: "open",
  // Adhésion immédiate : le compte n'est pas prouvé, seul l'espace est public.
  resolve: () => ({
    action: "join",
    verificationLevel: "unverified",
    verifiedVia: "open",
  }),
};

const inviteCodeMethod: AccessMethod = {
  kind: "invite_code",
  resolve: (method, input) => {
    const hash = typeof method.config.codeHash === "string" ? method.config.codeHash : null;
    if (!hash || !verifySecret(input.code ?? "", hash)) {
      throw new ValidationError("Code d'invitation invalide.");
    }
    return { action: "join", verificationLevel: "verified", verifiedVia: "invite_code" };
  },
};

const inviteLinkMethod: AccessMethod = {
  kind: "invite_link",
  resolve: (method, input) => {
    const hash = typeof method.config.tokenHash === "string" ? method.config.tokenHash : null;
    const expiresAt =
      typeof method.config.expiresAt === "string" ? method.config.expiresAt : null;

    if (expiresAt && Date.parse(expiresAt) < Date.now()) {
      throw new ValidationError("Ce lien d'invitation a expiré.");
    }
    if (!hash || !verifySecret(input.token ?? "", hash)) {
      throw new ValidationError("Lien d'invitation invalide.");
    }
    return { action: "join", verificationLevel: "verified", verifiedVia: "invite_link" };
  },
};

const manualApprovalMethod: AccessMethod = {
  kind: "manual_approval",
  // Demande en attente : un gestionnaire (F17) validera plus tard.
  resolve: () => ({
    action: "request",
    verificationLevel: "unverified",
    verifiedVia: "manual_approval",
  }),
};

export const accessMethods: Record<SpaceAccessKind, AccessMethod> = {
  open: openMethod,
  invite_code: inviteCodeMethod,
  invite_link: inviteLinkMethod,
  manual_approval: manualApprovalMethod,
};

// Résout la méthode configurée sur l'espace avec l'entrée fournie par l'utilisateur.
export function resolveAccessMethod(
  method: SpaceAccessMethod,
  input: { code?: string; token?: string },
): AccessDecision {
  const impl = accessMethods[method.method];
  if (!impl) throw new ValidationError("Méthode d'accès inconnue.");
  return impl.resolve(method, input);
}
