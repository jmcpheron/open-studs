"""studslab — small CLI for inspecting and rendering open-studs .scad files.

Five commands planned (per SHAREABLE-CAD.md):
    inspect   — parse a .scad file's top-level parameters and print a table
    render    — shell to `openscad` and produce a PNG
    build     — shell to `openscad -o out.stl in.scad`
    explode   — render band + each stud + latch separately
    spin      — render a rotating-turntable GIF

Push 1 ships `inspect`. The remaining four ship as the project matures.
"""

__version__ = "0.1.0"
