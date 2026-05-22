# Bracelet Design Architecture

`open-studs` now separates the bracelet into four layers that match both the
OpenSCAD assembly and the GitHub Pages configurator data.

## Band

Physical substrate:

- `circumference`
- `width`
- `thickness`
- `corner`
- `flex_relief`
- `relief_pitch`
- `relief_width`
- `relief_depth`

The band prints flat. `flex_relief = "inside_slots"` cuts small underside
slots into thicker bands so TPU can curve around the wrist without forcing the
top surface design to carry the bend.

## Surface

Top-side design and attachment strategy:

- `mode`: `integral`, `modular`, or `bare_with_holes`
- `stud_module`
- `stud_pattern`
- `stud_rows`
- `stud_size`
- `tip_radius`
- `stud_spacing`

Integral mode unions studs onto the band. Modular mode subtracts shallow
sockets. Bare-with-holes mode subtracts through-holes for third-party hardware.

## Latch

Closure choice and keepout:

- `type`: `buckle`, `snap`, `loop_post`, `friction_overlap`, `magnetic`, or `none`
- `clearance`

Latch geometry is assembled separately from the surface design. The clearance
keeps studs and flex slots out of latch hardware space.

## Export Stage

The same config can emit different printable artifacts:

- `print_flat`: complete bracelet STL in print orientation
- `band_only`: substrate-only coupon or blank
- `surface_only`: band plus top design, no latch
- `latch_only`: short latch fit coupon

The web viewer keeps the baked STL flat for printing and applies the wrist bend
as a display transform only. That keeps the generated STL faithful to the print
orientation while still showing how the design wears.

## Configurator JSON

The GitHub Pages configurator exports the same four-part structure as JSON:

```json
{
  "schemaVersion": 1,
  "band": {
    "circumference": 180,
    "width": 22,
    "thickness": 3,
    "corner": 4,
    "flexRelief": "none",
    "reliefPitch": 10,
    "reliefWidth": 1.2
  },
  "surface": {
    "mode": "integral",
    "stud": "pyramid",
    "pattern": "single_row",
    "rows": 1,
    "studSize": 6,
    "tipRadius": 0.4,
    "studSpacing": null
  },
  "latch": {
    "type": "mushroom_keyhole",
    "clearance": 25
  },
  "export": {
    "stage": "print_flat",
    "testLength": 70
  }
}
```

Build a downloaded config locally:

```sh
uv run studslab build-config configs/example_bracelet.json -o build/example_bracelet.stl
```

Or run the manual `build-config` GitHub Action against a committed JSON config
path, such as `configs/example_bracelet.json`. The action writes the generated
SCAD wrapper to `docs/configurator/generated/` and the STL to
`docs/configurator/stls/`.

## SCAD Entry Points

Hand-authored files can keep using the flat compatibility API:

```scad
use <bracelet.scad>

studded_bracelet(
    circumference = 180,
    width         = 22,
    thickness     = 3,
    stud_module   = "long_spike",
    stud_pattern  = "staggered",
    stud_rows     = 2,
    latch         = "buckle",
    mode          = "integral"
);
```

Generated/configurator-driven files can use grouped configs:

```scad
use <bracelet.scad>

bracelet_from_config(
    band = band_config(
        circumference = 190,
        width = 28,
        thickness = 5,
        flex_relief = "inside_slots"
    ),
    surface = surface_config(
        mode = "integral",
        stud_module = "star",
        stud_pattern = "double_row",
        stud_rows = 2,
        stud_size = 8
    ),
    latch = latch_config(type = "loop_post"),
    export = export_config(stage = "print_flat")
);
```

## Test Prints

Build focused coupons before a full bracelet:

```sh
uv run studslab build test_prints/flex_relief_strip.scad -o build/test_prints/flex_relief_strip.stl
uv run studslab build test_prints/surface_attachment_strip.scad -o build/test_prints/surface_attachment_strip.stl
uv run studslab build test_prints/latch_sampler.scad -o build/test_prints/latch_sampler.stl
```
