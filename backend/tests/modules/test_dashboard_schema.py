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
