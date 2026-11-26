# FRAME UI Design Constitution

This document is the authority for how FRAME looks. It describes the system that is implemented, not a redesign that has not been built.

Three layers have different jobs. Do not collapse them.

| Layer | Where it lives | What it decides |
| --- | --- | --- |
| Design tokens | `src/design-system/theme-types.ts`, `src/design-system/themes/`, emitted by `src/design-system/theme-css.ts` | The values: type sizes, colors, spacing, radii, shadows, motion. Mood and light/dark change tokens. They do not change which role a piece of content has. |
| Shared components and classes | `src/design-system/components.css` and the components under `src/components/` | How a recurring element looks and behaves: a button, a synopsis, a review comment, a fact row, a card. |
| This constitution | `docs/UI_DESIGN_CONSTITUTION.md` | When and why a token or class is used. Equivalent content must use the same role. |

Feature components must not hard-code colors, type sizes, radii, shadows, or spacing. They use a shared class, and that class uses tokens. A page must not override the size, color, or weight of a shared role.

The Cursor rule in `.cursor/rules/design-system.mdc` points here. Read this file before adding or restyling a page.

## 1. Visual philosophy

FRAME is one product with several moods. Core is the default: editorial, analytical, and at ease with entertainment. Other moods change token values. They do not get their own pages or components.

The work's artwork stays more important than the site chrome. Evaluation color (positive, mixed, negative) reports a judgment. It is never a brand color. Accent is for interaction only.

Similar content uses one treatment wherever it appears. Different purposes may use different treatments. A discovery card and a review page share the same tokens and the same button, and they do not have to share the same card.

## 2. Mandatory rules

1. This constitution governs UI work across the application.
2. Equivalent content uses the shared class for that role.
3. Use tokens. Do not introduce a one-off size or color because it is convenient.
4. Do not override a shared role on a single page. If the role is wrong, change the shared class, or give the content its actual role.
5. Reuse shared components. Do not copy a component to change a few styles.
6. Heading level follows the outline. Visual size follows the role in section 3, which is not always the browser default for that heading level.
7. Keep keyboard focus visible. Interactive controls use `cursor: pointer` and have hover, focus-visible, active, and disabled states where they apply.
8. Respect `prefers-reduced-motion`. The stylesheet already disables animation and transition under that preference.
9. Do not use positive, caution, or negative as decoration.
10. Do not change evaluation logic, data, routing, or workflows in order to tidy the UI.
11. An intentional exception is written in section 12. An undocumented exception is a bug.
12. If a new visual need appears, add or change the token and the shared class, then update this document in the same change.

## 3. Typography

Fonts come from the active theme. On Core, body text is Source Sans 3 and display text is DM Sans. Body line height is `--leading-body` (1.65 on Core).

Sizes, Core light, at a 16px root:

| Token | Core value | Role |
| --- | --- | --- |
| `--text-display` | 3.25rem (52px) | `.display` only. Marketing and the about statement. Not a work title. |
| `--text-h1` | 2.5rem (40px) | Page title. The work title, the record title, the evaluation title, and ordinary `h1` elements. |
| `--text-h2` | 1.85rem (29.6px) | Editorial section title. `h2` inside a normal page, such as Related works. |
| `--text-h3` | 1.35rem (21.6px) | Subheading and the wordmark size. Default `h3`. |
| `--text-body` | 1.0625rem (17px) | Body copy, including the about essay and form fields that inherit `font: inherit`. |
| `--text-meta` | 0.875rem (14px) | Metadata, labels, review comments, the work synopsis, the one-line impression, fact values, navigation, buttons, chips. |
| `--text-micro` | 0.75rem (12px) | Kickers, captions, and uppercase panel labels. |

`--text-lede` does not exist. The page introduction is the class `.lede` at `1.15rem` with `--color-text-secondary`. That size is part of the shared class, not a per-page choice. Do not set a different font size on `.lede`.

### Roles

Use the class. Do not restyle the content in the page.

