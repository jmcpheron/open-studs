"""Every .scad file under studs/, latches/, patterns/ must implement the
module/function signature contract documented in CONTRIBUTING.md.

The contract:
    studs/<name>.scad     → module stud_<name>(size, tip_radius, height)
    latches/<name>.scad   → module latch_<name>(band_width, band_thickness, end)
    patterns/<name>.scad  → function pattern_<name>(band_length, band_width, rows, spacing)

A contribution that doesn't match here fails CI before it can be merged.
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).parent.parent

STUD_MODULE_RE     = re.compile(r"^\s*module\s+stud_(\w+)\s*\(", re.MULTILINE)
LATCH_MODULE_RE    = re.compile(r"^\s*module\s+latch_(\w+)\s*\(", re.MULTILINE)
PATTERN_FUNCTION_RE = re.compile(r"^\s*function\s+pattern_(\w+)\s*\(", re.MULTILINE)


def _scad_files(subdir: str) -> list[Path]:
    return sorted((REPO_ROOT / subdir).glob("*.scad"))


@pytest.mark.parametrize("scad", _scad_files("studs"), ids=lambda p: p.name)
def test_stud_signature(scad: Path) -> None:
    text = scad.read_text()
    matches = STUD_MODULE_RE.findall(text)
    expected = scad.stem
    assert expected in matches, (
        f"{scad.name} must define `module stud_{expected}(...)`; "
        f"found stud modules: {matches or '(none)'}"
    )


@pytest.mark.parametrize("scad", _scad_files("latches"), ids=lambda p: p.name)
def test_latch_signature(scad: Path) -> None:
    text = scad.read_text()
    matches = LATCH_MODULE_RE.findall(text)
    expected = scad.stem
    assert expected in matches, (
        f"{scad.name} must define `module latch_{expected}(...)`; "
        f"found latch modules: {matches or '(none)'}"
    )


@pytest.mark.parametrize("scad", _scad_files("patterns"), ids=lambda p: p.name)
def test_pattern_signature(scad: Path) -> None:
    text = scad.read_text()
    matches = PATTERN_FUNCTION_RE.findall(text)
    expected = scad.stem
    assert expected in matches, (
        f"{scad.name} must define `function pattern_{expected}(...)`; "
        f"found pattern functions: {matches or '(none)'}"
    )


def test_bracelet_dispatches_every_stud() -> None:
    """If a stud file exists under studs/, bracelet.scad must have a dispatch
    branch for it in place_stud()."""
    bracelet = (REPO_ROOT / "bracelet.scad").read_text()
    stud_files = [p.stem for p in _scad_files("studs")]
    missing = [name for name in stud_files if f'"{name}"' not in bracelet]
    assert not missing, (
        f"bracelet.scad place_stud() is missing dispatch branches for: {missing}. "
        f"Add `else if (name == \"<stud>\") stud_<stud>(size, tip_radius);` for each."
    )


def test_bracelet_dispatches_every_latch() -> None:
    bracelet = (REPO_ROOT / "bracelet.scad").read_text()
    latch_files = [p.stem for p in _scad_files("latches")]
    missing = [name for name in latch_files if f'"{name}"' not in bracelet]
    assert not missing, (
        f"bracelet.scad place_latch() is missing dispatch branches for: {missing}"
    )


def test_bracelet_dispatches_every_pattern() -> None:
    bracelet = (REPO_ROOT / "bracelet.scad").read_text()
    pattern_files = [p.stem for p in _scad_files("patterns")]
    missing = [name for name in pattern_files if f'"{name}"' not in bracelet]
    assert not missing, (
        f"bracelet.scad pattern_positions() is missing dispatch branches for: {missing}"
    )
