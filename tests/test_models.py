from sqlalchemy import create_engine, inspect
from app.database.session import Base
from app.database.models import User, Audit, Token, Report


def test_create_tables_in_memory():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    assert "users" in tables
    assert "audits" in tables
    assert "tokens" in tables
    assert "reports" in tables
