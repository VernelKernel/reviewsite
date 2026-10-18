# Work overview layout

Reference page: `http://localhost:3000/games/ace-combat-8-wings-of-theve`

The same layout is `WorkPage` for every published game and movie (`/games/{slug}`, `/movies/{slug}`). Do not invent a second overview, and do not stretch every block to the shell.

Source:

- `src/components/works/work-page.tsx`
- `src/components/works/work-nav.tsx`
- `src/components/works/work-reading.tsx`
- `src/components/evaluations/review-landscape.tsx`
- `src/components/evaluations/dimension-shape.tsx`
- `src/components/works/reception-columns.tsx`
- `src/design-system/components.css` (`.work-page`, `.work-frame`, `.dimension-shape`, `.reading-measure`)

The paired evaluation page is `docs/evaluation-page-layout.md`. These two pages share one width system. Change a shared track only when both pages should move together.

## Width system

The page is `.page.shell.work-page`.

`.shell` is `min(var(--content-max), 100% - 2 × page gutter)`. On Core that is `clamp(70rem, 88vw, 108rem)` inside `clamp(1.5rem, 3vw, 3rem)` gutters.

`.work-page` then uses the same tracks as `.evaluation-page`:

```text
[ rail: 11rem + space-7 ] [ main: minmax(0, --content-focus) ] [ leftover: minmax(0, 1fr) ]
```

`space-7` is `3rem`, so the rail track is `14rem`. `--content-focus` is `80rem` on Core. Direct children span rail through main. The leftover track stays empty once the shell is wider than about `94rem`. That is the right-hand margin. Do not remove it to make the overview full-bleed.

Inside that span, `.work-frame` is:

```text
[ 11rem rail ] [ gap: space-7 ] [ main ]
```

The `11rem` plus the `3rem` gap lines the main column up with `main-start` on the page grid.

At a 1440px viewport on Core, measured on this layout: the shell is about `1267px`, the poster column is `176px`, and the main column starts near `x = 303` and is about `1043px`. The leftover track is `0` at that width. The narrower blocks below are what keep the page from feeling edge to edge.

## Regions, top to bottom

```text
[ poster 11rem ]   [ title and synopsis, up to 38rem ] [ facts, left border, through the main column's right edge ]
[ sticky nav    ]  [ filters, charts, panels, reviews across the main column ]
```

The rail is as tall as the main column, so the nav can stick. The poster scrolls away. The nav sticks at `top: 5.5rem` until the rail ends.

### Poster

`.work-poster` fills the `11rem` rail. Artwork uses `--hero-ratio` (`3 / 4` on Core), so the cover is about `11rem` by `14.67rem`. Wide moods stay in this column and become shorter. Do not put the cover back on `--hero-columns`; that token is a large cinematic split and makes the art dominate the page.

### Intro

`.work-intro` is a wrapping flex row, `justify-content: flex-start`. The synopsis and the facts sit next to each other. The facts grow into the space beside the synopsis so their right edge lines up with the main column, which is also the right edge of the platform filter.

- Copy: `flex: 1 1 28rem`, `max-width: 38rem`. Kicker is the work type (`Game`). The title is an `h1` at `--text-h1`, not `--text-display`. The synopsis is `.lede` and uses that same column. One primary button, `Evaluate this work`, sits under the synopsis and does not stretch.
- Facts: `flex: 1 1 22rem`, no max width. No fill, radius, or shadow. The only container edge is a left border (`--color-border-strong`) with padding on that side. Rows are Released, Creators, Genres, On Steam, Platforms. Omit a row when the work has no value, and omit the block when none exist. Labels are a `5.5rem` column. Steam links are metadata size under the reception line.

The facts block is only as tall as its rows. It must not stretch to match the poster, and the poster must not stretch to match the facts.

### Navigation

`WorkNav`, class `.evaluation-nav`, under the poster:

| Item | Behavior |
| --- | --- |
| Overview | `#overview`. Current unless the hash is `#reviews`. |
| Details | Leaves the page for `/{games\|movies}/{slug}/details`. |
| Related reviews | `#reviews`. Current when that hash is set. |
| Compare | Button, `.work-nav-action`. Adds or removes this work. Pressed state matches the current nav item. |

