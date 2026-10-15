import pytest
from sqlalchemy import create_engine, select, inspect, Integer
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from app.database.base import Base
from app.models.company import Company
from app.models.skill_intelligence import CompanySkillRequirement


def test_company_skill_requirement_schema_and_foreign_key():
    """Verify that Company.id and CompanySkillRequirement.company_id types match exactly."""
    company_id_col = Company.__table__.c.id
    req_company_id_col = CompanySkillRequirement.__table__.c.company_id

    # Canonical company id type is Integer
    assert isinstance(company_id_col.type, Integer), f"Expected Integer, got {company_id_col.type}"
    assert isinstance(req_company_id_col.type, Integer), f"Expected Integer, got {req_company_id_col.type}"

    # Foreign key references companies.id with CASCADE
    fks = list(CompanySkillRequirement.__table__.foreign_keys)
    matching_fks = [fk for fk in fks if fk.target_fullname == "companies.id"]
    assert len(matching_fks) == 1, "Expected foreign key targeting companies.id"
    assert matching_fks[0].ondelete.upper() == "CASCADE"

    # Unique constraint on (company_id, skill_id)
    unique_constraints = [
        c for c in CompanySkillRequirement.__table__.constraints
        if hasattr(c, "columns") and {col.name for col in c.columns} == {"company_id", "skill_id"}
    ]
    assert len(unique_constraints) >= 1, "Expected unique constraint on (company_id, skill_id)"


def test_company_skill_requirement_crud_and_cascade():
    """Test full CRUD lifecycle, ORM relationships, and cascade deletion."""
    test_engine = create_engine("sqlite:///:memory:")
    # Enable foreign keys for SQLite
    with test_engine.connect() as conn:
        conn.exec_driver_sql("PRAGMA foreign_keys = ON")

    Base.metadata.create_all(test_engine)
    Session = sessionmaker(bind=test_engine)
    session = Session()

    try:
        # Create company
        company = Company(
            name="SkillBattle Technologies",
            slug="skillbattle-tech",
            industry="EdTech",
            status="verified",
        )
        session.add(company)
        session.flush()

        assert isinstance(company.id, int)
        company_id = company.id

        # Create skill requirements
        req1 = CompanySkillRequirement(
            company_id=company_id,
            skill_id="dsa.arrays",
            importance=5,
            minimum_mastery="COMPETENT",
            recommended_mastery="STRONG",
        )
        req2 = CompanySkillRequirement(
            company_id=company_id,
            skill_id="sql.join",
            importance=4,
            minimum_mastery="LEARNING",
            recommended_mastery="COMPETENT",
        )
        session.add_all([req1, req2])
        session.commit()

        # Verify retrieval and relationships
        saved_company = session.get(Company, company_id)
        assert len(saved_company.skill_requirements) == 2
        skills = {r.skill_id for r in saved_company.skill_requirements}
        assert skills == {"dsa.arrays", "sql.join"}
        assert req1.company.slug == "skillbattle-tech"

        # Verify unique constraint on (company_id, skill_id)
        duplicate_req = CompanySkillRequirement(
            company_id=company_id,
            skill_id="dsa.arrays",
            importance=3,
        )
        session.add(duplicate_req)
        with pytest.raises(IntegrityError):
            session.commit()
        session.rollback()

        # Verify ON DELETE CASCADE
        company_to_delete = session.get(Company, company_id)
        session.delete(company_to_delete)
        session.commit()

        remaining_reqs = session.scalars(
            select(CompanySkillRequirement).where(CompanySkillRequirement.company_id == company_id)
        ).all()
        assert len(remaining_reqs) == 0, "CompanySkillRequirement records should be cascaded on company delete"

    finally:
        session.close()
        test_engine.dispose()


def test_migration_5d9e1f1a7c66_and_corrective_migration_execution():
    """Verify migrations 5d9e1f1a7c66 and e8c1b2a3f4d5 execute cleanly with matching column types."""
    import importlib.util
    from pathlib import Path
    from alembic.migration import MigrationContext
    from alembic.operations import Operations
    from sqlalchemy import Table, Column, String, text

    backend_dir = Path(__file__).resolve().parents[2]
    versions_dir = backend_dir / "alembic" / "versions"

    def load_migration(filename):
        path = versions_dir / filename
        spec = importlib.util.spec_from_file_location(path.stem, path)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        return mod

    m_5d9 = load_migration("5d9e1f1a7c66_add_skill_intelligence_evidence_tables.py")
    m_e8c = load_migration("e8c1b2a3f4d5_align_company_skill_requirements_company_id_type.py")

    test_engine = create_engine("sqlite:///:memory:")

    with test_engine.connect() as conn:
        conn.exec_driver_sql("PRAGMA foreign_keys = ON")

        # Set up prerequisite tables: users and companies (with Integer primary key)
        conn.execute(text("CREATE TABLE users (id VARCHAR(36) PRIMARY KEY, email VARCHAR(255))"))
        conn.execute(text("CREATE TABLE companies (id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(200))"))
        conn.commit()

        ctx = MigrationContext.configure(conn)
        op = Operations(ctx)

        # Inject op into the migration modules
        m_5d9.op = op
        m_e8c.op = op

        # Run 5d9 upgrade
        m_5d9.upgrade()
        conn.commit()

        # Inspect resulting table
        inspector = inspect(conn)
        tables = inspector.get_table_names()
        assert "skill_evidence" in tables
        assert "company_skill_requirements" in tables

        columns = {c["name"]: c for c in inspector.get_columns("company_skill_requirements")}
        assert "company_id" in columns
        assert isinstance(columns["company_id"]["type"], Integer), f"Expected Integer, got {columns['company_id']['type']}"

        # Insert a company and a skill requirement to ensure schema works
        conn.execute(text("INSERT INTO companies (name) VALUES ('Test Corp')"))
        conn.execute(text("INSERT INTO company_skill_requirements (id, company_id, skill_id, importance, minimum_mastery, recommended_mastery, created_at) "
                          "VALUES ('req-1', 1, 'dsa.trees', 3, 'LEARNING', 'COMPETENT', CURRENT_TIMESTAMP)"))
        conn.commit()

        # Run corrective migration e8c upgrade - should be an idempotent no-op since it's already Integer
        m_e8c.upgrade()
        conn.commit()

        inspector_after = inspect(conn)
        columns_after = {c["name"]: c for c in inspector_after.get_columns("company_skill_requirements")}
        assert isinstance(columns_after["company_id"]["type"], Integer)

        # Verify record is intact
        row = conn.execute(text("SELECT id, company_id, skill_id FROM company_skill_requirements WHERE id = 'req-1'")).fetchone()
        assert row is not None
        assert row[0] == "req-1"
        assert row[1] == 1
        assert row[2] == "dsa.trees"

        # Test downgrade of 5d9
        m_5d9.downgrade()
        conn.commit()

        inspector_down = inspect(conn)
        tables_down = inspector_down.get_table_names()
        assert "company_skill_requirements" not in tables_down
        assert "skill_evidence" not in tables_down

    test_engine.dispose()
