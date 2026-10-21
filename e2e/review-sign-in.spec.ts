import { expect, test, type Page } from "@playwright/test";
import { publishedGame, removeVisitor } from "./support/db";
import {
  accountReview,
  chooseStance,
  fillCatalogReview,
  logOut,
  signIn,
  signUp,
  visitorEmail,
  visitorUsername,
} from "./support/visitor";

const created: string[] = [];

test.describe.configure({ timeout: 120_000 });

test.afterEach(async () => {
  const pending = created.splice(0);
  for (const email of pending) await removeVisitor(email);
});

function matching(path: string) {
  return new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
}

function watchPaths(page: Page) {
  const paths: string[] = [];
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) paths.push(new URL(frame.url()).pathname);
  });
  return paths;
}

async function registerAndLeave(page: Page, email: string, username: string) {
  await page.goto("/signup");
  await signUp(page, email, username);
  await expect(page).toHaveURL(/\/dashboard/);
  await logOut(page);
}

async function startFunnel(page: Page, title: string, intent: "Publish Review" | "Save draft") {
  await page.goto("/");
  await page.getByRole("link", { name: "Review a Game" }).click();
  await expect(page).toHaveURL(/\/review\/new\?type=game/);
  await fillCatalogReview(page, title);
  await page.getByRole("button", { name: intent }).click();
  await expect(page).toHaveURL(/\/login\?next=/);
  const next = new URL(page.url()).searchParams.get("next") ?? "";
  expect(next).toMatch(/^\/review\/[a-z0-9]+$/i);
  await expect(page.getByRole("textbox", { name: "Username or email" })).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Display name")).toHaveCount(0);
}

async function expectShareCard(page: Page, title: string) {
  await expect(page).toHaveURL(/\/review\/[a-z0-9]+$/i);
  await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email" })).toHaveCount(0);
  await expect(page.getByText("Verify your email to download this chart.")).toHaveCount(0);
  const download = page.getByRole("button", { name: "Download image" });
  await expect(download).toBeEnabled();
  await download.click();
  await expect(page.getByText("Image downloaded")).toBeVisible();
}

