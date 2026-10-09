// Entités du domaine, indépendantes de Drizzle et de HTTP. Les repositories
// convertissent les lignes de base en ces types ; les composants ne voient
// jamais une ligne brute (règles architecture §7 et api-rest §10).

export type ProofLevel = "declared" | "demonstrated";

export type Profile = {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  bio: string | null;
  schoolName: string | null;
  fieldOfStudy: string | null;
  avatarKey: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Skill = {
  id: string;
  slug: string;
  name: string;
};

export type ProfileSkill = Skill & { proofLevel: ProofLevel };
