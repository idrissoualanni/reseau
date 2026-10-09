// Erreurs applicatives typées : une règle métier échoue avec un code stable,
// jamais en renvoyant `null` (conventions.md §9).
export type ErrorCode =
  | "VALIDATION"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RULE_VIOLATION"
  | "RATE_LIMITED"
  | "INTERNAL";

export class AppError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = new.target.name;
    this.code = code;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Entrée invalide") {
    super("VALIDATION", message);
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = "Authentification requise") {
    super("UNAUTHENTICATED", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Accès refusé") {
    super("FORBIDDEN", message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Introuvable") {
    super("NOT_FOUND", message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflit") {
    super("CONFLICT", message);
  }
}

export class RuleViolationError extends AppError {
  constructor(message = "Règle métier violée") {
    super("RULE_VIOLATION", message);
  }
}

export class RateLimitedError extends AppError {
  constructor(message = "Trop de tentatives") {
    super("RATE_LIMITED", message);
  }
}
