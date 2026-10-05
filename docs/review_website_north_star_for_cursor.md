# North Star — Review Website

**Purpose:** Foundational product, business, UX, visual identity, and Cursor implementation brief.  
**Launch focus:** Video games.  
**Future expansion:** Movies and other cultural works.  
**Default visual identity:** Core — Editorial + Analytical + Entertainment.  
**Theme architecture:** Swappable; four alternative visual identities are retained.

---

## 1. North Star

We are building a review and evaluation website that helps people understand **how a work was evaluated**, rather than collapsing every opinion into a single score.

The initial subject is video games.

The central problem is that conventional review systems mix together enjoyment, execution, intent, production circumstances, personal taste, playtime, and standards into one recommendation or score.

A reviewer may say:

> “This game has bugs, janky mechanics, and a terrible tutorial, but I could see the passion and I cried at the end.”

Another may say:

> “The music and story are fantastic, but the gameplay is so poorly executed that I don't want to play it again.”

Both can be legitimate personal experiences. The problem is that conventional systems often reduce both to:

> Recommended.

### Core principle

> **A review should tell the reader not only what the reviewer thinks, but what kind of judgment produced that conclusion.**

The product must expose the dimensions, assumptions, context, and experience behind reviews.

---

## 2. What We Are NOT Building

Do not turn this into:

- another generic star-rating site
- a Metacritic clone
- a Steam review clone
- a social network whose primary purpose is follower accumulation
- a generic gaming news publication
- a database with thousands of thin pages
- an SEO article factory
- a dashboard that overwhelms users with metrics
- a site that tells users which games are objectively “good”
- a site that silently rewards positive sentiment
- a site that treats indie status as either an automatic excuse or an automatic penalty

The product is an **evaluation system and discovery destination**.

---

## 3. The Central Distinction

The structured evaluation system should separate at least:

### Enjoyment
Did I personally enjoy experiencing this work?

### Execution
How successfully does the work actually execute what it is trying to do?

### Intent / artistic experience
What was the creator trying to accomplish, and how did that intention affect my experience?

### Standards
Did I evaluate the work against an essentially absolute standard, or did I consciously adjust my expectations based on circumstances?

Circumstances can include indie development, solo development, early access, experimental structure, unusual genre conventions, or unusually ambitious scope.

The system must not assume contextual grading is good or bad. It should make the choice visible.

---

## 4. The Most Important UX Idea

A reviewer must be able to say:

> **I loved this game, but I don't think it is well executed.**

or:

> **I think this game is well executed, but I didn't personally enjoy it.**

or:

> **I think the execution is excellent relative to its circumstances.**

These are different judgments.

The product should make these distinctions easy to express and easy for readers to filter.

---

## 5. Review Submission Philosophy

Do not begin with a giant questionnaire.

The structured layer should be concise.

Core questions:

### What were you primarily evaluating?
- Gameplay / execution
- Story / artistic experience
- Technical quality
- Overall experience
- Combination

### Did the game's circumstances affect your standards?
- No — essentially the same standards I use for other works
- Somewhat
- Yes — I consciously adjusted expectations

### Did you enjoy it?
- Yes
- Mixed
- No

### Did you think it was well executed?
- Yes
- Mixed
- No

### How much did you experience?
- Just started
- Early portion
- Substantial portion
- Completed
- Endgame / post-game

Then:

> **Tell us why. What worked? What didn't?**

The written review remains important. Structured data makes the written review interpretable.

---

## 6. Reviewer Context

Capture useful context without turning reviewing into behavioral science.

Useful:
- platform
- purchase / ownership context when appropriate
- approximate playtime
- completion status
- review date
- whether the reviewer experienced the full work
- evaluation lens
- evaluation standard

Do NOT require mood tracking, exact time-of-day tracking, caffeine, emotional-state diaries, or unnecessary psychological profiling.

The goal is **interpretability, not surveillance**.

---

## 7. Fundamental Page Object

The primary object is:

> **Work → Evaluations**

