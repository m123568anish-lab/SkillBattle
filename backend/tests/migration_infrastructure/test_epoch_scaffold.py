from pathlib import Path

from alembic.config import Config
from alembic.script import ScriptDirectory


def test_epoch_baseline_is_separate_and_has_one_root_revision() -> None:
    backend_root = Path(__file__).resolve().parents[2]
    legacy_config = Config(str(backend_root / "alembic.ini"))
    epoch_config = Config(str(backend_root / "alembic_epoch.ini"))

    legacy_script = ScriptDirectory.from_config(legacy_config)
    epoch_script = ScriptDirectory.from_config(epoch_config)

    assert legacy_script.dir != epoch_script.dir
    assert legacy_script.get_heads() == ["d1f5a8e7c2b4"]
    assert len(epoch_script.get_heads()) == 1
    baseline = epoch_script.get_revision(epoch_script.get_heads()[0])
    assert baseline is not None
    assert baseline.down_revision is None
    assert epoch_config.get_main_option("version_table") == "alembic_version_epoch"
