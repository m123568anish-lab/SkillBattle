import app.database.init_db as database_init
from sqlalchemy import create_engine, inspect, text

from app.database.base import Base
import app.database.init_db  # noqa: F401 - registers every startup model


def test_dashboard_dependencies_are_registered_for_startup_schema():
    required_tables = {
        "battle_participants",
        "battle_results",
        "battle_rooms",
        "streak",
        "user_skill_stats",
        "xp",
    }

    assert required_tables.issubset(Base.metadata.tables)


def test_achievement_model_exposes_dashboard_fields():
    achievement_table = Base.metadata.tables["achievements"]
    required_columns = {"id", "user_id", "title", "description", "icon", "unlocked", "earned_at"}

    assert required_columns.issubset(achievement_table.columns.keys())


def test_dashboard_schema_repair_adds_columns_to_legacy_tables(monkeypatch):
    legacy_engine = create_engine("sqlite:///:memory:")
    with legacy_engine.begin() as connection:
        connection.execute(text('CREATE TABLE "xp" (id INTEGER PRIMARY KEY)'))
        connection.execute(text('CREATE TABLE "daily_challenges" (id INTEGER PRIMARY KEY)'))

    monkeypatch.setattr(database_init, "engine", legacy_engine)
    database_init._repair_dashboard_tables()

    inspector = inspect(legacy_engine)
    assert "daily_xp" in {column["name"] for column in inspector.get_columns("xp")}
    assert "xp_reward" in {
        column["name"] for column in inspector.get_columns("daily_challenges")
    }

    with legacy_engine.connect() as connection:
        connection.execute(text('INSERT INTO "xp" (id) VALUES (1)'))
        connection.execute(text('INSERT INTO "daily_challenges" (id) VALUES (1)'))
        assert connection.execute(text('SELECT daily_xp FROM "xp"')).scalar_one() == 0
        assert connection.execute(text('SELECT xp_reward FROM "daily_challenges"')).scalar_one() == 50

    legacy_engine.dispose()
