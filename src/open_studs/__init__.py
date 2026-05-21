"""open-studs — parametric studded bracelet kit.

The runtime API surface is intentionally thin. The Python side of this repo is
a parameter mirror plus a toolkit (`studslab`, `explainers`) — the geometry
itself lives in the OpenSCAD `.scad` files at the repo root.

Read `SHAREABLE-CAD.md` for the pattern this follows.
"""

from open_studs import params

__all__ = ["params"]
__version__ = "0.1.0"
