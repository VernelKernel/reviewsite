# FRAME — Evaluation Field Redesign

## Objective

Redesign the existing FRAME radar/Kiviat evaluation graph to create a visually expressive, data-faithful evaluation field inspired by the colorful performance visualization found in Einhänder's end-of-stage results screen.

The current component is technically functional but visually incorrect. Its fixed red-center, yellow-middle, green-edge heatmap makes every evaluation look as though it contains negative sentiment, even when all judged dimensions are Positive.

We are replacing that fixed radial gradient with a data-driven color field.

The finished component must feel like an expressive, shareable artifact rather than a clinical dashboard visualization.

## Existing Product Context

FRAME is a review platform for games and movies built around the principle:

"Evaluations, not scores."

Users express judgments across dimensions using three states:

- Positive
- Mixed
- Negative

Users may leave dimensions unjudged.

Enjoyment and Execution are separate headline judgments, while category-specific dimensions such as Gameplay, Music, Art Direction, and Atmosphere contribute to the evaluation graph.

Maintain compatibility with the existing data structures, styling conventions, and application architecture wherever possible.

Inspect the existing graph implementation before making changes.

Do not introduce additional numerical rating requirements, alter stored evaluations, or change evaluation meanings without documenting and explicitly justifying the change.

## Critical Semantic Correction

Do not confuse stance polarity with stance magnitude.

- Polarity identifies whether a judgment is Positive, Mixed, or Negative.
- Magnitude identifies how strongly the judgment is expressed, where such a magnitude is actually available.

The chart's radial geometry and its color encoding must be treated as distinct concerns.

Do not automatically interpret the chart center as Negative.

Do not automatically interpret the chart perimeter as Positive.

If the current application encodes categorical stances directly as radial positions, preserve compatibility while isolating that legacy mapping from the new heatmap color calculations.

Do not silently invent confidence or intensity values.

If magnitude is unavailable, either retain the existing documented radial behavior or use a consistent fixed radial position for categorical stances, while preserving the stance through color and labels.

## 1. Geometry Layer

Preserve a recognizable Kiviat/radar graph.

Requirements:

- Plot all judged dimensions.
- Preserve each dimension's label.
- Render a visible polygon boundary.
- Render crisp vertex markers.
- Retain subtle circular guides and radial lines.
- Maintain responsive sizing and legible labels.
- Respect unjudged dimensions.
- Ensure sparse evaluations do not produce misleading closed polygons.

For one or two judged dimensions, provide a meaningful fallback representation instead of inventing additional vertices.

Do not imply that omitted dimensions have received neutral or negative evaluations.

The polygon shape must be derived exclusively from the application’s defined geometry data.

## 2. Color Field Layer

Replace the current fixed center-to-edge red/yellow/green radial gradient.

The new fill must be computed from the actual evaluated dimensions.

Color meanings:

Positive:
Emerald, green, lime.

Mixed:
Yellow, amber, warm gold.

Negative:
Orange, coral, red.

Use perceptually smooth interpolation.

Important:

- An all-Positive evaluation should produce a predominantly green field.
- An all-Mixed evaluation should produce a predominantly amber field.
- An all-Negative evaluation should produce a predominantly red field.
- Mixed-stance evaluations should produce regional color variation based on the actual stance positions.
- No stance-independent red center is permitted.
- No color should imply an unsubmitted judgment.

## 3. Required Rendering Technique

Preferred implementation:

- Canvas 2D rendering for the color field.
- SVG overlay for chart geometry, markers, rings, labels, and interaction.
- Optional GPU/WebGL approach only if it provides measurable benefit without unnecessary complexity.

Use a triangle-fan or equivalent continuous interpolation strategy.

Recommended algorithm:

1. Create the polygon vertices from the existing graph geometry.
2. Assign each vertex the corresponding stance color.
3. Derive an interior anchor color from the judged stances.
4. Triangulate the polygon from its center.
5. For every covered pixel, interpolate the surrounding anchor and vertex colors using barycentric weights.
6. Interpolate in OKLab or another perceptually appropriate color space when practical.
7. Convert the resulting values into displayable RGB colors.
8. Clip output to the polygon.
9. Render chart geometry above the fill.

Maintain color continuity across triangle boundaries.

Do not create visible triangular seams.

Avoid muddy brown or gray transitions between Positive and Negative regions. Ensure the interpolation path remains visually legible.

Where necessary, use a controlled intermediate amber tone for transitions rather than blindly averaging RGB components.

## 4. Center Color Logic

The center color must be derived from the submitted data, not from a hardcoded red or orange origin.

For all-Positive dimensions:
Green or yellow-green center.

For all-Mixed dimensions:
Amber or golden-yellow center.

For all-Negative dimensions:
Red or coral center.

For differing stances:
Use a balanced blended color consistent with the contributing evaluations.

Consider angular distribution when determining the balance.

Do not allow one stance to dominate solely because its polygon vertex happens to appear later in the data array.

## 5. Regional Influence

Color regions must be tied to dimension positions.

Examples:

Four Positive dimensions:
A coherent green field with subtle internal luminance variation.

Three Positive and one Mixed:
Green-dominant field with a localized amber region surrounding the Mixed vertex.

Two Positive and two Mixed:
Green and amber areas, smoothly transitioning.

Two Positive and two Negative:
Distinct positive and negative regions with controlled amber transition areas.

