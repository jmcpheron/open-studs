# open-studs

[![test](https://github.com/jmcpheron/open-studs/actions/workflows/test.yml/badge.svg)](https://github.com/jmcpheron/open-studs/actions/workflows/test.yml)
[![build-explainers](https://github.com/jmcpheron/open-studs/actions/workflows/build-explainers.yml/badge.svg)](https://github.com/jmcpheron/open-studs/actions/workflows/build-explainers.yml)
[![build-scad](https://github.com/jmcpheron/open-studs/actions/workflows/build-scad.yml/badge.svg)](https://github.com/jmcpheron/open-studs/actions/workflows/build-scad.yml)
[![build-presets](https://github.com/jmcpheron/open-studs/actions/workflows/build-presets.yml/badge.svg)](https://github.com/jmcpheron/open-studs/actions/workflows/build-presets.yml)
[![pages](https://github.com/jmcpheron/open-studs/actions/workflows/pages.yml/badge.svg)](https://github.com/jmcpheron/open-studs/actions/workflows/pages.yml)

**Parametric, 3D-printable studded bracelets in TPU.** Punk-and-metal aesthetic, flexible like leather, open-source like it should be.

**[→ See the bracelet bent around a wrist with your colors](https://jmcpheron.github.io/open-studs/configurator/)** — interactive showcase with a two-color filament-swap simulator.

Designed in OpenSCAD. Browse presets at [jmcpheron.github.io/open-studs](https://jmcpheron.github.io/open-studs). Clone the repo to add your own stud designs, latches, or take it somewhere new.

This repo follows the **[Shareable CAD](SHAREABLE-CAD.md)** pattern: OpenSCAD as the parametric source-of-truth, Python kernel (`studslab`, `explainers`) for deconstruction, GitHub as the workshop, MakerWorld + Printables as the storefronts.

---

## What this is

A kit, not a single model. The band, the studs, the latches, and the placement patterns are all separate modules — mix and match to build the bracelet you want. Three ways to use it:

- **Just want to print one?** Grab a preset from [Printables](#) or [MakerWorld](#).
- **Want to customize?** Use the [web configurator](https://jmcpheron.github.io/open-studs) — pick band size, stud type, pattern, latch, and download an STL.
- **Want to design your own?** Clone the repo, edit the OpenSCAD source, PR a new stud or latch back. Contributor docs in [CONTRIBUTING.md](CONTRIBUTING.md).

## Stud modes

Three ways to build a stud:

1. **Integral studs** — studs printed as part of the band in one piece. Cleanest look, single print, single color (unless you do a color-change pause or have multi-material).
2. **Modular studs** — band and studs printed separately, friction-fit or glued. Unlocks the iconic silver-on-black look without needing a multi-material printer.
3. **Bare band with attachment holes** — band only, with a grid of through-holes. Bring your own studs: foam spikes, metal hardware, rhinestones, fabric pieces, sewn-on whatever. The bracelet becomes a substrate.

## Built-in stud designs

- Classic pyramid
- Flat (low-profile) pyramid
- Dome / half-sphere
- Cone spike
- Long spike (the dramatic one)
- Diamond
- Screw-head (flat round)
- *...and whatever the community adds*

## Latch options

Different tradeoffs — none is universally best:

- **Buckle (pin-through-hole)** — most leather-bracelet-authentic, adjustable for wrist size, very secure
- **Snap button (printed peg + socket)** — lowest profile, fastest to put on
- **Loop-and-post / toggle** — secure, hides well under studs
- **Friction overlap** — no hardware, fully adjustable, TPU-on-TPU grip (may slip in heavy use)
- **Magnetic insert pocket** — premium feel, requires a small neodymium magnet
- *...and whatever the community adds*

## Sizing

**Print a test strip before committing to a full bracelet.** TPU stretch varies by brand and infill, and wrist sizes vary more than you'd think. The repo includes a `sizing_test.scad` that prints a short calibration band — measure your wrist, print the strip, confirm fit, then print the real thing.

Rough guide:
- Kid: 140–160mm circumference
- Small adult: 160–180mm
- Medium adult: 175–195mm
- Large adult: 190–215mm

## Printing notes

- **Filament:** TPU 95A is the sweet spot — flexible enough to slip on, stiff enough to hold studs. TPU 85A works but is floppy. TPU 98A+ is too stiff for the friction latch mode.
- **Layer height:** 0.2mm is fine. 0.15mm for cleaner stud detail.
- **Infill:** 100% — TPU prints best as solid perimeters; partial infill on flexible parts looks bad and weakens the band.
- **Supports:** generally no. The studs are designed to print without support; check the preview if you're modifying placement.
- **Speed:** slow down for TPU. 20–30mm/s is typical.
- **Tip radius:** the spike-style studs have a `tip_radius` parameter. Default is rounded for safety. Set to zero for the full sharp aesthetic — your call, your wrist.

## Repository layout

```
open-studs/
├── bracelet.scad           # the band itself
├── sizing_test.scad        # calibration strip — print this first
├── studs/                  # one file per stud design
│   ├── pyramid.scad
│   ├── dome.scad
│   ├── cone_spike.scad
│   ├── long_spike.scad
│   ├── diamond.scad
│   ├── flat_pyramid.scad
│   └── screw_head.scad
├── latches/                # one file per latch
│   ├── buckle.scad
│   ├── snap.scad
│   ├── loop_post.scad
│   ├── friction_overlap.scad
│   └── magnetic.scad
├── patterns/               # stud placement strategies
│   ├── single_row.scad
│   ├── double_row.scad
│   ├── staggered.scad
│   ├── cluster.scad
│   └── gradient_size.scad
├── presets/                # ready-to-print hero configurations
│   ├── classic_spiked.3mf
│   ├── festival_wide.3mf
│   ├── subtle_daily.3mf
│   └── ...
├── docs/                   # configurator (GitHub Pages)
└── gallery/                # printed examples
```

## Quick start (OpenSCAD)

```scad
include <bracelet.scad>
include <studs/long_spike.scad>
include <latches/buckle.scad>
include <patterns/staggered.scad>

studded_bracelet(
    circumference = 180,
    width         = 22,
    thickness     = 3,
    stud_module   = "long_spike",
    stud_pattern  = "staggered",
    stud_rows     = 2,
    latch         = "buckle",
    mode          = "integral"   // or "modular" or "bare_with_holes"
);
```

## Contributing

The whole point is that you can add your own studs and latches and PR them back. See [CONTRIBUTING.md](CONTRIBUTING.md) — there's a template stud file, a shared module signature every stud must implement, and a checklist for getting your design merged.

Particularly looking for:
- New stud designs (especially anything that captures a specific subculture — goth, festival, cyberpunk, kawaii, etc.)
- New latch mechanisms with different tradeoffs
- Multi-material / AMS-aware variants
- Form-factor extensions (collars, chokers, belts, guitar straps — the stud library is reusable)

## License

Dual-licensed:

- **Source code** (`.scad` files, configurator JS, build scripts) — [MIT](LICENSE-MIT)
- **Design output and docs** (STL files, 3MF presets, printed objects, photos, gallery, README) — [CC BY 4.0](LICENSE-CC-BY)

Both licenses are permissive. You can use this commercially, modify it, sell prints of it, ship it inside a closed-source product — anything. The only requirement is attribution: credit `open-studs` and link back. For source code, that means keeping the copyright notice and MIT text in the files. For physical prints or marketplace listings, that means a visible credit somewhere reasonable (product description, included card, etc.).

Modifications you make can be released under whatever license you want, including closed/proprietary — but the original `open-studs` work stays under these licenses for everyone, forever.

## Credits

Built by Jason McPheron. Punk aesthetic direction by Audrey. Contributions from [the community](https://github.com/jmcpheron/open-studs/graphs/contributors).