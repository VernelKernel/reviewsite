import { describe, expect, it } from "vitest";
import { mapSteamLabels } from "./genres";
import { parseSteamDate } from "./dates";
import { parseAppDetails, parseReviewSummary, parseSearchPage } from "./parse";
import { tierForPublishers } from "./publishers";

describe("steam parsers", () => {
  it("reads a review summary and drops review text", () => {
    const summary = parseReviewSummary({
      query_summary: {
        review_score_desc: "Very Positive",
        total_positive: 80,
        total_negative: 20,
        total_reviews: 100,
      },
      reviews: [{ review: "the tutorial is atrocious and the review body must not be stored" }],
    });
    expect(summary).toEqual({
      label: "Very Positive",
      positiveCount: 80,
      negativeCount: 20,
      totalCount: 100,
    });
    expect(JSON.stringify(summary)).not.toContain("atrocious");
  });

  it("parses store dates and search rows", () => {
    expect(parseSteamDate("4 Oct, 2026")).toBe("2026-10-04");
    expect(parseSteamDate("Oct 4, 2026")).toBe("2026-10-04");
    const page = parseSearchPage({
      total_count: 2,
      results_html: `
        <a href="https://store.steampowered.com/app/4914240/Veillombre/" data-ds-appid="4914240" data-ds-tagids="[597,1664]" class="search_result_row">
          <div class="search_released responsive_secondrow">Oct 5, 2026</div>
        </a>
        <a class="search_result_row" data-ds-appid="2240620"><div class="search_released">4 Oct, 2026</div></a>
      `,
    });
    expect(page.hits).toEqual([
      { appId: 4914240, releasedOn: "2026-10-05", tagIds: [597, 1664] },
      { appId: 2240620, releasedOn: "2026-10-04", tagIds: [] },
    ]);
  });

  it("reads app details without treating a store description as a review", () => {
    const details = parseAppDetails(10, {
      "10": {
        success: true,
        data: {
          type: "game",
          name: "Signal Garden",
          short_description: "A quiet sim.<br>About tending.",
          header_image: "https://cdn.example/header.jpg",
          developers: ["North Wind"],
          publishers: ["North Wind"],
          release_date: { coming_soon: false, date: "1 Mar, 2026" },
          genres: [{ description: "Indie" }, { description: "Simulation" }],
          categories: [{ description: "Single-player" }],
          platforms: { windows: true, mac: false, linux: false },
        },
      },
    });
    expect(details?.releasedOn).toBe("2026-03-01");
    expect(details?.synopsis).toBe("A quiet sim.\nAbout tending.");
    expect(details?.windows).toBe(true);
  });
});

describe("genre and tier mapping", () => {
  it("prefers a specific genre over action", () => {
    expect(mapSteamLabels(["Action", "RPG"]).primary).toBe("role-playing");
    expect(mapSteamLabels(["Action", "RPG"]).secondary).toContain("action");
    expect(mapSteamLabels(["Indie", "Roguelike"]).primary).toBe("roguelike");
  });

  it("treats an unlisted publisher as indie", () => {
    expect(tierForPublishers(["Electronic Arts"])).toBe("AAA");
    expect(tierForPublishers(["Larian Studios"])).toBe("AA");
    expect(tierForPublishers(["North Wind"])).toBe("INDIE");
  });
});
