# Shareable CAD — the pattern this repo is built on

> *A pipeline for hand-printable, parametric, code-trackable, community-shareable 3D objects. A parametric source-of-truth on top; a Python kernel that deconstructs it in the middle; GitHub as the workshop; MakerWorld and Printables as the storefronts.*

This repo is the fourth project to follow the pattern, after the **PyCon 2026 gear card**, the **Pounce-a-Pult** spiral-spring cat toy, and the **Adam Savage mini vault door** study. Where those three use **Onshape** as the parametric source (with STEP exports committed into git), `open-studs` uses **OpenSCAD** — the `.scad` files in this repo *are* the source of truth, no STEP-export bridge required. Everything else from the pattern carries over.

## TL;DR

```
   OpenSCAD source       ← parametric source of truth (.scad in git)
       │
       ▼
   GitHub repo           ← Python toolkit, parameter mirror, history, issues
       │ auto-built artifacts (STL / PNG / GIF / explainer pages)
       ▼
   MakerWorld + Printables   ← consumer-facing sharing endpoints
                              (3MF bundle + slicer profile + photos)
```

`.scad` files are already code-trackable, so the Onshape-as-source variants of this pattern need an export step that `open-studs` skips. The parametric source lives in `bracelet.scad`, `studs/*.scad`, `latches/*.scad`, and `patterns/*.scad`. A Python parameter mirror at [`src/open_studs/params.py`](src/open_studs/params.py) holds the same numbers as Python constants, kept in sync by discipline and enforced by a drift test. A Python toolkit at [`src/studslab/`](src/studslab/) does the deconstruction — inspect, render, build, explode, spin. An explainer generator at [`src/explainers/`](src/explainers/) produces docs pages from the parameter file.

## What makes something "shareable CAD"

The word does a lot of work. People share STLs on Thingiverse every day; that's not what this pattern is about. What we mean:

1. **Parametric.** The object isn't a frozen mesh — it's a small number of parameters that *produce* a mesh. Change a tooth count, a diameter, a thickness, a stud spacing, and the whole thing re-derives.
2. **Single source of truth.** Every dimension lives in exactly one place. For `open-studs`, that place is the `.scad` files; a Python mirror restates the same numbers for documentation; a drift test yells if the numbers diverge.
3. **Code-trackable.** A parameter change is a one-line git diff with a commit message and a date.
4. **Derivable.** Every artifact a reader might want — exploded GIF, per-part STL, hero PNG, explainer page — is *built* by code that reads only from the source of truth. No artisanal copies.
5. **Printable.** The end-state of the whole loop is a 3D print someone else can produce in their own kitchen with a printer they already own, without having to know any of the above.

## The projects so far

| Project | Source-of-truth tool | Status | Lives on | Doc |
|---|---|---|---|---|
| Gear card (PyCon 2026) | Onshape | shipped | GitHub | pycon2026 repo |
| Pounce-a-Pult | Onshape | shipped | MakerWorld + GitHub | pycon2026 repo |
| Adam Savage mini vault | Onshape | in progress | GitHub | pycon2026 repo |
| **open-studs** | **OpenSCAD** | **vertical slice** | **GitHub** | [`README.md`](README.md) |

`open-studs` is the first project in the pattern to use OpenSCAD as the source-of-truth. The earlier three use Onshape because their geometry (gears, splines, threaded inserts) is much easier to design with mate-and-relation cloud CAD. A parametric **library of swappable modules** like `open-studs` is naturally code-first — every stud is a `module`, every pattern is a `function`, every latch is a `module`, and the band assembles them with string dispatch.

## OpenSCAD as source-of-truth — what changes vs. the Onshape variants

| Stage | Onshape variant (gear card, vault) | OpenSCAD variant (open-studs) |
|---|---|---|
| Editing surface | Onshape Part Studio variables sheet | `.scad` files |
| Source-of-truth file | Onshape doc → STEP exported to repo root | `.scad` directly in git |
| Sync to Python mirror | Hand-edit `params.py` to match Onshape variables | Hand-edit `params.py` to match `.scad` defaults |
| Drift enforcement | Drift test on parameter file vs. docs | Drift test on parameter file vs. docs |
| Public design URL | Onshape doc share link | Direct link to the `.scad` files |
| CI render dependency | `cadquery-ocp` / `build123d` (~180 MB OpenCascade) | `openscad` CLI (system package, much smaller) |

The OpenSCAD variant is **lighter** on the build side — no OpenCascade wheel, much faster CI — and **less ergonomic** for visualizing assembled motion (an Onshape Assembly tab beats `.scad` for "watch the gears mesh"). For a static library of swappable parts, the trade is worth it.

## The Python parameter mirror

[`src/open_studs/params.py`](src/open_studs/params.py) holds every dimension that has a default in the SCAD files: band defaults (`BAND_DEFAULT_CIRCUMFERENCE`, `BAND_DEFAULT_WIDTH`, `BAND_DEFAULT_THICKNESS`), stud defaults (`STUD_DEFAULT_SIZE`, `STUD_DEFAULT_TIP_RADIUS`), latch defaults (`BUCKLE_HOLES`, `BUCKLE_HOLE_SPACING`, `BUCKLE_HOLE_DIAMETER`), pattern defaults (`SINGLE_ROW_DEFAULT_SPACING`).

Other Python code (explainers, charts, tests) reads only from `params.py`. The drift test (Push 2) asserts that every number listed in `params.py` also appears in any markdown that references that number — so a one-side change fails CI.

