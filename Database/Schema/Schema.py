from sqlalchemy import (
    create_engine,
    Column,
    BigInteger,
    Integer,
    String,
    Boolean,
    Date,
    DateTime,
    Numeric,
    ForeignKey,
    Enum,
    Text,
)
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    user_id = Column(BigInteger, primary_key=True, autoincrement=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(
        Enum("accountant", "fraud_analyst", "admin"),
        nullable=False,
        default="accountant",
    )
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Account(Base):
    __tablename__ = "accounts"

    account_code = Column(String(20), primary_key=True)
    account_name = Column(String(150), nullable=False)
    account_type = Column(
        Enum("asset", "liability", "equity", "revenue", "expense"),
        nullable=False,
    )
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class AccountingPeriod(Base):
    __tablename__ = "accounting_periods"

    period_id = Column(Integer, primary_key=True, autoincrement=True)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    status = Column(Enum("open", "closed"), default="open", nullable=False)


class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    entry_id = Column(BigInteger, primary_key=True, autoincrement=True)
    reference = Column(String(20), nullable=False, unique=True)
    posting_date = Column(Date, nullable=False)

    period_id = Column(
        Integer,
        ForeignKey("accounting_periods.period_id"),
        nullable=False,
    )

    amount = Column(Numeric(15, 2), nullable=False)
    description = Column(String(500))

    debit_account_code = Column(
        String(20),
        ForeignKey("accounts.account_code"),
        nullable=False,
    )

    credit_account_code = Column(
        String(20),
        ForeignKey("accounts.account_code"),
        nullable=False,
    )

    status = Column(
        Enum("pending", "posted", "flagged", "rejected"),
        default="posted",
        nullable=False,
    )

    requires_approval = Column(Boolean, default=False, nullable=False)

    approved_by = Column(BigInteger, ForeignKey("users.user_id"))
    approved_at = Column(DateTime)

    created_by = Column(
        BigInteger,
        ForeignKey("users.user_id"),
        nullable=False,
    )

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class BatchUpload(Base):
    __tablename__ = "batch_uploads"

    batch_id = Column(BigInteger, primary_key=True, autoincrement=True)

    uploaded_by = Column(
        BigInteger,
        ForeignKey("users.user_id"),
        nullable=False,
    )

    original_filename = Column(String(255), nullable=False)
    file_size_bytes = Column(BigInteger, nullable=False)
    file_format = Column(Enum("csv", "xlsx"), nullable=False)

    schema_status = Column(
        Enum("valid", "invalid"),
        default="valid",
        nullable=False,
    )

    processing_status = Column(
        Enum(
            "uploaded",
            "preprocessing",
            "scoring",
            "completed",
            "failed",
        ),
        default="uploaded",
        nullable=False,
    )

    total_transactions = Column(Integer)
    total_flagged = Column(Integer)
    flagged_exposure_amt = Column(Numeric(15, 2))

    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime)


class Transaction(Base):
    __tablename__ = "transactions"

    transaction_id = Column(BigInteger, primary_key=True, autoincrement=True)

    batch_id = Column(
        BigInteger,
        ForeignKey("batch_uploads.batch_id"),
        nullable=False,
    )

    source_transaction_id = Column(String(100), nullable=False)
    posted_at = Column(DateTime, nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)

    account_code = Column(
        String(20),
        ForeignKey("accounts.account_code"),
    )

    merchant = Column(String(255))
    counterparty = Column(String(255))
    channel = Column(String(60))
    country = Column(String(2))
    device_type = Column(String(60))
    device_info = Column(String(255))

    risk_score = Column(Integer)
    risk_level = Column(
        Enum("clean", "watch", "high"),
        default="clean",
        nullable=False,
    )

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class TransactionFeature(Base):
    __tablename__ = "transaction_features"

    transaction_id = Column(
        BigInteger,
        ForeignKey("transactions.transaction_id"),
        primary_key=True,
    )

    amount_zscore = Column(Numeric(10, 4))
    velocity_24h = Column(Integer)
    beneficiary_novelty = Column(Boolean)
    hour_of_day = Column(Integer)

    # Can be changed to JSON if you want DB-level JSON support
    extra_features = Column(Text)

    computed_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class ModelRegistry(Base):
    __tablename__ = "model_registry"

    model_id = Column(Integer, primary_key=True, autoincrement=True)
    model_version = Column(String(40), nullable=False, unique=True)

    trained_at = Column(DateTime, nullable=False)
    training_dataset = Column(
        String(120),
        nullable=False,
        default="IEEE-CIS Fraud Detection (Kaggle)",
    )

    auc_roc = Column(Numeric(5, 4))
    pr_auc = Column(Numeric(5, 4))
    precision_score = Column(Numeric(5, 4))
    recall_score = Column(Numeric(5, 4))
    f1_score = Column(Numeric(5, 4))

    scale_pos_weight = Column(Numeric(10, 4))
    is_active = Column(Boolean, default=False, nullable=False)
    notes = Column(String(500))


class RiskScore(Base):
    __tablename__ = "risk_scores"

    risk_score_id = Column(BigInteger, primary_key=True, autoincrement=True)

    transaction_id = Column(
        BigInteger,
        ForeignKey("transactions.transaction_id"),
        nullable=False,
    )

    model_id = Column(
        Integer,
        ForeignKey("model_registry.model_id"),
        nullable=False,
    )

    score = Column(Integer, nullable=False)

    risk_tier = Column(
        Enum("clean", "watch", "high"),
        nullable=False,
    )

    review_status = Column(
        Enum("unreviewed", "cleared", "escalated"),
        default="unreviewed",
        nullable=False,
    )

    reviewed_by = Column(BigInteger, ForeignKey("users.user_id"))
    reviewed_at = Column(DateTime)

    scored_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class AuditLog(Base):
    __tablename__ = "audit_log"

    audit_id = Column(BigInteger, primary_key=True, autoincrement=True)

    user_id = Column(BigInteger, ForeignKey("users.user_id"))
    action = Column(String(100), nullable=False)
    entity_type = Column(String(60), nullable=False)
    entity_id = Column(BigInteger)

    detail = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


# Database connection
DATABASE_URL = "mysql+pymysql://username:password@localhost/finacc"

engine = create_engine(DATABASE_URL, echo=True)

if __name__ == "__main__":
    Base.metadata.create_all(engine)
    print("FinAcc database schema created successfully.")