Not:

> Game → Score

A “work” can initially be a video game and later a movie, television series, book, album, or other cultural object.

Use concepts such as:

- Work
- Creator
- Review
- Evaluation
- Reviewer
- Platform
- Genre
- Release
- Media
- Reception

Avoid architecture that assumes every work is a game.

---

## 8. Work Pages

The work itself is the visual subject.

Typical game page:

1. Key art / primary media
2. Title
3. Creator / developer / publisher
4. Release information
5. Platforms
6. Genres
7. Evaluation snapshot
8. Review Landscape
9. What reviewers agree on
10. Where reviewers disagree
11. Written reviews
12. Related works

Do not make a giant numerical score the visual hero.

---

## 9. Review Landscape

The site's signature output should be the **Review Landscape**.

Instead of only:

> 84/100

show dimensions such as:

- Enjoyment
- Execution
- Technical quality
- Story / narrative
- Music
- Art / atmosphere
- Value, where appropriate

Preserve distributions rather than only averages.

Example:

> Enjoyment — 78% positive  
> Execution — 51% positive  
> Technical quality — 42% positive  
> Story — 84% positive  
> Music — 91% positive

The exact dimensions can evolve.

The principle does not:

> **Show the shape of the reception, not merely its average.**

---

## 10. Evaluation Approaches

Aggregate declared review approaches:

- Execution-focused
- Experience-focused
- Mixed

And:

- Absolute standards
- Contextual standards
- Mixed

Users should be able to filter by these lenses.

The system should not tell the user which lens is correct.

---

## 11. Contradiction Is Valuable Data

Expose meaningful divergence.

Examples:

> **Many players enjoyed the story and music while expressing substantially more negative opinions about gameplay execution.**

> **Reviewers who rated the game highly were divided on whether its technical problems were acceptable given its scope.**

These are summaries of evidence, not editorial verdicts.

---

## 12. Contribution Is a Product Feature

The cold-start problem is fundamental.

Do not assume:

> Build website → people magically arrive → people review.

Seed a useful corpus.

Start with a focused set of games rather than thousands of empty pages.

Prioritize works with:

- existing review volume
- meaningful disagreement
- recognizable titles
- indie and AA representation
- current/recent releases
- interesting gaps between enjoyment and execution
- enough evidence to demonstrate why the product exists

The initial objective is:

> **Create enough excellent examples that a visitor immediately understands the value of the system.**

---

## 13. Reviewer Import Loop

A key contribution mechanism should eventually be:

> **Import an existing review**

A person who already wrote a review elsewhere should not have to rewrite it.

They can paste their existing review and answer the structured questions.

Desired loop:

> Existing review → Structured evaluation → Public reviewer page → Shareable result → New visitor → New evaluation

Contribution should feel like **making an existing opinion more useful**, not doing unpaid work for a new social network.

---

## 14. Acquisition Strategy

SEO is a long-term compounding layer, not the initial cold-start strategy.

The product should eventually have four acquisition engines:

### 1. Search
Questions such as:
- Is this game actually good?
- Is this game worth it?
- Why are people criticizing this game?
- Why do people like this game?
- What are the problems with this game?

Search lands users on a useful work page.

### 2. Sharing
Reviewers share:
> “Here's how I evaluated this game.”

### 3. Community
Users return to compare opinions, find reviewers with similar standards, investigate disagreement, discover works, and contribute.

### 4. Editorial discovery
Accumulated data produces original stories such as:
- Games Players Love Despite Major Execution Problems
- Where Players Agree About X—and Where They Don't
- The Biggest Enjoyment/Execution Gaps
- When Context Changes the Review

Editorial content should point back into the underlying evidence.

---

## 15. Developer / Creator Utility

Eventually the site can provide creator feedback:

> What players are saying about your game

For example:
- Story — overwhelmingly positive
- Music — overwhelmingly positive
- Gameplay — mixed
- Tutorial — recurring criticism
- Technical stability — recurring criticism

