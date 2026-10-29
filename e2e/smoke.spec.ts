import { expect, test } from "@playwright/test";

// Fumée : parcours public, aucune session ni base requise.
test.describe("auth publique", () => {
  test("la page de connexion expose le formulaire", async ({ page }) => {
    await page.goto("/sign-in");

    await expect(
      page.getByRole("heading", { level: 1, name: "Se connecter" }),
    ).toBeVisible();
    await expect(page.getByLabel("E-mail")).toBeVisible();
    await expect(page.getByLabel("Mot de passe")).toBeVisible();
    await expect(page.getByRole("button", { name: "Se connecter" })).toBeVisible();
    await expect(page.getByRole("link", { name: "S'inscrire" })).toBeVisible();
  });

  test("une route protégée renvoie vers la connexion", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("aucune erreur console au chargement de la connexion", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    await page.goto("/sign-in");
    await page.getByRole("heading", { level: 1 }).waitFor();

    expect(errors).toEqual([]);
  });
});
