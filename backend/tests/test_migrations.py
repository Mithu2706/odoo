import os
import subprocess
import sys
from pathlib import Path


def test_migration_round_trip(tmp_path):
    env = dict(os.environ, DATABASE_URL="sqlite:///" + str(tmp_path / "migration.db"))
    backend = Path(__file__).resolve().parents[1]
    for args in [
        ("upgrade", "head"),
        ("downgrade", "base"),
        ("upgrade", "head"),
        ("check",),
    ]:
        result = subprocess.run(
            [sys.executable, "-m", "alembic", *args],
            cwd=backend,
            env=env,
            capture_output=True,
            text=True,
        )
        assert result.returncode == 0, result.stdout + result.stderr
