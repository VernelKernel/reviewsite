import { describe, expect, it } from "vitest";
import { mailServices, networkTargets, shareFileName, shareSummary, WATERMARK_LINE } from "./targets";

describe("share targets", () => {
  const url = "https://frame.example/games/hades-ii?lens=EXECUTION";
  const title = "Hades II";

  it("names Frame as the source of the reading", () => {
    expect(shareSummary(title)).toContain(WATERMARK_LINE);
    expect(shareSummary(title)).toContain(title);
  });

  it("points each network at the work page", () => {
    const targets = networkTargets(url, title);
    expect(targets.map((item) => item.id)).toEqual(["x", "reddit", "bluesky", "pinterest", "facebook"]);
    for (const target of targets) {
      expect(decodeURIComponent(target.href)).toContain(url);
    }
    expect(decodeURIComponent(targets[0].href)).toContain(WATERMARK_LINE);
    expect(decodeURIComponent(targets[2].href)).toContain(url);
  });

  it("offers email services that carry the work link", () => {
    const services = mailServices(url, title);
    expect(services.map((item) => item.label)).toEqual(["Gmail", "Outlook", "Yahoo Mail", "Email app"]);
    expect(services[3].href.startsWith("mailto:")).toBe(true);
    for (const service of services) {
      expect(decodeURIComponent(service.href)).toContain(url);
      expect(decodeURIComponent(service.href)).toContain(WATERMARK_LINE);
    }
  });

  it("names the downloaded file from the work slug", () => {
    expect(shareFileName("/games/hades-ii?lens=EXECUTION")).toBe("hades-ii-frame.png");
    expect(shareFileName("/movies/the-green-knight")).toBe("the-green-knight-frame.png");
  });
});
