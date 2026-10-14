Enhance the FRAME evaluation graph heatmap by adding subtle illumination and organic internal variation, while preserving the current stance-driven color behavior.

Important:
- Do NOT change the semantic meaning of the current field.
- The current interpolated Positive / Mixed / Negative color blending is the truth layer.
- Do NOT reintroduce a fixed red center or any stance-independent color behavior.

Goal:
Make the field feel more alive, luminous, and shareable — less like a flat filled polygon and more like an energized evaluative artifact.

Add the following visual layers:

1. Base field
- Keep the existing stance-derived interpolated fill.
- Positive remains green/lime.
- Mixed remains amber/yellow.
- Negative remains orange/red.

2. Inner illumination
- Add a soft inner glow clipped to the polygon.
- The polygon should appear gently illuminated from within.
- Use a blurred polygon mask or soft light pass.
- Keep this subtle and elegant.

3. Organic variation
- Add low-frequency internal texture/variation so the fill is not perfectly uniform.
- Use Perlin noise, Simplex noise, FBM, blurred noise, or layered soft gradients.
- Prefer luminance and slight saturation variation over hue shifts.
- Do not introduce random colors unrelated to the underlying stance.
- The variation should feel atmospheric or plasma-like, not grainy or speckled.

4. Edge energy
- Add a subtle rim glow around the polygon boundary.
- Slightly brighten vertex nodes.
- Optionally give each vertex a faint stance-colored glow.
- Preserve crisp chart readability.

Constraints:
- Keep the result clean and refined.
- Avoid overdoing the effect.
- No harsh noise.
- No obvious shader gimmicks.
- No muddy color mixing.
- No strong texture that competes with labels or geometry.

Desired visual feel:
- illuminated
- organic
- softly energized
- arcade-inspired
- premium
- shareable

It should feel like a meaningful evaluation artifact, not a generic dashboard chart.

Implementation suggestions:
- Render the current field as usual.
- Add a secondary clipped glow pass based on the polygon mask.
- Add low-frequency luminance modulation via procedural noise or blurred random fields.
- Add a subtle outer/edge bloom.
- Ensure deterministic output for identical review data.

Acceptance criteria:
- All-Positive reviews still look predominantly green, but now have subtle internal variation and glow.
- Mixed regions remain clearly localized and readable.
- No effect should distort the judgment meaning.
- The chart should look more “alive” without becoming visually noisy.