`#overview` and `#reviews` use `scroll-margin-top: 5.5rem` so the sticky header does not cover them.

### Reading column

`.work-main` is a grid with `gap: space-7` (`3rem`). Section margins inside it are zeroed so that gap is the rhythm.

Order:

1. People you follow, only when the viewer follows someone who evaluated this work. Class `.reading-measure`.
2. Landscape, `#overview`.
3. Share banner. Full main column.
4. Where you sit among players, and among critic outlets, only when the viewer has an audience evaluation in the current filter. Class `.reading-measure`.
5. Review columns, `#reviews`.
6. Related works, when any exist. Class `.reading-measure`.

`.reading-measure` is `max-width: min(76%, 58rem)`. That is the same cap as details and related reviews on the evaluation page. Use it for short lists and personal placement. Do not put it on the chart block, the share banner, or the two-column review list.

### Landscape

No large "What these evaluations say" heading. The heading is screen-reader only. The visible chrome is:

- Toolbar: Both / Audience / Critics, then the filter selects (approach, standard, experience, platform). Filters sit at the end of the row and wrap.
- One muted sample line, `max-width: 46rem`. Filtered views replace it with the filtered count.
- `.dimension-shape`: `minmax(0, 1.45fr)` and `minmax(15rem, 0.8fr)`, the same ratio as `.evaluation-overview`. Rows use subgrid. `align-items: start`, so a panel stays beside its own chart stage and is only as tall as its bars.
- Critics stage, then audience stage, according to the toggle. Each stage holds two charts. Execution plots the work dimensions that population judged. Enjoyment plots the enjoyment dimensions. A chart title adds the headline stance when four or more evaluations share a dominant reading. Fewer than three judged dimensions stay open. None says so.
- The side panel is titled with the population. Enjoyment comes first, then an underlined Breakdown and the enjoyment dimensions that population judged. Execution follows the same way. Each row is a full-width bar with the percentage line on the left and the count on the right. Omit a Breakdown when that family has no judgments.
- The share icons and legend are `grid-column: 1`. They sit under the charts. They do not run under the panels.
- Approach and experience splits (`.split.reading-measure`) come after the charts. Two columns inside the narrow measure: approach, then how much of the work that population experienced. Audience first, then critics, when both are in view.

An empty work says there are no evaluations. An empty filter offers Clear filters. Neither state grows a chart.

### Reviews

Both populations: `.reception-columns`, two equal columns, the full main width, up to three reviews each, newest first. A heading and "View all" link each column to `/critics` or `/audience`.

One population: `.reception-columns-single` uses the reading measure instead of the full main column. A single card column must not span the chart width.

### Share banner

Full width of `.work-main`. It is not pulled out to the page grid, and it does not include the rail. On the evaluation page the banner is a direct child aligned to `main-start`. The visual result is the same: banner lines up with the reading column, not with the poster.

## Breakpoints

`1100px`: `.work-intro` becomes one column. The facts drop under the copy at the full column width, and the left border becomes a top border. The rail stays beside it.

`860px`: `.work-frame` stacks. The poster is `min(11rem, 46%)`. The nav is a horizontal scroller (`position: static`), and `.work-nav-action` is `width: auto` so Compare does not force a full-width button. Each reading panel drops under its own chart stage, and the two charts in a stage stack. `.reading-measure` and `.reception-columns-single` lose their max-width and become full width of the stacked column. Fact rows keep the `5.5rem` label column.

## Do not

- Do not give the overview a full-bleed hero or reuse `--hero-columns` for this page.
- Do not make the facts, approach lists, personal placement, related works, or a single review column the same width as the charts.
- Do not put the facts back in a rounded card.
- Do not stretch enjoyment/execution panels to the chart height.
- Do not put share icons and the legend across the panel column.
- Do not add a second work-overview component for a mood. Themes change tokens, including `--hero-ratio` and `--content-focus`.