test.describe("review sign-in", () => {
  let game: { slug: string; title: string } = { slug: "", title: "" };

  test.beforeAll(async () => {
    game = await publishedGame();
  });

  test.describe("funnel from the homepage", () => {
    test("a new account confirms email and opens the share card", async ({ page }) => {
      const email = visitorEmail("funnel-new");
      const title = `E2E funnel signup ${Date.now()}`;
      created.push(email);

      await startFunnel(page, title, "Publish Review");
      await signUp(page, email, visitorUsername("funnelnew"));
      await expectShareCard(page, title);
      await expect(page.getByText("Saved as a draft.")).toHaveCount(0);
    });

    test("an existing account signs in and opens the share card", async ({ page }) => {
      const email = visitorEmail("funnel-login");
      const username = visitorUsername("funnellog");
      const title = `E2E funnel login ${Date.now()}`;
      created.push(email);

      await registerAndLeave(page, email, username);
      const paths = watchPaths(page);
      await startFunnel(page, title, "Publish Review");
      await signIn(page, username);
      await expectShareCard(page, title);
      expect(paths).not.toContain("/verify");
    });

    test("a new account confirms email, then publishes the saved draft", async ({ page }) => {
      const email = visitorEmail("funnel-draft");
      const title = `E2E funnel draft ${Date.now()}`;
      created.push(email);

      await startFunnel(page, title, "Save draft");
      await signUp(page, email, visitorUsername("funneldft"));
      await expect(page.getByText("Saved as a draft.")).toBeVisible();
      await expectShareCard(page, title);

      await page.getByRole("button", { name: "Publish review" }).click();
      await expect(page.getByText("Saved as a draft.")).toHaveCount(0);
      await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
      await page.goto("/dashboard");
      await expect(accountReview(page, title)).toContainText("Published");
      await expect(accountReview(page, title)).not.toContainText("Draft");
    });

    test("an existing account signs in, then publishes the saved draft", async ({ page }) => {
      const email = visitorEmail("funnel-dlogin");
      const username = visitorUsername("funneldl");
      const title = `E2E funnel draft login ${Date.now()}`;
      created.push(email);

      await registerAndLeave(page, email, username);
      const paths = watchPaths(page);
      await startFunnel(page, title, "Save draft");
      await signIn(page, username);
      await expect(page.getByText("Saved as a draft.")).toBeVisible();
      expect(paths).not.toContain("/verify");

      await page.getByRole("button", { name: "Publish review" }).click();
      await expect(page.getByText("Saved as a draft.")).toHaveCount(0);
      await expectShareCard(page, title);
    });
  });

  test.describe("an existing game", () => {
    test("a new account confirms email and publishes on the work", async ({ page }) => {
      const email = visitorEmail("game-new");
      const name = visitorUsername("gamenew");
      created.push(email);

      await page.goto(`/games/${game.slug}/evaluate`);
      await chooseStance(page, "Enjoyment", "Positive");
      await chooseStance(page, "Was it well executed?", "Mixed");
      await page.getByRole("button", { name: "Publish Review" }).click();
      await expect(page).toHaveURL(/\/login\?next=/);
      expect(new URL(page.url()).searchParams.get("next")).toBe(`/games/${game.slug}/evaluate`);

      await signUp(page, email, name);
      await expect(page).toHaveURL(matching(`/games/${game.slug}/evaluate`));
      await chooseStance(page, "Enjoyment", "Positive");
      await chooseStance(page, "Was it well executed?", "Mixed");
      await page.getByRole("button", { name: "Publish Review" }).click();
      await expect(page).toHaveURL(matching(`/games/${game.slug}/reviews/`));

      await page.goto(`/games/${game.slug}`);
      await expect(page.getByRole("region", { name: "Reviews" }).getByRole("link", { name, exact: true })).toBeVisible();
    });

    test("an existing account signs in and publishes on the work", async ({ page }) => {
      const email = visitorEmail("game-login");
      const name = visitorUsername("gamelog");
      created.push(email);

      await registerAndLeave(page, email, name);
      const paths = watchPaths(page);
      await page.goto(`/games/${game.slug}/evaluate`);
      await chooseStance(page, "Enjoyment", "Negative");
      await chooseStance(page, "Was it well executed?", "Positive");
      await page.getByRole("button", { name: "Publish Review" }).click();
      await expect(page).toHaveURL(/\/login\?next=/);
      expect(new URL(page.url()).searchParams.get("next")).toBe(`/games/${game.slug}/evaluate`);

      await signIn(page, name);
      expect(paths).not.toContain("/verify");
      await expect(page).toHaveURL(matching(`/games/${game.slug}/evaluate`));
      await chooseStance(page, "Enjoyment", "Negative");
      await chooseStance(page, "Was it well executed?", "Positive");
      await page.getByRole("button", { name: "Publish Review" }).click();
      await expect(page).toHaveURL(matching(`/games/${game.slug}/reviews/`));

      await page.goto(`/games/${game.slug}`);
      await expect(page.getByRole("region", { name: "Reviews" }).getByRole("link", { name, exact: true })).toBeVisible();
    });

    test("a new account confirms email and publishes a saved draft", async ({ page }) => {
      const email = visitorEmail("game-draft");
      const name = visitorUsername("gamedft");
      created.push(email);

      await page.goto(`/games/${game.slug}/evaluate`);
      await chooseStance(page, "Enjoyment", "Mixed");
      await chooseStance(page, "Was it well executed?", "Negative");
      await page.getByRole("button", { name: "Save draft" }).click();
      await expect(page).toHaveURL(/\/login\?next=/);

      await signUp(page, email, name);
      await expect(page).toHaveURL(matching(`/games/${game.slug}/evaluate`));
      await chooseStance(page, "Enjoyment", "Mixed");
      await chooseStance(page, "Was it well executed?", "Negative");
      await page.getByRole("button", { name: "Save draft" }).click();
      await expect(page.getByText("Draft saved.")).toBeVisible();

      await page.goto("/dashboard");
      await expect(accountReview(page, game.title)).toContainText("Draft");
      await accountReview(page, game.title).getByRole("link", { name: game.title, exact: true }).click();
      await page.getByRole("button", { name: "Publish Review" }).click();
      await expect(page).toHaveURL(matching(`/games/${game.slug}/reviews/`));

      await page.goto(`/games/${game.slug}`);
      await expect(page.getByRole("region", { name: "Reviews" }).getByRole("link", { name, exact: true })).toBeVisible();
    });

    test("an existing account signs in and publishes a saved draft", async ({ page }) => {
      const email = visitorEmail("game-dlogin");
      const name = visitorUsername("gamedlog");
      created.push(email);

      await registerAndLeave(page, email, name);
      const paths = watchPaths(page);
      await page.goto(`/games/${game.slug}/evaluate`);
      await chooseStance(page, "Enjoyment", "Positive");
      await chooseStance(page, "Was it well executed?", "Positive");
      await page.getByRole("button", { name: "Save draft" }).click();
      await expect(page).toHaveURL(/\/login\?next=/);

      await signIn(page, name);
      expect(paths).not.toContain("/verify");
      await expect(page).toHaveURL(matching(`/games/${game.slug}/evaluate`));
      await chooseStance(page, "Enjoyment", "Positive");
      await chooseStance(page, "Was it well executed?", "Positive");
      await page.getByRole("button", { name: "Save draft" }).click();
      await expect(page.getByText("Draft saved.")).toBeVisible();

      await page.goto("/dashboard");
      await accountReview(page, game.title).getByRole("link", { name: game.title, exact: true }).click();
      await page.getByRole("button", { name: "Publish Review" }).click();
      await expect(page).toHaveURL(matching(`/games/${game.slug}/reviews/`));
      await page.goto("/dashboard");
      await expect(accountReview(page, game.title)).toContainText("Published");
      await expect(accountReview(page, game.title)).not.toContainText("Draft");
    });
  });
});
