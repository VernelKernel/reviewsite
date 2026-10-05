# **Mood System & Visual Directions**

*Review / Entertainment Evaluation Website*

# **Design premise**

The site should feel like an instrument for seeing a work clearly—not a machine for telling users what to think about it. The work (game, movie, etc.) is the visual subject; the interface is the frame. The system should feel editorial, analytical, media-centric, contemporary, and human without looking like a generic SaaS dashboard, a gaming storefront, or a score factory.

# **Three interchangeable visual moods**

These are not three separate websites. They are three skins over the same information architecture and component system. Games, movies, reviews, evaluations, navigation, forms, and data remain structurally identical. Only visual tokens, typography, shape language, density, media treatment, motion, and selected component variants change.

## **01 — Editorial Observatory**

A serious cultural publication: restrained, intelligent, spacious, typographically confident.

**Color:** Warm paper canvas, white surfaces, charcoal ink, slate metadata, deep indigo interaction accent. Minimal semantic color.

**Typography:** Source Sans 3 or similar for body/UI; restrained display face such as DM Sans or Space Grotesk for major headings.

**Shape & layout:** Thin rules, 4–6px corners, subtle shadows, generous whitespace. Large editorial headlines. Review prose gets generous line length.

**Media treatment:** Game/movie art appears as large editorial objects: poster/key art on the left, title and evaluation summary on the right. Avoid busy overlays.

**Interaction:** Hover reveals useful metadata rather than decorative effects. Buttons darken/lighten slightly and move 1px on active.

**Strength:** Best default candidate. Trustworthy, readable, mature, and broad enough to expand from games into film, television, books, music, etc.

**Avoid:** Avoid: neon, excessive pills, glassmorphism, giant numerical scores, heavy dashboard styling.

## **02 — Cinematic Archive**

A darker, more immersive media archive. The interface recedes so artwork and trailers carry emotional weight.

**Color:** Near-black graphite canvas, charcoal surfaces, off-white text, muted cool gray, electric indigo/cobalt accent. Semantic colors remain restrained.

**Typography:** A highly legible sans-serif for UI/body paired with a cinematic or slightly humanist display face.

**Shape & layout:** 6–8px corners, layered dark surfaces, thin low-contrast rules, subtle image masks, slightly denser composition.

**Media treatment:** Key art/posters become larger and more dramatic. Hero media may bleed toward the viewport edge while text remains in a clean column.

**Interaction:** Slow, restrained image lift/scale on hover; tabs and buttons brighten; active controls have a crisp inset/highlight treatment.

**Strength:** Strong for users browsing games/movies as cultural objects. Particularly good for trailer-heavy discovery pages.

**Avoid:** Avoid: turning every page into a movie poster, excessive black-on-black contrast, glowing neon borders.

## **03 — Modern Cultural Index**

A crisp contemporary database with a little more personality and visual energy. Feels like a high-end cultural index rather than a review blog.

**Color:** Cool near-white canvas, white surfaces, dark graphite text, blue-violet accent, restrained teal/amber/red for data states.

**Typography:** Manrope, Inter, or similar for the system; a geometric display face for section headings.

**Shape & layout:** Moderate density, 8px corners, compact metadata, strong grid alignment, cards with clear boundaries. More visible data visualization.

**Media treatment:** Game/movie cards are compact information objects: art, title, year, genres, evaluation distribution, and review-count context.

**Interaction:** Cards lift 2–3px and gain a subtle border/shadow change. Filters/tabs have strong selected states. Charts animate only when data changes.

**Strength:** Best for discovery, comparison, search, and large-scale aggregation. Makes the site's structured review system visually prominent.

**Avoid:** Avoid: becoming a spreadsheet, excessive badges, colorful dashboard syndrome, treating every metric as equally important.

---

# **04 — Slightly Game-Native**

**Mood**

A contemporary game publication that clearly belongs to the gaming world without falling into the visual clichés of gaming websites. More energetic and tactile than Editorial Observatory, but still serious enough to handle criticism and structured evaluation.

**Core idea**

