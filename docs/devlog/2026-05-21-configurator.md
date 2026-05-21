# Curved showcase viewer — 2026-05-21

Push 5. The bracelet prints flat but is worn curved; a flat PNG sells nothing. Today shipped the Three.js showcase viewer at [/configurator/](../configurator/) — three presets, real-time bending around a wrist, two-color layer-swap simulator that maps a filament swap at print layer N to a radial color split on the worn bracelet.

## What landed

**Three preset SCAD files** (each a one-`include` + one `studded_bracelet(...)` call):

- **`classic_spiked`** — long-spike staggered double-row + buckle, 180 × 22 × 3 mm. The README's Quick Start example.
- **`festival_wide`** — star studs double-row + loop-post, 200 × 28 × 3 mm. Wider cuff.
- **`subtle_daily`** — flat pyramid single-row + magnetic, 170 × 16 × 3 mm. Work-friendly.

**`docs/configurator/`** — the viewer page:

- `index.html` — vanilla HTML, no Jekyll front matter so Jekyll passes it through unchanged
- `app.js` — Three.js ES module + custom `ShaderMaterial`. Bending math lives in the vertex shader; color split in the fragment shader.
- `style.css` — dark-mode side panel with frosted-glass backdrop blur
- `presets.json` — metadata + suggested colors for each preset
- `stls/` — auto-populated by CI on push

**`build-presets.yml`** — new workflow. Triggers on any change to `presets/*.scad`, `bracelet.scad`, `studs/**`, `latches/**`, `patterns/**`. Renders each preset to STL via the headless `openscad` CLI (no xvfb needed for STL export, unlike PNG renders). Auto-commits with the same `git add` → `git diff --cached --quiet` pattern that build-scad uses, plus `[skip ci]` to keep pages.yml from re-firing on the bot's STL commit.

**Pages URL cleanup** — `pages.yml`'s staging step now flattens `docs/` into the site root via `cp -r docs/. _src/` instead of nesting under `_src/docs/`. Result: `/configurator/`, `/devlog/`, `/explainers/`, `/assets/` are all clean root-level URLs.

## The bending math

The vertex shader takes the flat OpenSCAD coordinates and wraps them around the world Y axis:

```glsl
float angle = (position.x - circumference * 0.5) / circumference * 2π;
float r = wristRadius + position.z;       // z becomes radial
vec3 bent = vec3(r * sin(angle), position.y - bandWidth/2, r * cos(angle));
```

The non-obvious thing — and the reason this view is interesting for filament planning, not just decorative — is that **in the flat geometry, z is the print-layer axis** (layer N at z = N × 0.2 mm). After bending, z becomes the *radial direction*. So a color swap "at layer N" appears as a swap between the inner-wrist and outer-visible surface of the bracelet, with the boundary at radial distance `wristRadius + N × 0.2 mm`.

Practical consequence: if you set the swap at layer 7 on a 15-layer (3 mm) band, you get a thin black inner sleeve and a thick red outer layer — what you'd actually see on the worn print. Slide the swap toward the top and the visible red shrinks to a thin top band, what people call a "color flash" in TPU filament-swap prints.

The fragment shader uses `smoothstep(uSwapZ - 0.1, uSwapZ + 0.1, vFlatZ)` for the transition so it reads like a real print's layer-to-layer color transition, not a sharp cliff.

## Lighting note

Lighting in the shader is a basic Lambert-plus-ambient term (`0.35 + 0.65 * max(dot(normal, lightDir), 0)`). For correct shading the original mesh normals are rotated by the same bend matrix as the positions — without this step, the bent geometry would be lit as if it were still flat, which produces visible artifacts especially on the studs.

## Open questions to revisit

- **Three.js from CDN.** `unpkg.com/three@0.160.0` is convenient but adds a runtime dependency on a third-party CDN. If reliability matters, vendor the modules into `docs/configurator/vendor/` and reference relatively. Not a Push 5 blocker.
- **Wrist size selector deferred.** Showing the same STL bent at different radii distorts geometry (parts overlap at small radii). Better long-term: bake separate STLs per size, or accept the distortion and warn.
- **No camera controls.** The bracelet auto-rotates; users can't tumble or zoom. Adding `OrbitControls` is a five-line drop-in but I want to see the auto-rotate land first.
- **STL git bloat.** Three STLs at maybe 500 KB each is fine; if the preset catalog grows large, Git LFS or a CI-uploads-to-bucket pattern is the next step. See `SHAREABLE-CAD.md` for the storefront pattern.

## Verification

- `openscad -o /tmp/test.stl presets/classic_spiked.scad` produces a manifold mesh
- After push, `build-presets.yml` runs green and a bot commit lands with STLs under `docs/configurator/stls/`
- After pages.yml redeploys, https://jmcpheron.github.io/open-studs/configurator/ returns HTTP 200, the bracelet renders, controls work
