import { expect, test } from "@playwright/test";
import { publishedGame, removeVisitor } from "./support/db";
import { accountReview, chooseStance, createAccount, fillCatalogReview, visitorEmail, visitorUsername, waitForBuilder } from "./support/visitor";

const created: string[] = [];

test.afterEach(async () => {
  const pending = created.splice(0);
  for (const email of pending) await removeVisitor(email);
});

function matching(path: string) {
  return new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
}

test.describe("a visitor with no account", () => {
  let game: { slug: string; title: string } = { slug: "", title: "" };

  test.beforeAll(async () => {
    game = await publishedGame();
  });

  test.describe("new review", () => {
    test("saves a draft and leaves it on the account", async ({ page }) => {
      const email = visitorEmail("funnel-draft");
      const title = `E2E funnel draft ${Date.now()}`;
      created.push(email);

      await page.goto("/review/new?type=game");
      await waitForBuilder(page);
      await page.getByRole("textbox", { name: "Title" }).fill(title);
      await page.getByRole("button", { name: "Save draft" }).click();
      await expect(page).toHaveURL(/\/login\?next=/);
      await createAccount(page, email, visitorUsername("funneld"));
      await expect(page).toHaveURL(/\/review\//);

      await page.goto("/dashboard");
      await expect(accountReview(page, title)).toContainText("Draft");
      await expect(accountReview(page, title)).not.toContainText("Published");
    });

    test("publishes a saved draft from the account", async ({ page }) => {
      const email = visitorEmail("funnel-convert");
      created.push(email);

      await page.goto("/review/new?type=game");
      await fillCatalogReview(page, game.title);
      await page.getByRole("button", { name: "Save draft" }).click();
      await expect(page).toHaveURL(/\/login\?next=/);
      await createAccount(page, email, visitorUsername("funnelc"));
      await expect(page).toHaveURL(/\/review\//);

      await page.goto("/dashboard");
      await expect(accountReview(page, game.title)).toContainText("Draft");
      await accountReview(page, game.title).getByRole("link", { name: game.title, exact: true }).click();
      await page.getByRole("button", { name: "Publish review" }).click();
      await expect(page.getByText("This draft is on your account.")).toHaveCount(0);

      await page.goto("/dashboard");
      await expect(accountReview(page, game.title)).toContainText("Published");
      await expect(accountReview(page, game.title)).not.toContainText("Draft");
    });

    test("publishes the review immediately", async ({ page }) => {
      const email = visitorEmail("funnel-publish");
      created.push(email);

      await page.goto("/review/new?type=game");
      await fillCatalogReview(page, game.title);
      await page.getByRole("button", { name: "Publish Review" }).click();
      await expect(page).toHaveURL(/\/login\?next=/);
      await createAccount(page, email, visitorUsername("funnelp"));
      await expect(page).toHaveURL(/\/review\//);

      await page.goto("/dashboard");
      await expect(accountReview(page, game.title)).toContainText("Published");
      await expect(accountReview(page, game.title)).not.toContainText("Draft");
    });
  });

  test.describe("an existing game", () => {
    test("saves a draft and leaves it off the work page", async ({ page }) => {
      const email = visitorEmail("game-draft");
      const name = visitorUsername("gamedraft");
      created.push(email);

      await page.goto(`/games/${game.slug}/evaluate`);
      await chooseStance(page, "Enjoyment", "Positive");
      await chooseStance(page, "Was it well executed?", "Negative");
      await page.getByRole("button", { name: "Save draft" }).click();
      await expect(page).toHaveURL(/\/login\?next=/);
      await createAccount(page, email, name);
      await expect(page).toHaveURL(matching(`/games/${game.slug}/evaluate`));

      await chooseStance(page, "Enjoyment", "Positive");
      await chooseStance(page, "Was it well executed?", "Negative");
      await page.getByRole("button", { name: "Save draft" }).click();
      await expect(page.getByText("Draft saved.")).toBeVisible();

      await page.goto("/dashboard");
      await expect(accountReview(page, game.title)).toContainText("Draft");
      await page.goto(`/games/${game.slug}`);
      await expect(page.getByRole("region", { name: "Reviews" }).getByRole("link", { name, exact: true })).toHaveCount(0);
    });

    test("publishes a saved draft from the account", async ({ page }) => {
      const email = visitorEmail("game-convert");
      const name = visitorUsername("gameconv");
      created.push(email);

      await page.goto(`/games/${game.slug}/evaluate`);
      await chooseStance(page, "Enjoyment", "Mixed");
      await chooseStance(page, "Was it well executed?", "Positive");
      await page.getByRole("button", { name: "Save draft" }).click();
      await createAccount(page, email, name);
      await expect(page).toHaveURL(matching(`/games/${game.slug}/evaluate`));

      await chooseStance(page, "Enjoyment", "Mixed");
      await chooseStance(page, "Was it well executed?", "Positive");
      await page.getByRole("button", { name: "Save draft" }).click();
      await expect(page.getByText("Draft saved.")).toBeVisible();

      await page.goto("/dashboard");
      await accountReview(page, game.title).getByRole("link", { name: game.title, exact: true }).click();
      await expect(page).toHaveURL(matching(`/games/${game.slug}/evaluate`));
      await page.getByRole("button", { name: "Publish Review" }).click();
      await expect(page).toHaveURL(matching(`/games/${game.slug}/reviews/`));

      await page.goto("/dashboard");
      await expect(accountReview(page, game.title)).toContainText("Published");
      await page.goto(`/games/${game.slug}`);
      await expect(page.getByRole("region", { name: "Reviews" }).getByRole("link", { name, exact: true })).toBeVisible();
    });

    test("publishes the review immediately", async ({ page }) => {
      const email = visitorEmail("game-publish");
      const name = visitorUsername("gamepub");
      created.push(email);

      await page.goto(`/games/${game.slug}/evaluate`);
      await chooseStance(page, "Enjoyment", "Positive");
      await chooseStance(page, "Was it well executed?", "Mixed");
      await page.getByRole("button", { name: "Publish Review" }).click();
      await expect(page).toHaveURL(/\/login\?next=/);
      await createAccount(page, email, name);
      await expect(page).toHaveURL(matching(`/games/${game.slug}/evaluate`));

      await chooseStance(page, "Enjoyment", "Positive");
      await chooseStance(page, "Was it well executed?", "Mixed");
      await page.getByRole("button", { name: "Publish Review" }).click();
      await expect(page).toHaveURL(matching(`/games/${game.slug}/reviews/`));

      await page.goto("/dashboard");
      await expect(accountReview(page, game.title)).toContainText("Published");
      await page.goto(`/games/${game.slug}`);
      await expect(page.getByRole("region", { name: "Reviews" }).getByRole("link", { name, exact: true })).toBeVisible();
    });
  });
});