| Role | Class | Size | Color | Notes |
| --- | --- | --- | --- | --- |
| Page title | `h1` | `--text-h1` | primary | Display font, weight 560. |
| Display statement | `h1.display` or `.display` | `--text-display` | primary | About and the new-review entry. Shrinks to 2.3rem below 860px. |
| Editorial section | `h2` | `--text-h2` | primary | Related works, discover shelves, compare page sections. |
| Panel label | `h2` inside `.evaluation-panel`, `.note-card`, `.evaluation-details`, `.evaluation-related` | `--text-micro` | muted | Uppercase, weight 650, letter-spacing 0.08em. This `h2` is a label, not a title. |
| Column title | `.column-head h2` | `--text-h3` | primary | Critics and Audience on the overview. |
| Page introduction | `.lede` | 1.15rem | secondary | Instructions under a page title: sign in, discover, compare, settings, errors. Not a work synopsis. |
| Work synopsis | `.synopsis` | `--text-meta` | secondary | The same synopsis on the overview and on details. Overview removes the measure cap so the column can use its own width. |
| Review impression | `.impression-line` | `--text-meta` | primary | Display font, weight 560. The one-line summation on a review card. It is not a heading. |
| Review comment, primary reading | `.evaluation-details .prose` | `--text-meta` | primary | The written review on the evaluation page, where the comment is the subject. |
| Review comment, supporting | `.review-list .prose`, `.excerpt-body` | `--text-meta` | muted | The same comment in the audience list and in the overview excerpt. |
| Review section heading inside a comment | `.review-list .prose h3` | inherits the comment size | inherits | Must not jump back up to `--text-h3`. |
| Metadata and labels | `.meta`, `.context-line`, `.provenance`, `.fact-list dt`, `.sample-note` | `--text-meta` | muted | Timestamps, platform, imported-from lines, fact labels. |
| Fact value | `.fact-card .fact-list dd`, `.record-facts dd` | `--text-meta` | primary | Released, creators, publisher, genres, platforms. Same size as the label, primary color so the value reads as the content. |
| Kicker | `.kicker` | `--text-micro` | muted | Uppercase, letter-spacing 0.12em. Work type, record back-link, account label. |
| Button label | `.btn` | `--text-meta` | depends on variant | See section 6. |
| Navigation | `.nav-links a`, `.record-tabs a` | `--text-meta` | secondary, current item primary | |
| Chip | `.chip` | `--text-meta` | secondary | |
| Compact card title | `.work-card h2`, `.work-card h3`, `.compare-column-body h2` | 1.15rem | primary | Dense catalog and compare cards. Not the page title. |
| Home strip title | `.home-review-body h3` | 1.05rem | primary | Denser than a catalog card. Intentional. |
| Reviewer name on a card | `.reviewer-link` | 1.2rem | primary | Display font. Same class on the overview excerpt and the audience card. |

Weights in use: 400 for body, 560 for display headings and the impression, 620 for stance words, 650 for panel labels and card titles that set it.

## 4. Color

Tokens are semantic. Core light is listed. Dark mode and other moods replace the values. Do not paste a hex value into a component.

| Token | Core light | Use |
| --- | --- | --- |
| `--color-text-primary` | `#17191C` | Titles, fact values, primary review comments, the impression, primary buttons' contrast. |
| `--color-text-secondary` | `#34383D` | Page introductions, the synopsis, nav links at rest, secondary buttons' border context. |
| `--color-text-muted` | `#737981` | Labels, metadata, kickers, supporting review comments, panel labels. |
| `--color-canvas` | `#F7F7F5` | Page background. |
| `--color-surface` | `#FFFFFF` | Cards, fields, secondary buttons. |
| `--color-surface-elevated` | `#FFFFFF` | Art wells and raised areas. |
| `--color-border` | `#D9DCE0` | Hairline dividers and card edges. |
| `--color-border-strong` | `#B7BCC3` | Fact rule, field borders, secondary button borders. |
| `--color-accent` | `#3157D5` | Interaction: primary button, current tab mark, focus, link hover. |
| `--color-positive` | `#1F7A4D` | A positive stance. |
| `--color-caution` | `#9A6700` | A mixed stance. |
| `--color-negative` | `#B42318` | A negative stance. |
| `--color-divided` | `#FFF200` | A reading with no majority. Same yellow in every mood. |

Stance text uses `.stance-positive`, `.stance-mixed`, and `.stance-negative`. Those classes are the only place evaluation color is applied to words. Do not color a heading or a button with them.

Links inherit their parent's text color and underline. Hover uses accent. A link inside muted comment text stays muted until hover.

Disabled controls drop to opacity 0.55 and `cursor: not-allowed`.

## 5. Spacing and layout

Spacing tokens run from `--space-1` (0.25rem) through `--space-8` (4.5rem).

