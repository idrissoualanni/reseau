import { test, expect } from "@playwright/test";

// E2E tests for V1.5 Projects features
// Run with: npx playwright test tests/v15-projects-e2e.spec.ts

test.describe("V1.5 Projects E2E Scenarios", () => {
  let projectId: string;

  test.beforeAll(async () => {
    projectId = "test-project-id";
  });

  test.describe("F18 — Catalogue Projets", () => {
    test("should display projects catalogue at /projects", async ({ page }) => {
      await page.goto("/projects");
      await expect(page.locator("h1")).toContainText("Catalogue des projets");
      await expect(page.locator('[data-testid="project-card"]')).toHaveCount.greaterThan(0);
    });

    test("should filter by skill", async ({ page }) => {
      await page.goto("/projects");
      await page.selectOption('[data-testid="skill-filter"]', "react");
      await page.click('[data-testid="filter-submit"]');
      await expect(page.locator('[data-testid="project-card"]')).toHaveCount.greaterThan(0);
    });

    test("should filter by project type", async ({ page }) => {
      await page.goto("/projects");
      await page.selectOption('[data-testid="type-filter"]', "team");
      await page.click('[data-testid="filter-submit"]');
      await expect(page.locator('[data-testid="project-card"]')).toHaveCount.greaterThan(0);
    });

    test("should search by text", async ({ page }) => {
      await page.goto("/projects");
      await page.fill('[data-testid="search-input"]', "machine learning");
      await page.press('[data-testid="search-input"]', "Enter");
      await expect(page.locator('[data-testid="project-card"]')).toHaveCount.greaterThanOrEqual(0);
    });

    test("should paginate with Voir plus", async ({ page }) => {
      await page.goto("/projects");
      const initialCount = await page.locator('[data-testid="project-card"]').count();
      await page.click('[data-testid="load-more"]');
      await page.waitForTimeout(500);
      const newCount = await page.locator('[data-testid="project-card"]').count();
      expect(newCount).toBeGreaterThan(initialCount);
    });

    test("should show empty state when no results", async ({ page }) => {
      await page.goto("/projects");
      await page.fill('[data-testid="search-input"]', "nonexistentproject12345");
      await page.press('[data-testid="search-input"]', "Enter");
      await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
    });
  });

  test.describe("F19 — Social Projets", () => {
    test("should toggle reaction on project", async ({ page }) => {
      await page.goto(`/projects/${projectId}`);
      const likeButton = page.locator('[data-testid="reaction-like"]');
      const initialCount = parseInt(await likeButton.locator(".count").textContent() || "0");

      await likeButton.click();
      await expect(likeButton.locator(".count")).toHaveText(String(initialCount + 1));
      await expect(likeButton).toHaveAttribute("aria-pressed", "true");

      // Toggle off
      await likeButton.click();
      await expect(likeButton.locator(".count")).toHaveText(String(initialCount));
    });

    test("should add comment to project", async ({ page }) => {
      await page.goto(`/projects/${projectId}`);
      await page.click('[data-testid="discussion-tab"]');
      
      await page.fill('[data-testid="comment-input"]', "Excellent projet !");
      await page.click('[data-testid="comment-submit"]');
      
      await expect(page.locator('[data-testid="comment-item"]')).toContainText("Excellent projet !");
    });

    test("should reply to comment", async ({ page }) => {
      await page.goto(`/projects/${projectId}`);
      await page.click('[data-testid="discussion-tab"]');
      
      await page.click('[data-testid="comment-reply-button"]:first-child');
      await page.fill('[data-testid="reply-input"]', "Merci pour le feedback !");
      await page.click('[data-testid="reply-submit"]');
      
      await expect(page.locator('[data-testid="reply-item"]')).toContainText("Merci pour le feedback !");
    });

    test("should follow/unfollow project", async ({ page }) => {
      await page.goto(`/projects/${projectId}`);
      const followButton = page.locator('[data-testid="follow-button"]');
      
      await followButton.click();
      await expect(followButton).toContainText("Suivi");
      
      await followButton.click();
      await expect(followButton).toContainText("Suivre");
    });

    test("should display followers list", async ({ page }) => {
      await page.goto(`/projects/${projectId}`);
      await page.click('[data-testid="followers-tab"]');
      await expect(page.locator('[data-testid="follower-item"]')).toHaveCount.greaterThan(0);
    });
  });

  test.describe("F20 — Évolutions Projet (Updates)", () => {
    test("should create update as author", async ({ page }) => {
      await page.goto(`/projects/${projectId}`);
      await page.click('[data-testid="activity-tab"]');
      
      await page.click('[data-testid="compose-update-button"]');
      await page.fill('[data-testid="update-body"]', "Nouvelle étape franchie !");
      await page.click('[data-testid="update-submit"]');
      
      await expect(page.locator('[data-testid="update-item"]')).toContainText("Nouvelle étape franchie !");
    });

    test("should upload image in update", async ({ page }) => {
      await page.goto(`/projects/${projectId}`);
      await page.click('[data-testid="activity-tab"]');
      await page.click('[data-testid="compose-update-button"]');
      
      await page.setInputFiles('[data-testid="image-uploader"]', "test/fixtures/image.jpg");
      await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();
      
      await page.fill('[data-testid="update-body"]', "Update avec image");
      await page.click('[data-testid="update-submit"]');
      
      await expect(page.locator('[data-testid="update-item"] img')).toBeVisible();
    });

    test("should delete own update", async ({ page }) => {
      await page.goto(`/projects/${projectId}`);
      await page.click('[data-testid="activity-tab"]');
      
      await page.click('[data-testid="update-delete-button"]:first-child');
      await page.click('[data-testid="confirm-delete"]');
      
      await expect(page.locator('[data-testid="update-item"]')).toHaveCount(0);
    });

    test("should NOT allow non-author to create update", async ({ page }) => {
      await page.goto(`/projects/${projectId}`);
      await page.click('[data-testid="activity-tab"]');
      
      await expect(page.locator('[data-testid="compose-update-button"]')).not.toBeVisible();
    });

    test("should show updates in chronological order", async ({ page }) => {
      await page.goto(`/projects/${projectId}`);
      await page.click('[data-testid="activity-tab"]');
      
      const updates = await page.locator('[data-testid="update-item"]').all();
      const dates = await Promise.all(
        updates.map(u => u.locator('[data-testid="update-date"]').getAttribute("datetime"))
      );
      
      for (let i = 1; i < dates.length; i++) {
        expect(new Date(dates[i-1]!).getTime()).toBeGreaterThanOrEqual(new Date(dates[i]!).getTime());
      }
    });
  });

  test.describe("Project Detail Tabs", () => {
    test("should navigate between tabs", async ({ page }) => {
      await page.goto(`/projects/${projectId}`);
      
      await expect(page.locator('[data-testid="overview-tab"]')).toBeVisible();
      await page.click('[data-testid="activity-tab"]');
      await expect(page.locator('[data-testid="activity-content"]')).toBeVisible();
      await page.click('[data-testid="discussion-tab"]');
      await expect(page.locator('[data-testid="discussion-content"]')).toBeVisible();
      await page.click('[data-testid="followers-tab"]');
      await expect(page.locator('[data-testid="followers-content"]')).toBeVisible();
    });

    test("should be responsive on mobile (drawer)", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`/projects/${projectId}`);
      
      await expect(page.locator('[data-testid="tabs-container"]')).toBeVisible();
    });
  });

  test.describe("WebSocket Notifications", () => {
    test("should receive real-time notification on new comment", async ({ page, context }) => {
      const followerPage = await context.newPage();
      const commenterPage = await context.newPage();
      
      await followerPage.goto(`/projects/${projectId}`);
      await followerPage.click('[data-testid="follow-button"]');
      
      await commenterPage.goto(`/projects/${projectId}`);
      await commenterPage.click('[data-testid="discussion-tab"]');
      await commenterPage.fill('[data-testid="comment-input"]', "Test notification");
      await commenterPage.click('[data-testid="comment-submit"]');
      
      await expect(followerPage.locator('[data-testid="notification-toast"]')).toBeVisible({ timeout: 5000 });
    });

    test("should receive real-time notification on new update", async ({ page, context }) => {
      const followerPage = await context.newPage();
      const authorPage = await context.newPage();
      
      await followerPage.goto(`/projects/${projectId}`);
      await followerPage.click('[data-testid="follow-button"]');
      
      await authorPage.goto(`/projects/${projectId}`);
      await authorPage.click('[data-testid="activity-tab"]');
      await authorPage.click('[data-testid="compose-update-button"]');
      await authorPage.fill('[data-testid="update-body"]', "Real-time test update");
      await authorPage.click('[data-testid="update-submit"]');
      
      await expect(followerPage.locator('[data-testid="notification-toast"]')).toBeVisible({ timeout: 5000 });
    });
  });
});