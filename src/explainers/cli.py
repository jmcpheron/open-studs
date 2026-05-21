"""explainers CLI entry point.

Usage:
    uv run explainers build           # regenerate all pages under docs/explainers/
    uv run explainers list            # show what would be generated
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from open_studs import params

PAGES = {
    "sizing": "docs/explainers/sizing.md",
    "studs": "docs/explainers/studs.md",
    "latches": "docs/explainers/latches.md",
    "patterns": "docs/explainers/patterns.md",
}


def _render_sizing() -> str:
    rows = "\n".join(
        f"| {label.replace('_', ' ').title()} | {lo}–{hi} mm |"
        for label, (lo, hi) in params.SIZING.items()
    )
    return f"""# Sizing guide

> Auto-generated from `src/open_studs/params.py`. Do not edit by hand —
> change the numbers in `params.py` and rebuild.

Wrist circumference ranges:

| Wearer | Range |
|---|---|
{rows}

Defaults shipped in `bracelet.scad`:

- `circumference = {params.BAND_DEFAULT_CIRCUMFERENCE} mm` (medium adult)
- `width         = {params.BAND_DEFAULT_WIDTH} mm`
- `thickness     = {params.BAND_DEFAULT_THICKNESS} mm`

Always print [`sizing_test.scad`](../../sizing_test.scad) before committing
to a full bracelet. TPU stretch varies by brand.
"""


def _render_studs() -> str:
    rows = "\n".join(
        f"| {name} | × {mult:.2f} |"
        for name, mult in params.STUD_HEIGHT_MULTIPLIERS.items()
    )
    return f"""# Stud catalog

> Auto-generated from `src/open_studs/params.py`.

Default size: {params.STUD_DEFAULT_SIZE} mm base.
Default tip radius: {params.STUD_DEFAULT_TIP_RADIUS} mm (safety-rounded;
set to 0 for the sharp variant).

Height multipliers, relative to the base size:

| Stud | Height multiplier |
|---|---|
{rows}
"""


def _render_latches() -> str:
    return f"""# Latch catalog

> Auto-generated from `src/open_studs/params.py`.

## Buckle

Pin-through-hole, leather-bracelet authentic.

- Adjustment holes: **{params.BUCKLE_HOLES}**, spaced **{params.BUCKLE_HOLE_SPACING} mm** apart
- Hole diameter: {params.BUCKLE_HOLE_DIAMETER} mm
- Printed pin diameter: {params.BUCKLE_PIN_DIAMETER} mm
- Total adjustability: {(params.BUCKLE_HOLES - 1) * params.BUCKLE_HOLE_SPACING} mm

## Snap

Printed peg-and-socket. Both ends have a flat tab extending past the band edge. The left tab carries a small flared peg; the right tab carries a matching socket in its underside. Wrap the band, lay the right tab over the left, press to snap. No hardware.

## Loop-post

T-headed post on the left end (rises from the band's top surface). Loop frame on the right end (extends past the band). Wrap, slip the loop over the post, the T-head captures it. Slim profile.

## Friction-overlap

No added hardware. The band's own ends taper slightly; TPU-on-TPU grip holds the overlap. Fully adjustable but may slip under heavy use.

## Magnetic

Small puck at each band end with a recessed pocket sized for a **{params.MAGNET_DIAMETER} mm × {params.MAGNET_THICKNESS} mm** neodymium disc magnet. User glues a magnet into each pocket after printing (cyanoacrylate). Polarity is the user's responsibility — mark the magnets before gluing because you cannot reverse it once cured.
"""


def _render_patterns() -> str:
    return f"""# Stud-placement patterns

> Auto-generated from `src/open_studs/params.py`.

## Working

- **`single_row`** — evenly-spaced studs along the centerline. Default spacing {params.SINGLE_ROW_DEFAULT_SPACING} mm.
- **`double_row`** — two parallel rows. Default spacing {params.DOUBLE_ROW_DEFAULT_SPACING} mm.
- **`staggered`** — two rows offset by half a step. Default spacing {params.STAGGERED_DEFAULT_SPACING} mm. Classic punk look.

## Stubs

- **`cluster`** — small groups with gaps between. Signature locked, topology TBD.
- **`gradient_size`** — varying stud sizes along the band. Needs signature extension.
"""


RENDERERS = {
    "sizing": _render_sizing,
    "studs": _render_studs,
    "latches": _render_latches,
    "patterns": _render_patterns,
}


def cmd_build(repo_root: Path) -> int:
    for key, dest in PAGES.items():
        target = repo_root / dest
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(RENDERERS[key]())
        print(f"wrote {target.relative_to(repo_root)}")
    return 0


def cmd_list() -> int:
    for key, dest in PAGES.items():
        print(f"{key:12} -> {dest}")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="explainers")
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("build", help="(re)generate all explainer pages")
    sub.add_parser("list", help="show which pages would be written")
    args = parser.parse_args(argv)

    # Repo root is wherever this script is invoked from; the explainers
    # write to docs/explainers/ relative to that.
    repo_root = Path.cwd()
    if args.cmd == "build":
        return cmd_build(repo_root)
    if args.cmd == "list":
        return cmd_list()
    print(f"unknown command: {args.cmd}", file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
