import { describe, expect, it } from "vitest";
import { CORE_OUTLET_NAMES } from "@/lib/aggregation/landscape";
import { OUTLETS, articleLocations, outletsForGame, pickReviewLink, postSitemapUrls, sitemapLocations } from "./outlets";

describe("critic outlets", () => {
  it("keeps the core panel at the coverage names", () => {
    const core = OUTLETS.filter((item) => item.kind === "core").map((item) => item.name);
    expect(core).toEqual([...CORE_OUTLET_NAMES]);
  });

  it("searches platform desks and indie sites only when they apply", () => {
    const aaa = outletsForGame({ platforms: ["pc"], slots: ["NEW_AAA"], publishers: ["Ubisoft"] }).map((item) => item.slug);
    expect(aaa).toContain("ign");
    expect(aaa).toContain("game-informer");
    expect(aaa).toContain("rpg-site");
    expect(aaa).not.toContain("push-square");
    expect(aaa).not.toContain("indie-gamer-chick");
    expect(aaa).not.toContain("vooks");
    expect(aaa).not.toContain("pure-nintendo");

    const playstation = outletsForGame({
      platforms: ["playstation-5"],
      slots: ["RECENT_AAA"],
      publishers: ["Sony Interactive Entertainment"],
    }).map((item) => item.slug);
    expect(playstation).toContain("push-square");
    expect(playstation).not.toContain("nintendo-life");
    expect(playstation).not.toContain("vooks");

    const indie = outletsForGame({ platforms: ["pc"], slots: ["NEW_INDIE"], publishers: ["North Wind"] }).map((item) => item.slug);
    expect(indie).toContain("indie-game-website");
    expect(indie).toContain("indie-gamer-chick");

    const unplaced = outletsForGame({ platforms: ["pc"], slots: [], publishers: ["North Wind"] }).map((item) => item.slug);
    expect(unplaced).toContain("indie-gamer-chick");
  });

  it("picks the review link that names the game", () => {
    const ign = OUTLETS.find((item) => item.slug === "ign");
    expect(ign).toBeTruthy();
    const html = `
      <a href="https://www.ign.com/articles/alkurai-preview">Preview</a>
      <a href="https://www.ign.com/articles/other-game-review">Other</a>
      <a href="/articles/alkurai-review">Review</a>
      <a href="https://www.gamespot.com/alkurai-review">Elsewhere</a>
    `;
    expect(pickReviewLink(html, ign!, "Alkurai")).toBe("https://www.ign.com/articles/alkurai-review");
  });

  it("uses the Game Informer search page and the Escapist post archive", () => {
    const informer = OUTLETS.find((item) => item.slug === "game-informer");
    const escapist = OUTLETS.find((item) => item.slug === "the-escapist");
    expect(informer?.searchUrl("Fields of Mistria")).toBe(
      "https://www.gameinformer.com/search?keyword=Fields%20of%20Mistria",
    );
    expect(escapist?.lookup).toBe("sitemap");
    expect(escapist?.searchUrl("Alkurai")).toBe("https://www.escapistmagazine.com/wp-sitemap.xml");
  });

  it("reads review links from a post sitemap and skips the other archives", () => {
    const index = `
      <loc>https://www.escapistmagazine.com/post-sitemap.xml</loc>
      <loc>https://www.escapistmagazine.com/post-sitemap2.xml</loc>
      <loc>https://www.escapistmagazine.com/news-sitemap.xml</loc>
      <loc>https://www.escapistmagazine.com/guides-sitemap.xml</loc>
    `;
    expect(postSitemapUrls(index)).toEqual([
      "https://www.escapistmagazine.com/post-sitemap.xml",
      "https://www.escapistmagazine.com/post-sitemap2.xml",
    ]);

    const mixed = `
      <loc>https://www.digitallydownloaded.net/wp-sitemap-posts-post-1.xml</loc>
      <loc>https://www.digitallydownloaded.net/wp-sitemap-posts-page-1.xml</loc>
      <loc>https://gamingtrend.com/sitemap-posts.xml</loc>
      <loc>https://gamingtrend.com/sitemap-pages.xml</loc>
      <loc>https://www.rpgsite.net/sitemap/articles.xml</loc>
      <loc>https://www.rpgsite.net/sitemap/games.xml</loc>
      <loc>https://noisypixel.net/post-sitemap1.xml</loc>
    `;
    expect(postSitemapUrls(mixed)).toEqual([
      "https://www.digitallydownloaded.net/wp-sitemap-posts-post-1.xml",
      "https://gamingtrend.com/sitemap-posts.xml",
      "https://www.rpgsite.net/sitemap/articles.xml",
      "https://noisypixel.net/post-sitemap1.xml",
    ]);

    const escapist = OUTLETS.find((item) => item.slug === "the-escapist");
    const page = sitemapLocations(`
      <loc>https://www.escapistmagazine.com/alkurai-is-out-now/</loc>
      <loc>https://www.escapistmagazine.com/reviews/alkurai/</loc>
    `)
      .map((link) => `<a href="${link}">`)
      .join("\n");
    expect(pickReviewLink(page, escapist!, "Alkurai")).toBe("https://www.escapistmagazine.com/reviews/alkurai/");
  });

  it("reads a post archive that is already the article list", () => {
    const xml = `
      <loc>https://www.rpgsite.net/sitemap/games.xml</loc>
      <loc>https://www.rpgsite.net/review/10400-alkurai</loc>
      <loc>https://www.rpgsite.net/news/10401-alkurai-launch-trailer</loc>
    `;
    expect(articleLocations(xml)).toEqual([
      "https://www.rpgsite.net/review/10400-alkurai",
      "https://www.rpgsite.net/news/10401-alkurai-launch-trailer",
    ]);
    const rpgSite = OUTLETS.find((item) => item.slug === "rpg-site");
    const page = articleLocations(xml).map((link) => `<a href="${link}">`).join("\n");
    expect(rpgSite?.lookup).toBe("sitemap");
    expect(pickReviewLink(page, rpgSite!, "Alkurai")).toBe("https://www.rpgsite.net/review/10400-alkurai");
  });

  it("points added specialist desks at their own archives", () => {
    for (const slug of ["digitally-downloaded", "thesixthaxis", "cogconnected", "cgmagazine", "gamingtrend", "rpgfan"]) {
      const item = OUTLETS.find((outlet) => outlet.slug === slug);
      expect(item?.lookup).toBe("sitemap");
      expect(item?.searchUrl("Alkurai")).toMatch(/sitemap/i);
    }
    const vooks = OUTLETS.find((item) => item.slug === "vooks");
    const nintendo = outletsForGame({ platforms: ["switch"], slots: ["RECENT_AAA"], publishers: ["Nintendo"] }).map((item) => item.slug);
    expect(nintendo).toContain("vooks");
    expect(nintendo).toContain("pure-nintendo");
    expect(vooks?.searchUrl("")).toBe("https://www.vooks.net/sitemap_index.xml");
  });

  it("keeps Edge results on the Edge path", () => {
    const edge = OUTLETS.find((item) => item.slug === "edge");
    const html = `
      <a href="https://www.gamesradar.com/alkurai-review">GamesRadar</a>
      <a href="https://www.gamesradar.com/edge/alkurai-review">Edge</a>
    `;
    expect(pickReviewLink(html, edge!, "Alkurai")).toBe("https://www.gamesradar.com/edge/alkurai-review");
  });
});
