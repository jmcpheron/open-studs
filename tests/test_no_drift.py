"""Drift test.

The explainer pages under `docs/explainers/` are generated from
`src/open_studs/params.py`. If someone changes a parameter without
regenerating the docs (or vice versa), the committed page diverges from
what the generator would produce.

This test re-runs the generator into a temp directory and asserts the
output matches what's committed, byte-for-byte. So:

  - Change `params.py` → must `uv run explainers build` and commit the
    regenerated pages, or this test fails.
  - Edit a generated page by hand → next regeneration overwrites your
    edit, and this test fails until you put the edit back in the
    template instead.

This is the strongest form of drift enforcement: there is no "appears
somewhere in the doc" fuzziness. The committed doc must equal the
generated doc.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from explainers.cli import PAGES, RENDERERS

REPO_ROOT = Path(__file__).parent.parent


@pytest.mark.parametrize("key", list(PAGES.keys()))
def test_explainer_page_matches_generator(key: str) -> None:
    committed_path = REPO_ROOT / PAGES[key]
    assert committed_path.exists(), (
        f"{PAGES[key]} is missing. Run `uv run explainers build` and commit."
    )

    committed = committed_path.read_text()
    generated = RENDERERS[key]()

    assert committed == generated, (
        f"{PAGES[key]} is out of sync with params.py.\n"
        f"Re-run `uv run explainers build` and commit the result.\n\n"
        f"First mismatch around:\n{_diff_summary(committed, generated)}"
    )


def _diff_summary(a: str, b: str, ctx: int = 60) -> str:
    """Cheap diff: find the first divergent character and show context around it."""
    for i, (ca, cb) in enumerate(zip(a, b)):
        if ca != cb:
            start = max(0, i - ctx)
            end_a = min(len(a), i + ctx)
            end_b = min(len(b), i + ctx)
            return (
                f"  committed: ...{a[start:end_a]!r}...\n"
                f"  generated: ...{b[start:end_b]!r}..."
            )
    if len(a) != len(b):
        shorter, longer = (a, b) if len(a) < len(b) else (b, a)
        return (
            f"  one side is shorter by {len(longer) - len(shorter)} chars; "
            f"tail of longer: {longer[len(shorter):][:120]!r}"
        )
    return "  (no character-level diff found; check whitespace/encoding)"