Keeping `params.py` in sync with `.scad` defaults is by hand for now. The friction point most worth automating eventually is generating `params.py` *from* a small JSON header in each `.scad` file, but that's down the road.

## The Python kernel

The two packages are the *lab* — small CLIs that demonstrate "processing parametric 3D files at consumer-community level."

[`studslab`](src/studslab/) is the workhorse:

| Command | Does |
|---|---|
| `studslab inspect <scad>` | Parse the top-level parameters of a `.scad` file and print a table. Pure-Python, no OpenSCAD CLI dep. |
| `studslab render <scad>` | Shell out to `openscad` to produce a PNG (iso / top / side angles). |
| `studslab build <scad>` | Shell out to `openscad -o out.stl in.scad`. |
| `studslab explode <scad>` | For modular mode: render the band, each stud variant, and the latch as separate STLs. |
| `studslab spin <scad>` | Renders a rotating GIF — bracelet on a turntable, frames stitched by Pillow. |

[`explainers`](src/explainers/) generates per-page writeups from `params.py` — markdown plus SVG diagrams via `drawsvg`. Push 1 ships a skeleton; Push 2 wires up the first explainer (the stud size guide).

The packages split into a **light toolchain** (drawsvg + matplotlib, fast install, builds the explainer pages) and a **heavy toolchain** (Pillow + the `openscad` CLI on PATH, builds the STEP-derived renders). See [`pyproject.toml`](pyproject.toml).

## GitHub as the workshop

The repo's working pattern, generalised:

1. **The README tells the story.** Hero render at the top (or will, once Push 3's CI starts auto-building one). Not "documentation" — narrative.
2. **CI auto-builds derived artifacts on push.** Three workflows planned: `build-scad.yml` watches `*.scad` and rebuilds PNGs; `build-explainers.yml` watches `src/explainers/` and `params.py` and rebuilds pages; `pages.yml` publishes `docs/` to github.io. (These ship in Push 3.)
3. **Issues are for design discussion.** "Should the buckle have 5 holes or 7?" is an issue, not a Slack thread.
4. **PRs are for parameter changes and new modules.** A new stud is a PR; a tweak to the pyramid's tip radius is a PR; the diff includes the regenerated docs.
5. **GitHub Pages deploys `docs/`** so non-cloners can still read.

## MakerWorld + Printables as the storefronts

Once enough presets exist, ship them to both:

- **MakerWorld** — owned by Bambu Lab, the dominant consumer 3D-printer maker. Bundles slicer profiles with prints, dramatically lowers "first print works" failure rate. Audience is enormous.
- **Printables** — owned by Prusa. Looser, more open. Default share-license is more permissive. Smaller audience, sturdier community.

The pattern is to publish to **both**, with the bundle as the binary artifact and the GitHub repo as the parametric source. Each listing links back to the others:

```
   MakerWorld listing ──► ──► ──► GitHub repo ──► .scad source
              ▲                       │
              └─── Printables listing ┘
```

For `open-studs`, the first preset to ship will be **Classic Spiked** — long-spike pattern, single row, buckle latch, medium adult size, 22 mm wide.

## The open-source ↔ consumer-friendly tension

If MakerWorld is closed-ish, why publish there? Because a first-time 3D-printer owner with a Bambu A1 in their kitchen is more likely to open the Bambu Handy app and search MakerWorld than to clone a git repo. Pretending otherwise just keeps a smaller audience.

The core belief:

- **The source of truth stays open.** The `.scad` files are MIT-licensed. Anyone can fork and remix.
- **The derived bundle goes where the audience is.** MakerWorld gets a 3MF + slicer profile + photos. The bundle is the "click to print" consumer thing — it isn't where remixing happens, it's where the audience already lives.
- **Every listing links back.** A MakerWorld viewer sees, in the description, "Full source on GitHub" and "Web configurator at jmcpheron.github.io/open-studs." A GitHub visitor sees the MakerWorld link in the README. Nobody is trapped in any single platform.

The dual licensing (MIT for code, CC BY 4.0 for design output — see [`LICENSE`](LICENSE)) is the legal expression of this stance. The dual-publish pattern is the practical one.

## What's different about open-studs

Two things, both because `open-studs` is a **kit**, not a single object:

1. **The web configurator is a real planned endpoint, not just a remix surface.** Punk bracelets are personal — wrist size, stud type, pattern, latch all vary by wearer. A web configurator (planned: `openscad-wasm` running in-browser at `jmcpheron.github.io/open-studs`) lets people customize *before* downloading, instead of cloning and editing. This is additive to MakerWorld/Printables, not a replacement: presets go to the storefronts; one-offs come through the configurator.
2. **Contributor PRs are first-class.** The earlier projects in this pattern are single objects with a single author. `open-studs` is a kit where the community is supposed to add studs, latches, and patterns. [`CONTRIBUTING.md`](CONTRIBUTING.md) is therefore a load-bearing doc; the module signature contract there is the most important interface in the repo.

## Companion docs

- [`README.md`](README.md) — the front-door story.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — how to add a stud / latch / pattern.
- [`ACKNOWLEDGMENTS.md`](ACKNOWLEDGMENTS.md) — third-party tools and licenses.
- [`docs/devlog/`](docs/devlog/) — build journal, informal, dated.
- [`docs/explainers/`](docs/explainers/) — auto-generated parameter-driven pages (skeleton in Push 1; first real page in Push 2).
