"""
FinAcc — SQLAlchemy ORM models.

This module ONLY defines the schema. It does not create an engine or
connect to any database on import — see database.py for that.
"""

from datetime import datetime, timezone

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    user_id = Column(BigInteger, primary_key=True, autoincrement=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(
        Enum("accountant", "fraud_analyst", "admin", name="user_role"),
        nullable=False,
        default="accountant",
    )
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class Account(Base):
    __tablename__ = "accounts"

    account_code = Column(String(20), primary_key=True)
    account_name = Column(String(150), nullable=False)
    account_type = Column(
        Enum("asset", "liability", "equity", "revenue", "expense", name="account_type"),
        nullable=False,
    )
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class AccountingPeriod(Base):
    __tablename__ = "accounting_periods"

    period_id = Column(Integer, primary_key=True, autoincrement=True)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    status = Column(Enum("open", "closed", name="period_status"), default="open", nullable=False)


class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    entry_id = Column(BigInteger, primary_key=True, autoincrement=True)
    reference = Column(String(20), nullable=False, unique=True)
    posting_date = Column(Date, nullable=False)

    period_id = Column(Integer, ForeignKey("accounting_periods.period_id"), nullable=False)

    amount = Column(Numeric(15, 2), nullable=False)
    description = Column(String(500))

    debit_account_code = Column(String(20), ForeignKey("accounts.account_code"), nullable=False)
    credit_account_code = Column(String(20), ForeignKey("accounts.account_code"), nullable=False)

    status = Column(
        Enum("pending", "posted", "flagged", "rejected", name="ledger_status"),
        default="posted",
        nullable=False,
    )

    requires_approval = Column(Boolean, default=False, nullable=False)

    approved_by = Column(BigInteger, ForeignKey("users.user_id"))
    approved_at = Column(DateTime)

    created_by = Column(BigInteger, ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        CheckConstraint(
            "debit_account_code <> credit_account_code",
            name="ck_ledger_debit_ne_credit",
        ),
        Index("ix_ledger_posting_date", "posting_date"),
        Index("ix_ledger_period_id", "period_id"),
        Index("ix_ledger_status", "status"),
    )


class BatchUpload(Base):
    __tablename__ = "batch_uploads"

    batch_id = Column(BigInteger, primary_key=True, autoincrement=True)

    uploaded_by = Column(BigInteger, ForeignKey("users.user_id"), nullable=False)

    original_filename = Column(String(255), nullable=False)
    file_size_bytes = Column(BigInteger, nullable=False)
    file_format = Column(Enum("csv", "xlsx", name="file_format"), nullable=False)

    schema_status = Column(Enum("valid", "invalid", name="schema_status"), default="valid", nullable=False)

    processing_status = Column(
        Enum("uploaded", "preprocessing", "scoring", "completed", "failed", name="processing_status"),
        default="uploaded",
        nullable=False,
    )

    total_transactions = Column(Integer)
    total_flagged = Column(Integer)
    flagged_exposure_amt = Column(Numeric(15, 2))

    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime)

    __table_args__ = (
        Index("ix_batch_processing_status", "processing_status"),
    )


class Transaction(Base):
    __tablename__ = "transactions"

    transaction_id = Column(BigInteger, primary_key=True, autoincrement=True)

    batch_id = Column(BigInteger, ForeignKey("batch_uploads.batch_id"), nullable=False)

    source_transaction_id = Column(String(100), nullable=False)
    posted_at = Column(DateTime, nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)

    account_code = Column(String(20), ForeignKey("accounts.account_code"))

    merchant = Column(String(255))
    counterparty = Column(String(255))
    channel = Column(String(60))
    country = Column(String(2))
    device_type = Column(String(60))
    device_info = Column(String(255))

    # NOTE: risk score / risk tier are intentionally NOT stored here.
    # They live in risk_scores, versioned per model_id, so a transaction can be
    # rescored by a newer model without losing history and without two
    # conflicting sources of truth. The `transaction_feed` view (see database.py)
    # joins in the latest risk_scores row to produce the flattened shape the
    # frontend expects.

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        Index("ix_txn_batch_id", "batch_id"),
        Index("ix_txn_posted_at", "posted_at"),
        Index("ux_txn_batch_source", "batch_id", "source_transaction_id", unique=True),
    )


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

    extra_features = Column(JSON)

    computed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


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

    transaction_id = Column(BigInteger, ForeignKey("transactions.transaction_id"), nullable=False)
    model_id = Column(Integer, ForeignKey("model_registry.model_id"), nullable=False)

    score = Column(Numeric(5, 4), nullable=False)

    risk_tier = Column(Enum("clean", "watch", "high", name="risk_tier"), nullable=False)

    review_status = Column(
        Enum("unreviewed", "cleared", "escalated", name="review_status"),
        default="unreviewed",
        nullable=False,
    )

    reviewed_by = Column(BigInteger, ForeignKey("users.user_id"))
    reviewed_at = Column(DateTime)

    scored_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        CheckConstraint("score >= 0 AND score <= 1", name="ck_risk_score_range"),
        Index("ix_risk_transaction_id", "transaction_id"),
        Index("ix_risk_tier", "risk_tier"),
        Index("ix_risk_review_status", "review_status"),
    )


class AuditLog(Base):
    __tablename__ = "audit_log"

    audit_id = Column(BigInteger, primary_key=True, autoincrement=True)

    user_id = Column(BigInteger, ForeignKey("users.user_id"))
    action = Column(String(100), nullable=False)
    entity_type = Column(String(60), nullable=False)
    entity_id = Column(BigInteger)

    detail = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        Index("ix_audit_entity", "entity_type", "entity_id"),
        Index("ix_audit_created_at", "created_at"),
    )
