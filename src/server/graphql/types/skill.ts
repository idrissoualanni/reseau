import { builder } from "@/server/graphql/builder";
import type { Skill } from "@/lib/types";

// Compétence du référentiel, telle qu'affichée sur un projet.
export const SkillRef = builder.objectRef<Skill>("Skill").implement({
  description: "Compétence du référentiel.",
  fields: (t) => ({
    id: t.exposeID("id"),
    slug: t.exposeString("slug"),
    name: t.exposeString("name"),
  }),
});