This is not the initial product promise, but the architecture should leave room for it.

---

## 16. Business / Monetization North Star

Advertising may eventually be meaningful revenue.

Do not build pages primarily to display ads.

The site must provide substantial original value through:

- structured evaluation
- original aggregation
- useful summaries
- review context
- discovery
- comparisons
- community contribution
- editorial interpretation

Avoid thin database pages and automatically generated pages with little evidence.

A page should become more valuable as genuine contributions accumulate.

Possible long-term revenue:
- advertising
- optional premium features
- creator/developer tools
- partnerships
- other revenue streams

Do not allow monetization to distort the evaluation system.

---

## 17. Originality / Content Principle

The site's original intellectual property is not merely the prose users submit.

It is the **system that captures, contextualizes, organizes, and aggregates judgments**.

The product should create information conventional review platforms do not expose:

- enjoyment vs. execution
- absolute vs. contextual standards
- completion vs. early impressions
- recurring criticisms
- recurring praise
- agreement vs. disagreement
- distribution rather than one average

---

# 18. Visual North Star

The baseline visual identity is:

> **Editorial + Analytical + Entertainment**

Reference feeling:

> **The Atlantic × Letterboxd × a very good data-visualization system.**

The interface should feel like:

> **An instrument for seeing a work clearly—not a machine for telling you what to think about it.**

The work is the visual hero.

The UI is the frame.

---

## 19. Baseline Visual Identity — Core

### Mood
- editorial
- analytical
- contemporary
- confident
- human
- media-centric
- serious without being sterile
- entertainment-aware without looking like a gaming storefront

### Avoid
- generic SaaS aesthetic
- excessive neon
- gamer clichés
- RGB styling
- esports visual language
- excessive gradients
- glassmorphism everywhere
- giant score worship
- excessive pills
- visual noise
- making every metric equally prominent

---

## 20. Baseline Color Direction

Use a light-first baseline.

Starting tokens:

```text
Canvas:          #F7F7F5
Surface:         #FFFFFF
Text Primary:    #17191C
Text Secondary:  #34383D
Text Muted:      #737981
Border:          #D9DCE0
Primary Accent:  #3157D5
```

These are starting values, not immutable brand decisions.

Semantic colors should be restrained:

```text
Positive: green
Caution:  amber
Negative: red
```

Important:

> **The brand accent is not a positive/negative judgment color.**

Blue/indigo means interaction/navigation/brand.

Green/amber/red mean evaluation state.

Never rely on color alone; pair semantic color with text, iconography, position, or another accessible indicator.

---

## 21. Baseline Typography

Use a modern, highly readable sans-serif for body/UI.

Candidates:
- Source Sans 3
- Manrope
- Inter

Potential display candidates:
- DM Sans
- Space Grotesk

Do not lock the exact font until visual prototypes are compared.

Suggested scale:

```text
Display:       48–56px
H1:            ~40px
H2:            28–32px
H3:            21–24px
Body:          16–18px
Metadata:      13–14px
Micro-label:   11–12px
```

Body line height should generally be approximately 1.55–1.7.

Reviews must be comfortable to read.

---

## 22. Baseline Shape Language

Avoid “everything is a pill.”

Use:
- 4–6px corners for standard controls/cards
- moderate 6–8px corners where media needs softer treatment
- thin borders
- restrained shadows
- clear grid alignment
- generous whitespace

The site should feel constructed, not inflated.

---

## 23. Buttons

### Primary CTA
Solid accent.

Examples:
- Write a Review
- Evaluate This Work
- Explore Reviews

### Secondary
Outlined or surface-based.

Examples:
- See All Evaluations
- Compare Reviews

### Navigation
Mostly text-based.

### Destructive
Reserved for:
- Delete
- Remove
- Report

Every interactive control should have:
- default
- hover
- focus-visible
- active/pressed
- disabled
- loading where applicable

Interactive controls should use:

```css
cursor: pointer;
```

Do not use pointer cursors on decorative elements.

