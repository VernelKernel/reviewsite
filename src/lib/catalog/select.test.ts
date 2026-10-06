import { describe, expect, it } from "vitest";
import { CAMPAIGN_FLOOR, GENRE_CAP, SLOT_QUOTAS } from "./config";
import { addDays } from "./dates";
import { selectCatalogBatch, type Candidate } from "./select";

const ANCHOR = "2026-10-04";

function game(overrides: Partial<Candidate> & Pick<Candidate, "steamAppId" | "releasedOn" | "tier" | "primaryGenre">): Candidate {
  return {
    reviewCount: 0,
    currentPlayers: 0,
    platforms: ["pc"],
    ...overrides,
  };
}

function dated(slot: "new" | "recent" | "settled", index: number): string {
  if (slot === "new") return addDays(ANCHOR, -index);
  if (slot === "recent") return addDays(ANCHOR, -(60 + index));
  return addDays(ANCHOR, -(120 + index));
}

describe("catalog selection", () => {
  it("fills each slot from its own tier and window", () => {
    const candidates: Candidate[] = [
      ...Array.from({ length: 5 }, (_, index) =>
        game({ steamAppId: index + 1, releasedOn: dated("new", index), tier: "AAA", primaryGenre: "shooter" }),
      ),
      ...Array.from({ length: 5 }, (_, index) =>
        game({
          steamAppId: 100 + index,
          releasedOn: dated("new", index),
          tier: "INDIE",
          primaryGenre: "puzzle",
          reviewCount: 500,
        }),
      ),
      ...Array.from({ length: 8 }, (_, index) =>
        game({ steamAppId: 200 + index, releasedOn: dated("recent", index), tier: "AAA", primaryGenre: "role-playing" }),
      ),
      ...Array.from({ length: 5 }, (_, index) =>
        game({ steamAppId: 300 + index, releasedOn: dated("recent", index), tier: "AA", primaryGenre: "strategy" }),
      ),
      ...Array.from({ length: 2 }, (_, index) =>
        game({ steamAppId: 400 + index, releasedOn: dated("recent", index), tier: "INDIE", primaryGenre: "adventure" }),
      ),
      ...Array.from({ length: 5 }, (_, index) =>
        game({ steamAppId: 500 + index, releasedOn: dated("settled", index), tier: "AAA", primaryGenre: "action" }),
      ),
      ...Array.from({ length: 5 }, (_, index) =>
        game({ steamAppId: 600 + index, releasedOn: dated("settled", index), tier: "AA", primaryGenre: "simulation" }),
      ),
      ...Array.from({ length: 5 }, (_, index) =>
        game({ steamAppId: 700 + index, releasedOn: dated("settled", index), tier: "INDIE", primaryGenre: "platformer" }),
      ),
      ...Array.from({ length: 5 }, (_, index) =>
        game({
          steamAppId: 800 + index,
          releasedOn: dated("settled", index + 20),
          tier: "AA",
          primaryGenre: "horror",
          platforms: ["pc", "playstation-5"],
        }),
      ),
      ...["fighting", "sports-and-racing", "roguelike", "puzzle", "horror"].map((genre, index) =>
        game({
          steamAppId: 900 + index,
          releasedOn: "2026-03-01",
          tier: "INDIE",
          primaryGenre: genre,
        }),
      ),
    ];

    const selection = selectCatalogBatch({ anchor: ANCHOR, candidates });
    expect(selection.shortfalls).toEqual([]);
    expect(selection.placements).toHaveLength(50);
    for (const [slot, quota] of Object.entries(SLOT_QUOTAS)) {
      expect(selection.placements.filter((placement) => placement.slot === slot)).toHaveLength(quota);
    }
    expect(selection.placements.find((placement) => placement.slot === "NEW_AAA")?.primaryGenre).toBe("shooter");
    expect(selection.placements.filter((placement) => placement.slot === "NEW_INDIE").every((placement) => placement.buzzMet)).toBe(true);
    expect(selection.nextAnchor).toBe("2026-09-04");
    expect(selection.campaignComplete).toBe(false);
  });

  it("does not spend an indie on an AAA slot", () => {
    const selection = selectCatalogBatch({
      anchor: ANCHOR,
      candidates: [game({ steamAppId: 1, releasedOn: ANCHOR, tier: "INDIE", primaryGenre: "action", reviewCount: 900 })],
    });
    expect(selection.placements.some((placement) => placement.slot === "NEW_AAA")).toBe(false);
    expect(selection.placements.filter((placement) => placement.slot === "NEW_INDIE")).toHaveLength(1);
  });

  it("skips games already in the catalog", () => {
    const selection = selectCatalogBatch({
      anchor: ANCHOR,
      excludedAppIds: [7],
      candidates: [game({ steamAppId: 7, releasedOn: ANCHOR, tier: "AAA", primaryGenre: "action" })],
    });
    expect(selection.placements).toEqual([]);
  });

  it("widens a thin window twice and then records the shortfall", () => {
    const inside = addDays(ANCHOR, -40);
    const tooFar = addDays(ANCHOR, -61);
    const selection = selectCatalogBatch({
      anchor: ANCHOR,
      candidates: [
        game({ steamAppId: 1, releasedOn: inside, tier: "AAA", primaryGenre: "action" }),
        game({ steamAppId: 2, releasedOn: tooFar, tier: "AAA", primaryGenre: "shooter" }),
      ],
    });
    const placed = selection.placements.filter((placement) => placement.slot === "NEW_AAA");
    expect(placed.map((placement) => placement.steamAppId)).toEqual([1]);
    expect(placed[0].windowWidened).toBe(true);
    expect(selection.shortfalls.find((item) => item.slot === "NEW_AAA")?.missing).toBe(4);
  });

  it("keeps a primary genre to eight games in the batch", () => {
    const candidates = [
      ...Array.from({ length: 9 }, (_, index) =>
        game({ steamAppId: index + 1, releasedOn: dated("new", index % 5), tier: "AAA", primaryGenre: "action" }),
      ),
      ...Array.from({ length: 6 }, (_, index) =>
        game({ steamAppId: 50 + index, releasedOn: dated("recent", index), tier: "AAA", primaryGenre: "action" }),
      ),
      game({ steamAppId: 80, releasedOn: dated("recent", 0), tier: "AAA", primaryGenre: "shooter" }),
    ];
    const selection = selectCatalogBatch({ anchor: ANCHOR, candidates });
    const action = selection.placements.filter((placement) => placement.primaryGenre === "action");
    expect(action.length).toBeLessThanOrEqual(GENRE_CAP);
    expect(selection.placements.some((placement) => placement.steamAppId === 80 && placement.slot === "RECENT_AAA")).toBe(true);
    expect(selection.shortfalls.find((item) => item.slot === "RECENT_AAA")?.missing).toBeGreaterThan(0);
  });

  it("uses busier indies when none meet the buzz bar", () => {
    const candidates = Array.from({ length: 5 }, (_, index) =>
      game({
        steamAppId: index + 1,
        releasedOn: dated("new", index),
        tier: "INDIE",
        primaryGenre: "puzzle",
        reviewCount: 20 + index,
      }),
    );
    const selection = selectCatalogBatch({ anchor: ANCHOR, candidates });
    const placed = selection.placements.filter((placement) => placement.slot === "NEW_INDIE");
    expect(placed).toHaveLength(5);
    expect(placed.every((placement) => placement.buzzMet === false)).toBe(true);
    expect(placed[0].steamAppId).toBe(5);
  });

  it("steps the next anchor back when the newest slots are empty", () => {
    const selection = selectCatalogBatch({
      anchor: ANCHOR,
      candidates: [game({ steamAppId: 1, releasedOn: dated("recent", 0), tier: "AA", primaryGenre: "strategy" })],
    });
    expect(selection.nextAnchor).toBe("2026-09-04");
  });

  it("moves the next anchor to the day before an older newest-slot game", () => {
    const selection = selectCatalogBatch({
      anchor: ANCHOR,
      candidates: [game({ steamAppId: 1, releasedOn: addDays(ANCHOR, -40), tier: "AAA", primaryGenre: "action" })],
    });
    expect(selection.nextAnchor).toBe(addDays(ANCHOR, -41));
  });

  it("stops the campaign once the next anchor reaches the floor", () => {
    const selection = selectCatalogBatch({
      anchor: "2026-01-15",
      floor: CAMPAIGN_FLOOR,
      candidates: [],
    });
    expect(selection.nextAnchor <= CAMPAIGN_FLOOR).toBe(true);
    expect(selection.campaignComplete).toBe(true);
  });

  it("spends genre-debt slots on the thinnest primary genres", () => {
    const fillers = [
      ...Array.from({ length: 5 }, (_, index) =>
        game({
          steamAppId: 20 + index,
          releasedOn: dated("new", index),
          tier: "INDIE",
          primaryGenre: "platformer",
          reviewCount: 400,
        }),
      ),
      ...Array.from({ length: 2 }, (_, index) =>
        game({ steamAppId: 30 + index, releasedOn: dated("recent", index), tier: "INDIE", primaryGenre: "strategy" }),
      ),
      ...Array.from({ length: 5 }, (_, index) =>
        game({ steamAppId: 40 + index, releasedOn: addDays("2026-06-01", index), tier: "INDIE", primaryGenre: "simulation" }),
      ),
    ];
    const selection = selectCatalogBatch({
      anchor: ANCHOR,
      catalogGenreCounts: { simulation: 6, fighting: 0, puzzle: 0 },
      candidates: [
        ...fillers,
        game({ steamAppId: 2, releasedOn: "2026-02-01", tier: "INDIE", primaryGenre: "fighting" }),
        game({ steamAppId: 3, releasedOn: "2026-03-01", tier: "INDIE", primaryGenre: "puzzle" }),
      ],
    });
    const debt = selection.placements.filter((placement) => placement.slot === "GENRE_DEBT").map((placement) => placement.primaryGenre);
    expect(debt[0]).toBe("fighting");
    expect(debt[1]).toBe("puzzle");
  });
});
