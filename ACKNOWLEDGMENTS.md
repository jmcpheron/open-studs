# Acknowledgments

## People

- **Jason McPheron** — project lead, OpenSCAD source, Python toolkit.
- **Audrey** — punk aesthetic direction, stud design taste, wrist model.
- **The community** — every stud, latch, and pattern PR'd into the repo. See the [contributors page](https://github.com/jmcpheron/open-studs/graphs/contributors).

## Pattern

`open-studs` is the fourth project to follow the **Shareable CAD** pattern, after the PyCon 2026 gear card, the Pounce-a-Pult cat toy, and the Adam Savage mini vault door. See [`SHAREABLE-CAD.md`](SHAREABLE-CAD.md).

## Third-party tools

| Tool | What it does for us | License |
|---|---|---|
| [OpenSCAD](https://openscad.org/) | Parametric CAD source-of-truth. `.scad` files in this repo are read by OpenSCAD, locally and in CI. | GPL-2.0-or-later |
| [drawsvg](https://github.com/cduck/drawsvg) | SVG generation for explainer-page diagrams. | MIT |
| [matplotlib](https://matplotlib.org/) | Charts in explainer pages. | matplotlib (BSD-style) |
| [Pillow](https://python-pillow.org/) | Stitches OpenSCAD frame renders into animated GIFs. | HPND |
| [uv](https://github.com/astral-sh/uv) | Python toolchain & dependency manager. | MIT / Apache-2.0 |
| [pytest](https://pytest.org/) | Test runner — drift tests and signature tests. | MIT |

OpenSCAD is GPL; we use it as a build tool (calling its CLI), which doesn't impose copyleft on this repo's source. The `.scad` files themselves are MIT, the printed outputs are CC BY 4.0.

## Communities

- **Printables** and **MakerWorld** — the consumer-facing 3D-printing communities where presets eventually ship. Both are referenced from this repo's listings when they go live.
- The wider **OpenSCAD community** — for keeping the language alive, for `BOSL2`/`MCAD`/etc. which we may pull from in future contributions.

## Inspiration

The bracelet itself is a software-defined love letter to leather-and-studs punk fashion — a tradition that long predates either of us and that we have no ownership of. We're just translating it into TPU. If you wear one to a show, that's the highest compliment.