---

## 24. Hover / Motion

Motion must communicate state or information.

Good:
- slight card lift
- subtle image scale
- border/accent transition
- button press
- expanding information
- tab state transition
- revealing metadata

Avoid:
- gratuitous animations
- constant floating
- particle effects
- unnecessary parallax
- glowing borders everywhere
- animation that delays interaction

The site should feel responsive, not theatrical.

---

## 25. Work Presentation

Games and movies are **objects**, not rows in a database.

A typical hero uses:
- key art / poster
- title
- creator
- release information
- platform / format
- genre
- evaluation snapshot

Prefer an editorial two-column hero on desktop.

Concept:

```text
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   [ LARGE KEY ART ]                 WORK TITLE              │
│                                      2026                   │
│                                      Developer / Creator    │
│                                      Genre                  │
│                                      Platforms              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Principle:

> **The work is the subject. The interface is the frame.**

---

## 26. Review Presentation

A review should not look like a social-media comment.

Example:

```text
Reviewer Name

Execution-focused · Absolute standard
Completed · 18.4 hours

Gameplay       Mixed
Story          Positive
Music          Excellent
Technical      Mixed

[Review prose]
```

Structured context makes prose interpretable.

Do not make follower counts, likes, or social status the primary visual hierarchy.

---

## 27. Cards

Cards should be image-led but not image-only.

```text
┌──────────────────┐
│                  │
│      ART         │
│                  │
├──────────────────┤
│ UNBEATABLE       │
│ 2026 · PC        │
│                  │
│ Execution  Mixed │
│ Enjoyment  High  │
└──────────────────┘
```

Expose enough structured information for discovery.

Do not turn every metric into a badge.

---

## 28. Light and Dark Mode

Support both.

Mood and light/dark mode are separate axes.

Do not create six unrelated designs.

Conceptually:

```text
Mood = Core
Mode = Light
```

or:

```text
Mood = Core
Mode = Dark
```

and later:

```text
Mood = Cinematic Archive
Mode = Dark
```

---

## 29. Swappable Visual Identity Architecture

Alternative moods:

1. **Editorial Observatory**
2. **Cinematic Archive**
3. **Modern Cultural Index**
4. **Slightly Game-Native**

Baseline:

5. **Core — Editorial + Analytical + Entertainment**

The alternatives are alternate visual systems over the same application.

---

## 30. Theme Contract

Implement a typed theme contract conceptually like:

```ts
type Theme = {
  colors: {
    canvas: string
    surface: string
    surfaceElevated: string
    textPrimary: string
    textSecondary: string
    textMuted: string
    border: string
    borderStrong: string
    accent: string
    accentHover: string
    accentActive: string
    focusRing: string
    positive: string
    caution: string
    negative: string
  }

  typography: {
    fontBody: string
    fontDisplay: string
    headingScale: Record<string, string>
    bodySize: string
    metadataSize: string
  }

  shape: {
    radiusSm: string
    radiusMd: string
    radiusLg: string
    borderWidth: string
  }

  elevation: {
    card: string
    floating: string
    modal: string
  }

  spacing: Record<string, string>

  motion: {
    fast: string
    normal: string
    slow: string
    hoverLift: string
    imageScale: string
  }

  media: {
    heroTreatment: string
    cardTreatment: string
    overlayStrength: string
  }
}
```

Components consume semantic tokens.

Components must not contain theme-specific hard-coded values.

---

## 31. Cursor Rules — Non-Negotiable

Put a permanent design-system rule in the project:

```text
DESIGN SYSTEM / NORTH STAR RULE

The application has one shared product architecture and multiple interchangeable visual moods.

Current default:
Core — Editorial + Analytical + Entertainment

Alternative moods:
- Editorial Observatory
- Cinematic Archive
- Modern Cultural Index
- Slightly Game-Native

These are themes, not separate applications.

