import { describe, expect, it } from "vitest";
import {
  profiles,
  projects,
  projectSkills,
  proofLevel,
  projectStatus,
  skills,
  userSkills,
} from "./schema";

describe("schéma Drizzle V1 (docs/data-model.md)", () => {
  it("définit les colonnes clés des 5 tables", () => {
    expect(profiles.userId.name).toBe("user_id");
    expect(profiles.username.name).toBe("username");
    expect(profiles.displayName.name).toBe("display_name");
    expect(skills.slug.name).toBe("slug");
    expect(userSkills.proofLevel.name).toBe("proof_level");
    expect(projects.authorId.name).toBe("author_id");
    expect(projects.publishedAt.name).toBe("published_at");
    expect(projectSkills.projectId.name).toBe("project_id");
  });

  it("définit les enums proof_level et project_status", () => {
    expect(proofLevel.enumValues).toEqual(["declared", "demonstrated"]);
    expect(projectStatus.enumValues).toEqual(["draft", "published"]);
  });
});