# Contributing to open-studs

The whole point of this repo is that you can add your own stud, latch, or placement pattern and PR it back. This doc explains the contract every contribution must meet.

## Quick start

1. Fork and clone.
2. Install [OpenSCAD](https://openscad.org/) (system package).
3. Optionally install the Python toolkit:
   ```sh
   uv sync --all-extras
   uv run studslab inspect bracelet.scad
   ```
4. Make your stud / latch / pattern.
5. Print it on TPU 95A.
6. Photograph the print.
7. Open a PR.

## The module signature contract

Every contribution must match these signatures so the assembly layer can mix-and-match them. This is the most important thing in this doc. Dispatch lives in `core/surface.scad` for studs/patterns and `core/latch.scad` for latches.

### Studs — `studs/<name>.scad`

```scad
// One pyramid stud, base at origin, axis along +Z, base sits flat on z=0.
//
// size       — base width in mm (default 6)
// tip_radius — fillet at the tip; 0 = sharp, 0.4 = safety-rounded
// height     — optional override; if undef, the module picks a sensible default
//              proportional to `size`
module stud_<name>(size = 6, tip_radius = 0.4, height = undef) {
    // your geometry here
}
```

Rules:

- Module name is exactly `stud_<filename-without-extension>`.
- Origin at the base center; axis along +Z; the base must sit on `z = 0` (so the bracelet can `translate([x, y, thickness])` and union it onto the band).
- Must be a closed manifold (printable without errors).
- Must print without supports.
- `tip_radius = 0` must produce the sharp variant; positive values must round/flatten the tip.

### Latches — `latches/<name>.scad`

```scad
// Add latch geometry to the ends of a band that runs along +X, centered on y=0.
//
// band_width     — bracelet width in mm
// band_thickness — bracelet thickness in mm
// end            — "left", "right", or "both"
module latch_<name>(band_width, band_thickness, end = "both") {
    // your geometry here
}
```

Rules:

- Module name is exactly `latch_<filename-without-extension>`.
- The band lives in the `+X` direction; the left end is at `x = 0`, the right end is at `x = band_length`. Your latch module is called with the band already drawn — you add to it.
- Must print without supports.
- The closure must hold a kid-sized wrist (140 mm circumference, light load) without slipping.

### Patterns — `patterns/<name>.scad`

```scad
// Return a list of [x, y] positions in band-local coordinates where studs should go.
//
// band_length — total length of the band in mm (== circumference)
// band_width  — width in mm
// rows        — how many rows of studs to lay down (1, 2, 3, ...)
// spacing     — center-to-center distance in mm; if undef, the function picks
function pattern_<name>(band_length, band_width, rows = 1, spacing = undef) =
    [ /* [x, y] pairs */ ];
```

Rules:

- Function name is exactly `pattern_<filename-without-extension>`.
- It's a **function** (not a module) so other modules can consume the list.
- Coordinates are local to the band (origin at the band's bottom-left corner).
- Leave a margin near both ends so studs don't collide with the latch.

## Stub vs working

When you add a new file, you can choose:

- **Working from day one** — full geometry, prints cleanly. This is the goal.
- **Stub** — empty body that just emits an `echo("WARN: stub")` and produces no geometry. Useful for reserving the name and locking the signature while you iterate on the design. Stubs must still compile.

The current state of each file is in the table at the bottom of [`README.md`](README.md).

## PR checklist

When you open a PR, make sure:

- [ ] The signature matches the contract above (we have a test for this; see [`tests/test_signatures.py`](tests/test_signatures.py)).
- [ ] The new file is added to the matching dispatch registry in `core/`.
- [ ] The file compiles with `openscad -o /tmp/test.stl your_file.scad` plus a minimal test wrapper that calls your module.
- [ ] You've printed it. TPU 95A, 0.2 mm layers, no supports.
- [ ] A photo of the print is in `gallery/`, filename matches the design.
- [ ] If you added a new parameter that the user should know about, you've also added it to `src/open_studs/params.py` so the explainer pages pick it up.

## Aesthetic direction

We're going for punk, metal, festival, cyberpunk, goth — anything that feels like *real* hardware on a wrist, not a craft-store keepsake. Sharp is fine. Heavy is fine. Asymmetric is fine. Pastel kawaii spikes are also fine — the kit is the kit; what you make with it is yours.
