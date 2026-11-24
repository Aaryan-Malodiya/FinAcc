"""
FinAcc — database connection setup.

Reads connection details from environment variables (loaded from a local
.env file via python-dotenv) instead of hardcoding credentials in source.

Usage:
    from database import engine, SessionLocal, init_db

    init_db()  # creates all tables + the transaction_feed view

    with SessionLocal() as session:
        ...
"""

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine import URL
from pathlib import Path

from Database.Schema.Schema import Base

load_dotenv(Path(__file__).resolve().with_name(".env"))

is_managed_deployment = os.getenv("VERCEL") == "1" or bool(os.getenv("RAILWAY_ENVIRONMENT_NAME"))


def _database_setting(name: str, railway_name: str, local_default: str | None = None) -> str:
    value = os.getenv(name) or os.getenv(railway_name)
    if value:
        return value
    if local_default is not None and not is_managed_deployment:
        return local_default
    raise RuntimeError(
        f"Missing database setting: configure {name} or the Railway variable {railway_name}."
    )


DB_USER = _database_setting("DB_USER", "MYSQLUSER")
DB_PASSWORD = _database_setting("DB_PASSWORD", "MYSQLPASSWORD")
DB_HOST = _database_setting("DB_HOST", "MYSQLHOST", "localhost")
DB_PORT = _database_setting("DB_PORT", "MYSQLPORT", "3306")
DB_NAME = _database_setting("DB_NAME", "MYSQLDATABASE", "finacc")

DATABASE_URL = URL.create("mysql+pymysql", username=DB_USER, password=DB_PASSWORD,
                            host=DB_HOST, port=int(DB_PORT), database=DB_NAME)

SQL_ECHO = os.getenv("SQL_ECHO", "false").lower() == "true"

engine = create_engine(DATABASE_URL, echo=SQL_ECHO, pool_pre_ping=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


# Flattens transactions + their latest risk_scores row into the shape the
# frontend's Transaction type expects (id, date, description, account, risk,
# riskScore). Simple MAX(scored_at) correlated subquery — fine at demo scale;
# swap for a window function or a latest_risk_score_id pointer before any
# real production volume (see project notes).
CREATE_TRANSACTION_FEED_VIEW = """
CREATE OR REPLACE VIEW transaction_feed AS
SELECT
    t.transaction_id,
    t.posted_at,
    t.merchant,
    t.account_code,
    t.amount,
    rs.score AS risk_score,
    rs.risk_tier
FROM transactions t
LEFT JOIN risk_scores rs
    ON rs.transaction_id = t.transaction_id
    AND rs.scored_at = (
        SELECT MAX(rs2.scored_at)
        FROM risk_scores rs2
        WHERE rs2.transaction_id = t.transaction_id
    );
"""


def init_db():
    """Create all tables (if they don't exist) and the transaction_feed view."""
    Base.metadata.create_all(engine)
    with engine.begin() as connection:
        connection.execute(text(CREATE_TRANSACTION_FEED_VIEW))


def get_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


if __name__ == "__main__":
    init_db()
    print(f"FinAcc database schema created successfully at {DB_HOST}:{DB_PORT}/{DB_NAME}")
