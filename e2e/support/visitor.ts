import { expect, type Page } from "@playwright/test";
import { latestLoginCode } from "./db";

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

export async function createAccount(page: Page, email: string, displayName: string) {
  await page.getByRole("link", { name: "Create an account" }).click();
  await page.getByRole("textbox", { name: "Display name" }).fill(displayName);
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("button", { name: "Email me a code" }).click();
  await expect(page.getByRole("heading", { name: "Enter the code" })).toBeVisible();
  const code = await latestLoginCode(email);
  await page.getByRole("textbox", { name: "6-digit code" }).fill(code);
  await page.getByRole("button", { name: "Confirm code" }).click();
  await page.waitForURL((url) => url.pathname !== "/verify");
}

export async function verifyIntakeEmail(page: Page, email: string, displayName: string) {
  await page.getByRole("textbox", { name: "Display name" }).fill(displayName);
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("button", { name: "Email me a verification link" }).click();
  const link = page.getByRole("link", { name: /\/review\/verify\?token=/ });
  let href = "";
  await expect.poll(async () => {
    if (await link.count()) href = (await link.first().getAttribute("href")) ?? "";
    if (!href) {
      const stored = (await page.context().cookies()).find((cookie) => cookie.name === "frame_dev_verify")?.value;
      href = stored ? decodeURIComponent(stored) : "";
    }
    return href;
  }).toMatch(/\/review\/verify\?token=/);
  if (await link.count()) await link.first().click();
  else await page.goto(href);
  await page.getByRole("button", { name: "Confirm email" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/review/verify"));
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
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
