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
