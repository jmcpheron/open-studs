"""studslab CLI entry point.

Usage:
    uv run studslab inspect bracelet.scad
    uv run studslab inspect studs/pyramid.scad
"""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
from pathlib import Path

# Regex matches `module name(arg = default, ...)` and `function name(...) = ...`.
# Captures the name and the raw argument list.
_MODULE_RE = re.compile(
    r"^\s*module\s+(?P<name>\w+)\s*\((?P<args>[^)]*)\)",
    re.MULTILINE,
)
_FUNCTION_RE = re.compile(
    r"^\s*function\s+(?P<name>\w+)\s*\((?P<args>[^)]*)\)\s*=",
    re.MULTILINE,
)


def _parse_args(arglist: str) -> list[tuple[str, str | None]]:
    """Split a SCAD arg list into (name, default-or-None) pairs."""
    out: list[tuple[str, str | None]] = []
    if not arglist.strip():
        return out
    # SCAD args are separated by commas; defaults may contain expressions
    # but never nested parens at the top level for our hand-written sources.
    for raw in arglist.split(","):
        raw = raw.strip()
        if not raw:
            continue
        if "=" in raw:
            name, default = raw.split("=", 1)
            out.append((name.strip(), default.strip()))
        else:
            out.append((raw, None))
    return out


def cmd_inspect(path: Path) -> int:
    if not path.exists():
        print(f"error: {path} not found", file=sys.stderr)
        return 1
    text = path.read_text()

    modules = [
        (m.group("name"), _parse_args(m.group("args")))
        for m in _MODULE_RE.finditer(text)
    ]
    functions = [
        (m.group("name"), _parse_args(m.group("args")))
        for m in _FUNCTION_RE.finditer(text)
    ]

    print(f"# {path}")
    print()

    if modules:
        print("## modules")
        for name, args in modules:
            print(f"\n  {name}(")
            for arg_name, default in args:
                if default is None:
                    print(f"      {arg_name}")
                else:
                    print(f"      {arg_name} = {default}")
            print("  )")
        print()

    if functions:
        print("## functions")
        for name, args in functions:
            print(f"\n  {name}(")
            for arg_name, default in args:
                if default is None:
                    print(f"      {arg_name}")
                else:
                    print(f"      {arg_name} = {default}")
            print("  )")
        print()

    if not modules and not functions:
        print("(no top-level modules or functions found)")

    return 0


def cmd_build(path: Path, output: Path | None) -> int:
    if not path.exists():
        print(f"error: {path} not found", file=sys.stderr)
        return 1

    openscad = shutil.which("openscad")
    if openscad is None:
        print("error: openscad was not found on PATH", file=sys.stderr)
        return 1

    out_path = output or path.with_suffix(".stl")
    out_path.parent.mkdir(parents=True, exist_ok=True)

    result = subprocess.run(
        [openscad, "-o", str(out_path), str(path)],
        check=False,
        text=True,
    )
    if result.returncode != 0:
        return result.returncode

    print(f"wrote {out_path}")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="studslab",
        description="Inspect, render, and pack open-studs SCAD files.",
    )
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_inspect = sub.add_parser("inspect", help="Show the modules and functions defined in a .scad file.")
    p_inspect.add_argument("path", type=Path)

    p_build = sub.add_parser("build", help="Build a .scad file to STL with openscad.")
    p_build.add_argument("path", type=Path)
    p_build.add_argument("-o", "--output", type=Path, help="Output STL path.")

    # Placeholders for upcoming commands so the CLI advertises the surface.
    for cmd in ("render", "explode", "spin"):
        sp = sub.add_parser(cmd, help=f"(not yet implemented) {cmd} a .scad file.")
        sp.add_argument("path", type=Path)

    args = parser.parse_args(argv)

    if args.cmd == "inspect":
        return cmd_inspect(args.path)
    if args.cmd == "build":
        return cmd_build(args.path, args.output)

    print(f"error: `studslab {args.cmd}` is not yet implemented.", file=sys.stderr)
    print("       See SHAREABLE-CAD.md for the planned surface.", file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
