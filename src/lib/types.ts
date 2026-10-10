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

export type ProjectStatus = "draft" | "published";

export type Project = {
  id: string;
  authorId: string;
  title: string;
  body: string;
  coverKey: string | null;
  status: ProjectStatus;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Post = {
  id: string;
  authorId: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PostComment = {
  id: string;
  postId: string;
  parentId: string | null;
  authorId: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
};

// Page par curseur opaque ; `nextCursor` nul signifie « fin de liste ».
export type ProjectPage = {
  items: Project[];
  nextCursor: string | null;
};
