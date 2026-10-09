import { describe, expect, it } from "vitest";
import { articleText } from "./article-text";

describe("article text", () => {
  it("reads the article and drops navigation and scripts", () => {
    const html = `
      <script>secret instructions</script>
      <nav>Menu</nav>
      <article><p>The combat is readable &amp; the port is rough.</p></article>
      <footer>Subscribe</footer>
    `;
    expect(articleText(html)).toBe("The combat is readable & the port is rough.");
    expect(articleText(html)).not.toContain("secret");
    expect(articleText(html)).not.toContain("Subscribe");
  });
});