> **“A serious game publication that knows games are fun.”**

The site should feel immediately comfortable to someone who spends time around games, Steam, consoles, indie development, and gaming culture—but without becoming a storefront, esports site, Discord UI, or RGB gaming peripheral advertisement.

### **Color**

A cooler, slightly higher-contrast palette than Editorial Observatory.

* Cool off-white or very pale gray canvas  
* Dark graphite text  
* Deep charcoal surfaces  
* Strong electric blue / indigo primary accent  
* Optional secondary violet accent  
* Restrained green / amber / red for evaluation states  
* Occasional use of game-art-derived accent color **inside media objects**, not the global UI

The important difference is that the accent can be a little more energetic.

Where Editorial Observatory says:

> **“This is an editorial publication.”**

Game-Native says:

> **“This is an editorial publication about games.”**

### **Typography**

Use a highly readable sans-serif for body and UI, with a slightly more geometric or technical display face.

Potential directions:

* Manrope  
* Inter  
* Space Grotesk  
* IBM Plex Sans

Headlines can be slightly heavier and more compact than the Editorial Observatory treatment.

Avoid novelty/gamer fonts.

### **Shape & layout**

Moderate 6–8px corners.

Slightly tighter spacing than Editorial Observatory.

More cards.

More visible interaction states.

More horizontal media strips.

Potentially stronger use of segmented controls and tabs.

However:

> **Do not turn every piece of information into a pill.**

The site should retain editorial hierarchy rather than becoming a game UI.

### **Media treatment**

Game artwork gets a little more presence.

Game cards can use:

* key art  
* screenshots  
* character art  
* trailer thumbnails

with subtle image treatments and stronger hover behavior.

A game page could have a large hero image followed by:

**The Game**

**The Review Landscape**

**What Players Agree On**

**Where They Disagree**

This direction could also make trailer/video discovery more prominent than the other moods.

### **Interaction**

More tactile than the other directions.

Hovering over a game card could produce a slight lift and image scale.

Navigation tabs can have a stronger active state.

Buttons can have subtle depth.

Trailer buttons could use a compact play icon and a more prominent interaction state.

But animation remains restrained.

No particle effects.

No glowing neon borders.

No “gaming keyboard” aesthetic.

### **Strength**

This is the strongest direction if the site's initial audience is primarily **game players**, particularly people who already use Steam, gaming databases, Reddit, Discord, and gaming publications but want a more rigorous way to interpret reviews.

It gives the site an immediate cultural home without sacrificing the larger ambition of eventually covering movies and other media.

### **Avoid**

* Neon overload  
* RGB aesthetics  
* Esports styling  
* Giant “GAMING” typography  
* Excessive gradients  
* Controller/keyboard iconography everywhere  
* Steam imitation  
* Gamification of review quality  
* Making criticism feel like a competitive scoreboard

---

# **Shared visual rules**

* The media object is always the subject. UI chrome must not visually overpower the game's or movie's artwork.  
* Brand accent color means interaction/navigation, not positive reception.  
* Green, amber, and red are semantic evaluation states only and should be visually restrained.  
* Never rely on color alone for evaluation states; pair color with text, labels, icons, or position.  
* No giant aggregate score should dominate a work page. The review landscape and distributions are the primary information.  
* Clickable controls use cursor:pointer. Hover, focus, active, disabled, and loading states are explicitly designed rather than browser-default accidents.  
* Motion communicates state or hierarchy. No gratuitous animation.  
* All three moods must work at desktop, tablet, and mobile widths without changing information architecture.

# **Mood switching architecture for Cursor**

The visual mood must be implemented as a theme layer, not scattered component-specific CSS. Cursor should never hard-code a mood's colors, spacing, radii, shadows, or typography directly into individual components when a token can express the decision.

Recommended structure:

src/  
  design-system/  
    themes/  
      editorial-observatory.ts  
      cinematic-archive.ts  
      modern-cultural-index.ts  
      index.ts  
    tokens/  
      semantic.ts  
      components.ts  
    ThemeProvider.tsx  
    theme-types.ts  
  components/  
    ui/  
    media/  
    reviews/  
    evaluations/  
    navigation/  
  app/

