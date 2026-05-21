"""Test configuration.

Adds `src/` to sys.path so tests can `import open_studs`, `import studslab`,
`import explainers` without needing the package installed. CI runs
`uv sync --all-extras` first and so doesn't strictly need this, but local
`python -m pytest` works regardless.
"""

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
SRC = REPO_ROOT / "src"

if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))
