import { expect, type Page } from "@playwright/test";

const ENJOYMENT = ["Engagement", "Fun", "Immersion"] as const;
const EXECUTION = [
  ["Gameplay", "Gameplay. Mechanics"],
  ["Story", "Story. Narrative and writing"],
  ["Music", "Music. Soundtrack and audio"],
] as const;

const readyPages = new WeakSet<Page>();

export function visitorEmail(label: string): string {
  return `e2e.${label}.${Date.now()}@example.com`;
}

export function visitorUsername(label: string): string {
  const stem = label.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "user";
  return `${stem}${Date.now().toString(36)}`.slice(0, 24);
}

export async function waitForBuilder(page: Page) {
  if (readyPages.has(page)) return;
  const preview = page.locator("#intake-preview-title");
  if ((await preview.count()) > 0) {
    const title = page.getByRole("textbox", { name: "Title" });
    await expect(async () => {
      await title.fill("Ready");
      await expect(preview).toHaveText("Ready", { timeout: 1_000 });
    }).toPass({ timeout: 20_000 });
    readyPages.add(page);
    return;
  }

  const impression = page.getByRole("textbox", { name: "Overall impression" });
  await expect(async () => {
    await impression.fill("Ready");
    await expect(page.getByText("5/80")).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 20_000 });
  await impression.fill("");
  readyPages.add(page);
}

export async function chooseStance(page: Page, group: "Enjoyment" | "Was it well executed?", stance: "Positive" | "Mixed" | "Negative") {
  await waitForBuilder(page);
  await page.getByRole("group", { name: group }).getByRole("radio", { name: stance }).check({ force: true });
}

export async function judgeDimensions(page: Page, names: ReadonlyArray<readonly [string, string] | string>) {
  for (const entry of names) {
    const [name] = typeof entry === "string" ? [entry] : entry;
    const judgment = page.getByRole("combobox", { name: new RegExp(`^${escapeRegExp(name)}(?:\\.|$)`) });
    await judgment.waitFor();
    await judgment.selectOption("POSITIVE");
    await page.getByRole("combobox", { name: `How much ${name} mattered` }).selectOption({ label: "Quite a bit" });
  }
}

export async function fillCatalogReview(page: Page, title: string) {
  await waitForBuilder(page);
  await page.getByRole("textbox", { name: "Title" }).fill(title);
  await chooseCatalog(page, "Platform", "PC");
  await chooseCatalog(page, "Genre", "Action");
  await chooseStance(page, "Enjoyment", "Positive");
  await judgeDimensions(page, ENJOYMENT);
  await chooseStance(page, "Was it well executed?", "Mixed");
  await judgeDimensions(page, EXECUTION);
}

export const visitorPassword = "e2e-password";

export async function signUp(page: Page, email: string, username: string) {
  if (!new URL(page.url()).pathname.startsWith("/signup")) {
    await page.getByRole("link", { name: "Create an account" }).click();
  }
  await expect(page).toHaveURL(/\/signup/);
  await page.getByRole("textbox", { name: "Username" }).fill(username);
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(visitorPassword);
  await page.getByLabel("Confirm password").fill(visitorPassword);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
  const link = page.getByRole("link", { name: /\/verify\?token=/ });
  await expect(link).toBeVisible();
  await link.click();
  await page.getByRole("button", { name: "Confirm email" }).click();
  await page.waitForURL((url) => url.pathname !== "/verify");
}

export async function createAccount(page: Page, email: string, username: string) {
  await signUp(page, email, username);
}

export async function signIn(page: Page, identifier: string) {
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Check your email" })).toHaveCount(0);
  await page.getByRole("textbox", { name: "Username or email" }).fill(identifier);
  await page.getByLabel("Password", { exact: true }).fill(visitorPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => url.pathname !== "/login");
}

export async function logOut(page: Page) {
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("button", { name: "Log out" }).click();
  await page.waitForURL((url) => url.pathname === "/");
}

export function accountReview(page: Page, title: string) {
  return page.getByRole("region", { name: "Reviews" }).locator("article").filter({
    has: page.getByRole("link", { name: title, exact: true }),
  });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function chooseCatalog(page: Page, label: "Platform" | "Genre", name: string) {
  const box = page.getByRole("combobox", { name: label });
  await expect(async () => {
    if (!(await box.isVisible())) await page.getByRole("button", { name: `Show ${label} options` }).click();
    await expect(box).toBeVisible({ timeout: 1_000 });
  }).toPass();
  await box.fill(name);
  await box.press("Enter");
  await page.keyboard.press("Escape");
}
