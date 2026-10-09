import { describe, expect, it } from "vitest";
import { archiveOutlet, mergeOutlets, OUTLETS } from "./outlets";
import {
  archiveCandidates,
  criticSearchHits,
  missingPublications,
  pickCriticGame,
  publicationsFromCriticList,
} from "./critic-list";
import { isThin, THIN_CRITIC_EVALUATIONS } from "./thin";

describe("thin critic coverage", () => {
  it("treats a small critic sample as thin", () => {
    expect(isThin(0)).toBe(true);
    expect(isThin(THIN_CRITIC_EVALUATIONS - 1)).toBe(true);
    expect(isThin(THIN_CRITIC_EVALUATIONS)).toBe(false);
  });
});

describe("critic list publications", () => {
  it("picks the game whose title matches and ignores a near title", () => {
    const hits = criticSearchHits([
      { id: 2, name: "Hades II", dist: 0.08 },
      { id: 1, name: "Hades", dist: 0.2 },
    ]);
    expect(pickCriticGame(hits, "Hades")?.id).toBe(1);
    expect(pickCriticGame(hits, "Something Else")).toBeNull();
  });

  it("keeps the publication name and site, and drops scores", () => {
    const listed = publicationsFromCriticList([
      {
        score: 9,
        snippet: "A long quote that must not be stored.",
        externalUrl: "https://www.rpgsite.net/review/10400-hades",
        Outlet: { name: "RPG Site" },
      },
      {
        externalUrl: "https://opencritic.com/outlet/ign",
        Outlet: { name: "OpenCritic" },
      },
      {
        url: "https://www.ign.com/articles/hades-review",
        outlet: { name: "IGN" },
      },
    ]);
    expect(listed).toEqual([
      { name: "RPG Site", host: "rpgsite.net" },
      { name: "IGN", host: "ign.com" },
    ]);
    expect(JSON.stringify(listed)).not.toContain("long quote");
    expect(JSON.stringify(listed)).not.toContain("9");
  });

  it("drops publications already on the roster", () => {
    const ign = OUTLETS.find((item) => item.slug === "ign");
    expect(ign).toBeTruthy();
    const known = {
      hosts: new Set(["ign.com"]),
      names: new Set(["ign"]),
      slugs: new Set(["ign"]),
    };
    expect(
      missingPublications(known, [
        { name: "IGN", host: "ign.com" },
        { name: "RPG Site", host: "rpgsite.net" },
      ]),
    ).toEqual([{ name: "RPG Site", host: "rpgsite.net" }]);
  });

  it("points a new publication at its own sitemap candidates", () => {
    expect(archiveCandidates("www.rpgsite.net")).toEqual([
      "https://rpgsite.net/sitemap_index.xml",
      "https://rpgsite.net/wp-sitemap.xml",
      "https://rpgsite.net/sitemap.xml",
    ]);
  });

  it("merges an archived publication without duplicating the roster", () => {
    const extra = archiveOutlet("rpg-site", "RPG Site", "rpgsite.net", "https://rpgsite.net/sitemap.xml");
    const merged = mergeOutlets(OUTLETS, [extra, archiveOutlet("new-desk", "New Desk", "newdesk.example", "https://newdesk.example/sitemap.xml")]);
    expect(merged.filter((item) => item.slug === "rpg-site")).toHaveLength(1);
    expect(merged.some((item) => item.slug === "new-desk" && item.lookup === "sitemap")).toBe(true);
  });
});