One Negative among Positive dimensions:
Localized orange/red area associated with the Negative dimension.

Four Negative dimensions:
Predominantly red/coral field without arbitrary green highlights.

The field must remain deterministic for a given evaluation.

Do not introduce random shifts that alter the visual meaning of the review.

## 6. Arcade-Inspired Art Direction

Reference mood:
Einhänder end-of-stage evaluation display.

Visual target:
Arcade telemetry meets collectible editorial artwork.

The color field should appear luminous, vivid, and subtly organic.

It should not resemble:

- A generic corporate dashboard
- A flat rainbow gradient
- An RGB color picker
- A warning indicator with red permanently in the middle
- A statistical graph with decorative coloring unrelated to its data

The artwork must communicate evaluative character while remaining readable.

Add the following visual treatments carefully:

- Subtle inner glow
- Restrained outer bloom
- Fine procedural texture or noise
- Smooth transitions between stance regions
- Crisp bright polygon boundary
- Small luminous vertex indicators
- Deep navy backing panel
- Faint concentric reference rings
- Thin dimensional guidelines

Use restraint.

The result should look sophisticated rather than overloaded with visual effects.

## 7. Layout and Typography

Retain the existing evaluation detail page's general architecture.

The graph must become the primary visual attraction.

Within its panel:

- Present a clear section heading.
- Increase the visual prominence of the graph itself.
- Allow more space around axis labels.
- Keep the graph centered.
- Ensure all labels remain readable.
- Avoid overcrowding the visualization with repeated category text.
- Position hover or click feedback so it does not obscure the chart.

Keep Enjoyment and Execution readable as separate summary judgments.

Do not force them into the Kiviat graph.

Keep the Dimension Breakdown section available as a precise textual interpretation of the field.

## 8. Interactive Behavior

Each vertex should support mouse and touch interaction.

On selection, show:

- Dimension name
- Submitted stance
- Optional explanation, if available

Support keyboard focus and keyboard-accessible dimension inspection.

Display clear focus indicators.

On hover or selection, subtly emphasize the selected vertex and relevant sector.

Do not alter the actual stance colors while highlighting a region.

Transitions between evaluations should smoothly animate polygon geometry and field colors where practical.

Respect reduced-motion settings.

No perpetual flashing or pulsing.

## 9. Sharing and Export

The visualization should be suitable for use in a shareable FRAME evaluation card.

Design the component to support rendering at:

- Normal desktop sizes
- Mobile screens
- Square social sharing format
- Portrait sharing format

Text and chart labels must remain readable.

The exported result must reproduce the actual evaluation colors and geometry consistently.

Avoid effects that only work in a browser or disappear during image export.

Use consistent rendering between interactive and exported modes.

## 10. Accessibility

Do not rely on color alone to communicate evaluation stance.

Preserve:

- Textual stance labels
- Semantic data descriptions
- Accessible dimension inspection
- Keyboard navigation
- Sufficient contrast for labels and controls

Treat the heatmap as an expressive representation of the evaluation, not as the only source of its meaning.

## 11. Acceptance Tests

Create tests or visual fixtures for the following states:

A. All Positive  
Four dimensions set to Positive. The graph must be green-dominant with no negative-looking red center.

B. All Mixed  
Four dimensions set to Mixed. The graph must be amber-dominant.

C. All Negative  
Four dimensions set to Negative. The graph must be red-dominant.

D. Three Positive, One Mixed  
The field must be mostly green with a localized amber influence.

E. Three Positive, One Negative  
The Negative dimension must visibly introduce a localized red/orange region without turning the entire graph red.

F. Two Positive, Two Negative  
Distinct contrasting regions must remain visible.

G. Partially Judged  
Unjudged dimensions must not contribute color or create fictional judgments.

H. Single Judged Dimension  
Use a meaningful fallback visualization.

I. Small Viewport  
Labels and chart geometry must remain readable.

J. Repeatability  
Identical evaluation data must produce identical rendered output.

K. Export Consistency  
The saved image must match the interactive chart's semantic colors and positions.

## 12. Implementation Workflow

First, inspect the existing codebase and identify:

- The current graph component
- Its data types
- Stance-to-radius mapping
- Heatmap implementation
- Styling architecture
- Existing chart dependencies
- Current image export mechanism

Then:

1. Explain the current implementation and the cause of its incorrect color behavior.
2. Identify the smallest maintainable architectural change.
3. Implement the new evaluation field.
4. Preserve existing evaluation data and API compatibility.
5. Add the necessary tests and representative visual fixtures.
6. Verify all-positive, mixed, and negative scenarios.
7. Confirm that the component remains responsive.
8. Document limitations and remaining trade-offs.

Do not stop at changing CSS gradient colors.

Do not declare the task complete merely because an all-Positive example looks correct.

The mixed-stance scenarios are equally important.

## 13. Final Quality Standard

The finished field must satisfy three distinct requirements:

**Semantic accuracy:**  
Colors and geometry faithfully represent the submitted evaluation.

**Emotional readability:**  
A viewer can immediately sense whether the evaluation is harmonious, conflicted, polarized, or negative.

**Visual desirability:**  
The chart feels distinctive and polished enough to become part of a shareable personal evaluation artifact.

The core design principle is:

**The polygon describes the structure of an evaluation. The color field expresses its character. Neither should contradict the other.**