| Token | Core | Use |
| --- | --- | --- |
| `--page-gutter` | `clamp(1.5rem, 3vw, 3rem)` | Page inset. |
| `--content-max` | `clamp(70rem, 88vw, 108rem)` | `.shell` width. |
| `--content-focus` | 80rem | The main column on work and evaluation pages. |
| `--measure` | 68ch | Reading measure for `.lede`, `.synopsis`, and `.prose`. |

`.page` pads with `--space-7` above and `--space-8` below. A work overview's main column then uses `--space-7` between regions. Do not also add section margin inside that column.

Cards use `--radius-md`, `--shadow-card`, and padding of `--space-4` or `--space-5`. The fact block on a work is not a card: no fill, no radius, no shadow, only a left border.

Work and evaluation pages share the rail described in `docs/work-overview-layout.md` and `docs/evaluation-page-layout.md`. Change a shared track only when both pages should move together.

Below 860px, multi-column layouts stack. The fact list on a record stacks to one column. The fact card beside a synopsis keeps its label column. Display headings shrink to 2.3rem.

## 6. Components

### Buttons

Every button or button-like link uses `.btn` plus one variant.

| Class | Treatment |
| --- | --- |
| `.btn` | Metadata size, `--radius-sm`, padding `0.7rem 0.95rem`, pointer, hover, active press, disabled and `aria-busy`. |
| `.btn-primary` | Accent fill, accent-contrast text. The page's main action. |
| `.btn-secondary` | Surface fill, strong border, primary text. Hover border becomes accent. |
| `.btn-ghost` | No border, secondary text, tighter inline padding. |
| `.btn-large` | Body size and wider padding. The home hero action only. |
| `.share-banner-action` | Still a `.btn`. Surface fill on the share banner, because that banner is already accent. |

Do not invent a new button class for a new page.

### Other controls

| Element | Class | Rule |
| --- | --- | --- |
| Text field, select, textarea | `.field` controls and `.search-form input` | Inherit body type. Evaluation builder fields step down to `--text-meta`. |
| Choice chip | `.chip` | Metadata size. Current chip uses an accent border. |
| Segmented control | `.shape-segment button` | Metadata size. The checked segment is accent. |
| Tabs on a record | `.record-tabs a` | Text link with an accent underline on the current page. Not a button. |
| Work and evaluation nav | `.evaluation-nav a`, `.work-nav-action` | Same row pattern. Current item mixes accent into the surface. |
| Dialog | `.share-card-dialog` | Uses `--shadow-modal` and the strong border. |

### Review blocks

One review is not one card everywhere, and that is deliberate.

| Surface | Component | What the reader gets |
| --- | --- | --- |
| Overview excerpt | `AudienceExcerpt` in `reception-columns.tsx` | Name, stances, a short `.excerpt-body`, a link onward. |
| Audience and critic lists | `ReviewCard` in `work-record.tsx` | Name, context, stance table, `.impression-line`, then `.prose`. |
| Evaluation page | `ReviewProse` inside `.evaluation-details` | The comment as the subject, primary color, same metadata size. |
| Critic reading | `CriticReading` | Outlet, stances, and a link to the full review. No comment body. |

The comment size is always `--text-meta`. Color changes only with the job: muted when the comment supports a list or excerpt, primary when the page is the reading.

### Cards

Catalog cards (`.work-card`), compare columns, and the home strip share surface, border, radius, and shadow. Their titles stay compact because the card is a browse object, not a page. Sample game-list pages (`/game-list-3` through `/game-list-6`) are layout studies. They may use a denser card. They still use tokens.

## 7. Navigation and interaction

The header is one component, `SiteHeader`. Brand, primary links, search, appearance, and menu do not get a second header.

Primary links are Games, Discover, and About. Mood and color mode stay in the appearance control. They are not primary navigation.

Current location uses `aria-current`, not a second color invented for that page. Tabs and nav items share the accent mark described above.

Hover, active, and focus-visible are required on buttons, chips, nav rows, and links that look like controls. Focus uses `--color-focus-ring` with a 2px outline.

## 8. Responsive behavior

Breakpoints already in the stylesheet:

| Width | What changes |
| --- | --- |
| 1100px | Work intro stacks. The fact card loses its left border and gains a top border. Some grids drop a column. |
| 860px | Page grids become a single column. Display type shrinks. Record facts stack. |
| 720px | The five-card sample grid becomes one column. |

Do not add a breakpoint for a single page if an existing one already stacks that kind of layout.

## 9. Accessibility

