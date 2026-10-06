import { describe, expect, it } from "vitest";
import { ownershipFromSteam, parseSteamPersona, parseSteamReviews, playtimeBucket, reviewPageState, reviewsStillNeeded, selectSteamReviews, steamReviewUrl } from "./reviews";

describe("steam review import", () => {
  it("keeps the review text, author, and playtime, and drops the rest of the payload", () => {
    const reviews = parseSteamReviews({
      query_summary: { review_score_desc: "Mixed" },
      reviews: [
        {
          recommendationid: "99",
          author: { steamid: "76561198000000000", playtime_at_review: 125, playtime_forever: 400, personaname: "ignored" },
          language: "english",
          review: "The [b]combat[/b] is sharp.\n\n[url=https://example.com]Notes[/url]",
          timestamp_created: 1759700000,
          voted_up: true,
          steam_purchase: true,
          received_for_free: false,
          written_during_early_access: false,
        },
      ],
    });
    expect(reviews).toEqual([
      {
        recommendationId: "99",
        steamId: "76561198000000000",
        body: "The combat is sharp.\n\nNotes",
        language: "english",
        votedUp: true,
        createdAt: 1759700000,
        playtimeMinutes: 125,
        steamPurchase: true,
        receivedForFree: false,
        earlyAccess: false,
      },
    ]);
    expect(JSON.stringify(reviews)).not.toContain("personaname");
    expect(steamReviewUrl(reviews[0].steamId, 2240620)).toBe(
      "https://steamcommunity.com/profiles/76561198000000000/recommended/2240620/",
    );
  });

  it("maps playtime and ownership, and keeps substantial English reviews", () => {
    expect(playtimeBucket(30)).toBe("LESS_THAN_ONE_HOUR");
    expect(playtimeBucket(125)).toBe("ONE_TO_FIVE_HOURS");
    expect(playtimeBucket(null)).toBe("UNKNOWN");
    expect(ownershipFromSteam({ steamPurchase: true, receivedForFree: false })).toBe("OWNED");
    expect(ownershipFromSteam({ steamPurchase: true, receivedForFree: true })).toBe("FREE");
    const body = "x".repeat(80);
    const selected = selectSteamReviews(
      [
        { recommendationId: "1", steamId: "10000", body: "short", language: "english", votedUp: true, createdAt: null, playtimeMinutes: null, steamPurchase: true, receivedForFree: false, earlyAccess: false },
        { recommendationId: "2", steamId: "10001", body, language: "english", votedUp: false, createdAt: null, playtimeMinutes: null, steamPurchase: true, receivedForFree: false, earlyAccess: false },
        { recommendationId: "3", steamId: "10001", body, language: "english", votedUp: true, createdAt: null, playtimeMinutes: null, steamPurchase: true, receivedForFree: false, earlyAccess: false },
      ],
      8,
      80,
    );
    expect(selected.map((review) => review.recommendationId)).toEqual(["2"]);
  });

  it("keeps paging only while a page still has reviews", () => {
    expect(reviewsStillNeeded(0, 8)).toBe(8);
    expect(reviewsStillNeeded(6, 8)).toBe(2);
    expect(reviewsStillNeeded(8, 8)).toBe(0);
    expect(reviewPageState({ cursor: "NEXT", reviews: [{ review: "kept" }], query_summary: { total_reviews: 3 } })).toEqual({
      cursor: "NEXT",
      total: 3,
    });
    expect(reviewPageState({ cursor: "NEXT", reviews: [], query_summary: { total_reviews: 0 } }).cursor).toBeNull();
  });

  it("reads a Steam profile name", () => {
    expect(parseSteamPersona(`<profile><steamID><![CDATA[Not a Leo]]></steamID></profile>`)).toBe("Not a Leo");
    expect(parseSteamPersona(`<profile><steamID><![CDATA[Elsa&lt;3]]></steamID></profile>`)).toBe("Elsa<3");
    expect(parseSteamPersona("<profile></profile>")).toBeNull();
  });
});
