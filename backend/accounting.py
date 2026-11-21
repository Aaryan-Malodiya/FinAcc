from __future__ import annotations

import re
from datetime import date
from decimal import Decimal
from typing import Generator

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, aliased

from Database.Schema.Schema import Account, AccountingPeriod, LedgerEntry, User
from Database.database import SessionLocal, init_db

router = APIRouter(prefix="/api", tags=["accounting"])

DEMO_USER_EMAIL = "demo@finacc.local"
DEMO_ACCOUNTS = (
    ("1010", "Cash — Operating", "asset"),
    ("1200", "Accounts Receivable", "asset"),
    ("1400", "Prepaid Expenses", "asset"),
    ("1500", "Equipment", "asset"),
    ("2010", "Accounts Payable", "liability"),
    ("2200", "Accrued Liabilities", "liability"),
    ("3000", "Retained Earnings", "equity"),
    ("4000", "Revenue — Services", "revenue"),
    ("5100", "Cost of Services", "expense"),
    ("6100", "Payroll Expense", "expense"),
    ("6300", "Software & Subscriptions", "expense"),
    ("6500", "Travel & Entertainment", "expense"),
)
REFERENCE_PATTERN = re.compile(r"^[A-Z]{2,4}-\d{3,6}$")


class AccountResponse(BaseModel):
    code: str
    name: str
    account_type: str


class LedgerEntryRequest(BaseModel):
    posting_date: date
    amount: Decimal = Field(gt=0, max_digits=15, decimal_places=2)
    reference: str = Field(min_length=6, max_length=20)
    description: str = Field(min_length=8, max_length=500)
    debit_account_code: str = Field(min_length=1, max_length=20)
    credit_account_code: str = Field(min_length=1, max_length=20)

    @field_validator("reference")
    @classmethod
    def validate_reference(cls, value: str) -> str:
        normalized = value.strip().upper()
        if not REFERENCE_PATTERN.fullmatch(normalized):
            raise ValueError("Use the reference format ABC-12345.")
        return normalized

    @field_validator("description", "debit_account_code", "credit_account_code")
    @classmethod
    def strip_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank.")
        return value

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Description must be at least 8 characters.")
        return value


class LedgerEntryResponse(BaseModel):
    id: str
    reference: str
    date: date
    description: str
    debit_account: str
    credit_account: str
    amount: float
    status: str
    risk: None = None
    risk_score: None = None


def get_db() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def initialize_demo_database() -> None:
    init_db()
    today = date.today()
    with SessionLocal.begin() as session:
        if session.scalar(select(User).where(User.email == DEMO_USER_EMAIL)) is None:
            session.add(
                User(
                    full_name="FinAcc Demo User",
                    email=DEMO_USER_EMAIL,
                    password_hash="not-for-authentication",
                    role="admin",
                )
            )

        for code, name, account_type in DEMO_ACCOUNTS:
            if session.get(Account, code) is None:
                session.add(
                    Account(
                        account_code=code,
                        account_name=name,
                        account_type=account_type,
                    )
                )

        open_period = session.scalar(
            select(AccountingPeriod.period_id).where(AccountingPeriod.status == "open").limit(1)
        )
        if open_period is None:
            session.add(
                AccountingPeriod(
                    period_start=date(today.year, 1, 1),
                    period_end=date(today.year, 12, 31),
                    status="open",
                )
            )


def _account_label(account: Account) -> str:
    return f"{account.account_code} · {account.account_name}"


@router.get("/accounts", response_model=list[AccountResponse])
def list_accounts(session: Session = Depends(get_db)) -> list[AccountResponse]:
    accounts = session.scalars(
        select(Account).where(Account.is_active.is_(True)).order_by(Account.account_code)
    ).all()
    return [
        AccountResponse(code=account.account_code, name=account.account_name, account_type=account.account_type)
        for account in accounts
    ]


@router.get("/ledger", response_model=list[LedgerEntryResponse])
def list_ledger_entries(session: Session = Depends(get_db)) -> list[LedgerEntryResponse]:
    debit_account = aliased(Account)
    credit_account = aliased(Account)
    rows = session.execute(
        select(LedgerEntry, debit_account, credit_account)
        .join(debit_account, LedgerEntry.debit_account_code == debit_account.account_code)
        .join(credit_account, LedgerEntry.credit_account_code == credit_account.account_code)
        .order_by(LedgerEntry.posting_date.desc(), LedgerEntry.entry_id.desc())
    ).all()
    return [
        LedgerEntryResponse(
            id=f"JE-{entry.entry_id}",
            reference=entry.reference,
            date=entry.posting_date,
            description=entry.description or "",
            debit_account=_account_label(debit_account),
            credit_account=_account_label(credit_account),
            amount=float(entry.amount),
            status=entry.status,
        )
        for entry, debit_account, credit_account in rows
    ]


@router.post("/ledger/entries", response_model=LedgerEntryResponse, status_code=201)
def create_ledger_entry(
    payload: LedgerEntryRequest,
    session: Session = Depends(get_db),
) -> LedgerEntryResponse:
    if payload.posting_date > date.today():
        raise HTTPException(status_code=422, detail="Posting date cannot be in the future.")

    if payload.debit_account_code == payload.credit_account_code:
        raise HTTPException(status_code=422, detail="Debit and credit accounts must differ.")

    accounts = session.scalars(
        select(Account).where(
            Account.account_code.in_((payload.debit_account_code, payload.credit_account_code)),
            Account.is_active.is_(True),
        )
    ).all()
    accounts_by_code = {account.account_code: account for account in accounts}
    if len(accounts_by_code) != 2:
        raise HTTPException(status_code=422, detail="Select two active accounts from the chart of accounts.")

    period = session.scalar(
        select(AccountingPeriod)
        .where(
            AccountingPeriod.status == "open",
            AccountingPeriod.period_start <= payload.posting_date,
            AccountingPeriod.period_end >= payload.posting_date,
        )
        .order_by(AccountingPeriod.period_start.desc())
        .limit(1)
    )
    if period is None:
        raise HTTPException(status_code=422, detail="Posting date is outside an open accounting period.")

    demo_user = session.scalar(select(User).where(User.email == DEMO_USER_EMAIL))
    if demo_user is None:
        raise HTTPException(status_code=503, detail="The demo accounting user has not been initialized.")

    requires_approval = payload.amount > Decimal("50000.00")
    entry = LedgerEntry(
        reference=payload.reference,
        posting_date=payload.posting_date,
        period_id=period.period_id,
        amount=payload.amount,
        description=payload.description,
        debit_account_code=payload.debit_account_code,
        credit_account_code=payload.credit_account_code,
        status="pending" if requires_approval else "posted",
        requires_approval=requires_approval,
        created_by=demo_user.user_id,
    )
    session.add(entry)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        if session.scalar(select(LedgerEntry.entry_id).where(LedgerEntry.reference == payload.reference)):
            raise HTTPException(status_code=409, detail="That reference has already been used.") from exc
        raise

    session.refresh(entry)
    return LedgerEntryResponse(
        id=f"JE-{entry.entry_id}",
        reference=entry.reference,
        date=entry.posting_date,
        description=entry.description or "",
        debit_account=_account_label(accounts_by_code[entry.debit_account_code]),
        credit_account=_account_label(accounts_by_code[entry.credit_account_code]),
        amount=float(entry.amount),
        status=entry.status,
    )