- Text contrast follows the token pairs. Do not put muted text on a muted surface.
- Stance is never color alone. The word Positive, Mixed, or Negative is present.
- Icon-only controls have an accessible name.
- The skip link is present in the root layout.
- Motion is removed under `prefers-reduced-motion`.
- A control that is busy sets `aria-busy` and uses the disabled button treatment.

## 10. Adding a component or a treatment

1. Name the role. If an existing row in section 3 matches, use that class.
2. If it is a new role, add one class in `components.css` that uses tokens.
3. If no token fits, add the token to the `Theme` contract and set it in every theme. Then use the variable.
4. Update this document in the same change, including any exception.
5. Check the same role on the other pages that show it.
6. Do not branch the markup on `theme === ...` unless the structure cannot be expressed with tokens.

## 11. Changing an existing page

1. Find the shared class the content already uses.
2. If the page looks different from its counterpart, the page is wrong, or the shared class is wrong. Fix the shared class, or move the content onto the correct role.
3. Do not add a selector like `.some-page .lede` to change type size.
4. Inline `style` for margin or color is not allowed on new work. Existing inline margins are listed in section 12.
5. After a visual change, compare the equivalent block on at least one other route that shows it.

## 12. Intentional exceptions

These are allowed to differ. They are not unfinished cleanup.

| Exception | Why |
| --- | --- |
| Supporting comments are muted. The evaluation-page comment is primary. | Same size, different job. The evaluation page is the reading. The list and the excerpt point at it. |
| Panel `h2` labels are micro uppercase. Editorial `h2` titles use `--text-h2`. | One is a label inside a chart panel. The other is a section of the page. |
| Compact card titles (1.15rem) and the home strip title (1.05rem) are below `--text-h3`. | Browse objects, not page titles. The home strip is denser than a catalog card. |
| `.lede` is 1.15rem and is not a theme token. | It is the page-introduction class. Pages must not override it. A mood that needs its own introduction size must add `--text-lede` to every theme first. |
| `.reviewer-link` is 1.2rem. | One shared size for the name on every review card and excerpt. It sits between body and `h3` so the name leads the card without becoming a section heading. |
| Radar tick labels are 11px. Radar axis labels are 13px. Population-stage axis labels use `--text-meta`. | Tick and axis labels are drawn inside a fixed SVG. They are not page text. |
| Share-card and Open Graph images set their own pixel sizes. | They are exported images, not the page. |
| Sample game lists may use denser cards than the catalog. | They are layout studies. They still consume tokens. |
| `.btn-large` exists only for the home hero. | One larger action on the entry page. Other primary actions stay `.btn-primary`. |

### Known leftovers

These are inconsistencies still in the code. Do not copy them.

| Leftover | Where | What to do next |
| --- | --- | --- |
| Inline margins on `.lede` and a few forms | Discover, compare, reviewer pages, search, admin outlets, error, not-found | Move the spacing onto the page or section class. Do not keep adding inline margins. |
| Account email on the dashboard uses `.lede` | `src/app/dashboard/page.tsx` | That string is metadata, not a page introduction. A later change should use `.meta`. |
| Wordmark (`.brand-name`) is `1.35rem` rather than `var(--text-h3)` | Header | It matches Core `h3` today and would drift if a mood changes `h3` without a decision. |
| About prose sets `marginTop` inline | `src/app/about/page.tsx` | The essay is body type inside `.prose`. The offset should be a class. |

## 13. Audit record

Measured on Core, light mode, before the corrections in this change. Sizes are computed pixels.

| Element | Overview | Details | Audience list | Evaluation page | Standard now |
| --- | --- | --- | --- | --- | --- |
| Work synopsis | 14px, secondary, via a page override on `.lede` | 18.4px, secondary, bare `.lede` | — | — | `.synopsis`, `--text-meta`, secondary, both pages |
| One-line impression | not shown | — | 21.6px, display, `h3` size | not shown | `.impression-line`, `--text-meta`, display, primary |
| Review comment | 14px, muted, excerpt | — | 14px, muted | 14px, primary | same size; color follows the job in section 3 |
| Fact value | 14px, primary | 17px, primary | — | — | `--text-meta`, primary, both fact lists |
| Page title | 40px `h1` | 40px `h1` | 40px `h1` | 40px `h1` | unchanged, `--text-h1` |
| Fact label | 14px, muted | 14px, muted | — | — | unchanged, `--text-meta` |

Page introductions (sign in, discover, compare, settings) stay `.lede` at 1.15rem. They are not the synopsis, so they were not resized.