RULES:
1. Never hard-code theme-specific colors, typography, radii, shadows, spacing, or motion inside feature components.
2. Feature components consume semantic design tokens.
3. Theme files provide token values.
4. Every theme implements the same typed Theme contract.
5. Switching the active theme must require changing theme state/configuration, not editing feature components.
6. Do not duplicate pages or components for individual moods.
7. Preserve the same information architecture across moods.
8. Every new component must work under all themes.
9. Light/dark mode is independent of mood.
10. Never use positive/negative semantic colors as brand colors.
11. Interactive controls require pointer cursor plus hover, focus-visible, active, disabled, and loading states where applicable.
12. Motion must be restrained and functional.
13. If a new visual property is needed, first determine whether it belongs in the token system.
14. Do not introduce a one-off visual value merely because it is convenient.
15. Accessibility is required across every theme.
16. A theme experiment must never change product semantics or evaluation logic.
17. The visual system must never cause the work's artwork to become less important than site chrome.
```

---

## 32. Recommended Project Organization

Conceptually:

```text
src/
  design-system/
    themes/
      core.ts
      editorial-observatory.ts
      cinematic-archive.ts
      modern-cultural-index.ts
      game-native.ts
      index.ts
    tokens/
      semantic.ts
      components.ts
    ThemeProvider.tsx
    theme-types.ts

  components/
    ui/
    navigation/
    media/
    works/
    reviews/
    evaluations/
    discovery/

  app/
```

Exact framework structure may differ.

The architectural principle does not.

---

## 33. Theme Switching

During development, theme switching must be extremely easy.

For example:

```ts
const activeTheme = "core"
```

or an environment/configuration value.

Eventually it can become an admin/design setting.

Do not make theme switching a prominent public feature by default.

---

## 34. Theme Prototyping Sequence

Build one representative page first:

> **Game detail / Review Landscape page**

Implement Core completely.

Then switch the exact same page to:
1. Editorial Observatory
2. Cinematic Archive
3. Modern Cultural Index
4. Slightly Game-Native

No JSX rewrite.

No data-model rewrite.

No duplicated page.

Then test:
- movie detail
- search
- review card
- review submission
- discovery
- reviewer profile

Only afterward refine the visual system.

---

## 35. Product Voice

The site should speak confidently without pretending to possess objective truth.

Prefer:

> “Reviewers disagree about the game's execution.”

Not:

> “The game has bad execution.”

Prefer:

> “Many players describe the tutorial as frustrating.”

Not:

> “The tutorial is objectively terrible.”

Prefer:

> “Players who enjoyed the game were often willing to overlook its technical problems.”

Not:

> “Fans make excuses for bad games.”

The product exposes evidence and patterns. It does not appoint itself judge.

---

## 36. Editorial Philosophy

Investigate patterns in the evidence.

Ask:
- Why do people disagree?
- Where does enjoyment diverge from execution?
- What criticisms recur?
- What praise recurs?
- Does contextual evaluation change reception?
- Do early reviews differ from completed-play reviews?
- Where do critics and players differ?
- Where do reviewers agree despite different standards?

Do not manufacture controversy merely to generate clicks.

---

## 37. Search / SEO Philosophy

SEO should be an output of accumulated usefulness.

Do not generate thousands of thin pages.

Potential search intents:
- `[Game] reviews`
- `[Game] gameplay reviews`
- `[Game] problems`
- `[Game] worth it`
- `[Game] player reviews`
- `[Game] review disparity`
- `[Game] execution`
- `[Game] tutorial`
- `[Game] technical issues`

Do not create pages simply because a keyword exists.

The page must answer the question with real evidence.

---

## 38. Advertising Guardrails

Advertising must never overwhelm evaluation.

Do not:
- place ads inside every review paragraph
- make ads resemble review controls
- create pages whose main purpose is advertising
- create empty pages to generate ad impressions
- use misleading ad placement
- allow ad layout to dictate information architecture

The site should be valuable without ads.

Advertising is a monetization layer on top of the product.

---

## 39. MVP Business Objective

The MVP succeeds if it proves:

### 1. People understand the distinction
A visitor quickly understands:

> “This separates enjoyment from execution and makes reviewer standards visible.”

### 2. People contribute
A reviewer can add an evaluation without significant friction.

### 3. Aggregation gets better with contribution
A second evaluation makes the page better.

A tenth makes it substantially better.

A hundredth unlocks patterns individual reviews cannot reveal.

That is the core network effect.

---

## 40. Growth Flywheel

```text
Useful work page
      ↓
