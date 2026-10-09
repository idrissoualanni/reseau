// Seule porte d'entrée vers le stockage de fichiers (architecture §11), Neon
// Object Storage (compatible S3). L'URL publique et l'URL présignée d'upload
// seront branchées quand le bucket sera confirmé (ADR 0004 « proposé ») et les
// clés `AWS_*` lues par `lib/env.ts`.

// URL publique d'une clé de fichier, ou `null` si le stockage n'est pas encore
// configuré (aucune image affichée tant que l'accès public n'est pas tranché).
export function getPublicUrl(key: string): string | null {
  void key;
  return null;
}

// Clé de stockage d'une couverture de projet : `projects/{profileId}/...`.
export function projectCoverPrefix(profileId: string): string {
  return `projects/${profileId}/`;
}