## **Theme contract**

Each theme should implement the same typed contract. Components consume semantic tokens, never theme names. For example, a Button asks for button.primary.background, not editorialBlue or archiveCobalt.

Theme {  
  colors: {  
    canvas, surface, surfaceElevated,  
    textPrimary, textSecondary, textMuted,  
    border, borderStrong,  
    accent, accentHover, accentActive,  
    focusRing,  
    positive, caution, negative  
  },  
  typography: {  
    fontBody, fontDisplay,  
    headingScale, bodySize, metadataSize  
  },  
  shape: {  
    radiusSm, radiusMd, radiusLg,  
    borderWidth  
  },  
  elevation: {  
    card, floating, modal  
  },  
  spacing: { ... },  
  motion: {  
    fast, normal, slow,  
    hoverLift, imageScale  
  },  
  media: {  
    heroTreatment, cardTreatment,  
    overlayStrength  
  }  
}

## **Cursor implementation instructions**

Give Cursor a permanent project rule that says the design system is token-driven and theme-switchable. The agent should be allowed to add components and pages, but must consume existing semantic tokens. If a new visual decision is needed, it should add a token or component variant rather than bypassing the theme system.

***DESIGN SYSTEM RULE — THEME ARCHITECTURE***

***The application supports interchangeable visual moods:***  
***1\. editorial-observatory***  
***2\. cinematic-archive***  
***3\. modern-cultural-index***

***Treat these as themes over one shared product system, NOT as separate designs.***

***RULES:***  
***\- Never hard-code theme-specific colors, typography, radii, shadows, spacing, or motion inside feature components.***  
***\- Feature components consume semantic design tokens.***  
***\- Theme files provide token values.***  
***\- All themes must implement the same typed Theme contract.***  
***\- Switching a theme must require changing one configuration value, environment setting, admin setting, or ThemeProvider value—not editing components.***  
***\- Do not branch JSX with "if theme \=== ..." unless the visual structure genuinely differs. Prefer token changes and component variants.***  
***\- Preserve identical information architecture and accessibility across themes.***  
***\- Any new component must render correctly under all three themes before it is considered complete.***  
***\- Test light/dark mode independently from mood selection. Mood and color mode are separate axes.***  
***\- Do not use positive/negative semantic colors as brand colors.***  
***\- Use cursor:pointer on interactive controls and provide hover, focus-visible, active, disabled, and loading states.***  
***\- Keep motion restrained and functional.***  
***\- When introducing a new visual property, first ask whether it belongs in the semantic token system.***

***CURRENT DEFAULT: editorial-observatory.***  
***The theme system must make it trivial to switch the default later.***

# **Mood × Light/Dark is a two-axis system**

Do not create six unrelated themes such as editorial-light, editorial-dark, archive-light, etc. Instead, define mood tokens and a separate color-mode layer. The application should conceptually resolve: Mood \= Editorial Observatory \+ Mode \= Dark. This prevents combinatorial design drift and makes future moods inexpensive to add.

## **Suggested user-facing control**

For MVP, the mood switcher should probably be a development/design control rather than a prominent public navigation feature. Keep it available through a small Design/Mood setting during development. Later, if research shows users value it, expose a subtle Appearance control. The site's public identity should still have a coherent default.

# **Prototype sequence**

1. Build one representative Game page using the shared component system.  
2. Implement Editorial Observatory completely.  
3. Switch the same page to Cinematic Archive without changing its JSX or data model.  
4. Switch the same page to Modern Cultural Index without changing its JSX or data model.  
5. Repeat the test on a Movie page, Review card, Search results page, and Review submission form.  
6. Only after all three themes work, refine individual visual details.

# **Decision to revisit**

The three directions are deliberately different enough to expose what the product wants to be. Do not finalize the accent hex value, display font, exact radii, or chart treatment until these three directions are seen side-by-side in actual screens. The first prototype should be judged by whether the same information feels meaningfully different under each mood while remaining obviously the same product.