Visitor has a question
      ↓
Reads evaluations
      ↓
Sees disagreement / missing perspective
      ↓
Contributes their own evaluation
      ↓
Structured evidence increases
      ↓
Review Landscape becomes more useful
      ↓
Page becomes more discoverable/shareable
      ↓
More visitors
      ↓
More evaluations
```

The product must reinforce this loop.

---

## 41. What We Should Measure

Do not optimize only for page views.

Important early metrics:
- work pages with at least one evaluation
- work pages with 5+ evaluations
- evaluation completion rate
- review submission completion rate
- imported-review completion rate
- visitor → evaluator conversion
- returning evaluator rate
- percentage of evaluations with written context
- search → useful-page engagement
- shared evaluation visits
- distribution of evaluation lenses
- time from first contribution to meaningful aggregate
- percentage of pages with genuine review disagreement

These tell us whether the evaluation system itself is working.

---

## 42. Product Quality Test

Whenever adding a feature, ask:

> **Does this help the user understand the work or the evidence surrounding it?**

If yes, continue.

If it mainly:
- increases gamification
- increases vanity metrics
- increases noise
- increases engagement without increasing understanding
- encourages popularity contests
- encourages score manipulation

be skeptical.

---

## 43. Long-Term Product Vision

The initial product is a video game review/evaluation system.

The deeper product is:

> **A structured way to understand how people evaluate cultural works.**

Eventually:
- games
- movies
- television
- books
- albums
- potentially other cultural works

Underlying architecture:

```text
WORK
  ↓
REVIEWS
  ↓
STRUCTURED EVALUATIONS
  ↓
CONTEXT / STANDARDS
  ↓
AGGREGATED EVIDENCE
  ↓
REVIEW LANDSCAPE
  ↓
DISCOVERY / INSIGHT
```

The site's value comes from preserving the middle of that chain.

---

## 44. Final North Star

The product should answer a question conventional review aggregators rarely answer:

> **“What does this rating actually mean?”**

Not by replacing one score with another.

By showing the evidence behind the judgment.

The website should make it possible to discover:

> “People really love this game.”

and simultaneously:

> “A lot of those people don't actually think the gameplay is well executed.”

Or:

> “Critics dislike this movie, but the disagreement is concentrated around one particular dimension.”

Or:

> “Most reviewers agree about the story, but their standards for execution differ.”

That is the product.

**Do not lose this distinction while implementing features.**

The visual system, database, review flow, aggregation, SEO strategy, community mechanics, and monetization should all serve it.

---

# Appendix A — Visual Mood Roadmap

## Core — Editorial + Analytical + Entertainment
**Default.**

A serious editorial environment for entertainment criticism.

## Editorial Observatory
Pushes toward:
- cultural publication
- typography
- whitespace
- editorial reading
- restrained presentation

## Cinematic Archive
Pushes toward:
- immersive media
- darker presentation
- dramatic artwork
- trailer/media discovery

## Modern Cultural Index
Pushes toward:
- data
- discovery
- comparisons
- structured aggregation
- denser information architecture

## Slightly Game-Native
Pushes toward:
- game culture
- tactile interaction
- stronger game-media presentation
- slightly more energetic visual language

These are experiments around the same product identity.

None may alter the underlying evaluation philosophy.

---

# Appendix B — One-Sentence Test

If a proposed feature cannot survive this sentence, reconsider it:

> **“Does this help someone understand what people think about this work, why they think it, and what standards produced those judgments?”**

If not, it probably belongs outside the North Star.
