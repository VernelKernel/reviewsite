# Evaluation page layout

Reference page: `http://localhost:3000/games/ace-combat-8-wings-of-theve/reviews/midknightranger`

The same layout is `EvaluationRecord` for every published evaluation (`/games/{slug}/reviews/{reviewer}`, and the movie equivalent). The work overview in `docs/work-overview-layout.md` is built to match this page. When a width or alignment is in question, copy this page rather than stretching the overview to the shell.

Source:

- `src/components/evaluations/evaluation-record.tsx`
- `src/components/evaluations/evaluation-nav.tsx`
- `src/components/evaluations/evaluation-graph.tsx`
- `src/design-system/components.css` (`.evaluation-page`, `.evaluation-hero`, `.evaluation-board`, `.evaluation-overview`)

## Width system

The page is `.page.shell.evaluation-page`.

`.shell` is `min(var(--content-max), 100% - 2 × page gutter)`. On Core, `--content-max` is `clamp(70rem, 88vw, 108rem)` and the gutter is `clamp(1.5rem, 3vw, 3rem)`.

`.evaluation-page` sets the tracks shared with `.work-page`:

```text
[ rail: 11rem + space-7 ] [ main: minmax(0, --content-focus) ] [ leftover: minmax(0, 1fr) ]
```

`space-7` is `3rem`, so the rail track is `14rem`. `--content-focus` is `80rem` on Core. Direct children span from `rail-start` through `main-end`. The leftover `1fr` is empty space on the right once the shell is wider than about `94rem`. Leave it empty.

The share banner is the exception. `.evaluation-page > .share-banner` starts at `main-start`, so it lines up with the reading column and does not include the rail.

At a 1440px viewport on Core, measured on this layout: the content span is about `1267px`, the poster is `120 × 159`, the main column starts near `x = 303` and is about `1043px`, the chart stage is about `662px`, the side panels are about `365px`, and details, strengths, and related reviews are about `793px` (`min(76%, 58rem)`). The share banner is the `1043px` main column.

## Regions, top to bottom

### Hero

`.evaluation-hero` is three columns, `align-items: end`:

```text
[ poster 7.5rem ] [ title, headline, byline ] [ impression card, 14rem to 20rem ]
```

Gap is `space-5`.

- Poster: `.evaluation-poster` is `7.5rem` wide. Height follows `--hero-ratio` (`3 / 4` on Core). It is smaller than the work-overview poster. The overview is the work; this page is one reading of it.
- Copy: kicker is "{type} review". The `h1` is the work title and links to the overview. The lede is the enjoyment/execution headline, not a score. The byline is the reviewer, then platform and playtime when known.
- Impression card: the reviewer's impression sentence, then genre chips linking to Discover. The card is omitted when both are absent. It sits on the baseline of the title block (`align-items: end`), not stretched to a tall poster.

### Board

`.evaluation-board` is `11rem` and `minmax(0, 1fr)` with column gap `space-7`. That matches the work overview's rail and main.

The nav is sticky at `top: 5.5rem`:

| Item | Target |
| --- | --- |
| Overview | `#overview` |
| Graph | `#graph` on the chart stage |
| Details | `#details` |
| Related reviews | `#related` |

Current item comes from the hash. Empty hash means Overview.

### Overview block

`.evaluation-overview` is `minmax(0, 1.45fr)` and `minmax(15rem, 0.8fr)`, `align-items: start`. The work overview's `.dimension-shape` uses this same ratio.

- Column 1: the evaluation graph (`#graph`), then the "At a glance" card (platform, playtime, completion, lens, access). Glance is omitted when nothing qualifies.
- Column 2: `.evaluation-side` spans both rows. "Key impressions" is enjoyment and execution meters. "Dimension breakdown" lists each judged dimension and its stance. The side column is as tall as those panels. It does not stretch into an empty card beside the graph.

### Narrow text

These three share `max-width: min(76%, 58rem)`:

- Strengths and weaknesses (`.evaluation-cards`). Either card is omitted when that polarity is empty.
- Details (`#details`): standard note, review title, body paragraphs, import provenance, review date. The prose inside details is `max-width: none` so it uses the `58rem` cap rather than a second, narrower measure.
- Related reviews (`#related`): other published evaluations of this work, reviewer name and headline.

Do not let these run the full main column. The graph is the wide object. The writing is the narrow one.

### Share banner

`EvaluationShare` renders after the board, as a direct child of `.evaluation-page`, aligned to the main column only.

## Breakpoints

`1100px`:

- Hero becomes poster plus copy. The impression card spans both columns underneath.
- Overview becomes one column. Graph, glance, and side panels stack in source order.
- Strengths, details, and related reviews drop the `58rem` cap.

`860px`:

- Page grid collapses to one column, and the share banner does too.
- Hero and board stack.
- Nav becomes a horizontal scroller, `position: static`, links `flex: 0 0 auto`.
- Poster is `min(8.5rem, 42%)`.

## Do not

- Do not make the hero, the writing, and the share banner one shared width.
- Do not stretch the side panels to the graph.
- Do not move the share banner into the rail column.
- Do not duplicate this page per theme. Poster shape comes from `--hero-ratio`. Focus width comes from `--content-focus`.
