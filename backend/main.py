from __future__ import annotations

import io
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
import xgboost as xgb
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).resolve().parents[1]
MODEL_PATH = (
    ROOT_DIR
    / "Models"
    / "Model_Data"
    / "XGBoost"
    / "Transaction_Module"
    / "XGB_Transactions_Model.pkl"
)
MAX_UPLOAD_BYTES = 50 * 1024 * 1024
MAX_ROWS = 100_000
REPORT_ROW_LIMIT = 250
RISK_BANDS = [
    (0, 19, "0-19"),
    (20, 39, "20-39"),
    (40, 54, "40-54"),
    (55, 69, "55-69"),
    (70, 84, "70-84"),
    (85, 100, "85-100"),
]

app = FastAPI(title="FinAcc Fraud Scoring API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

_model: Any | None = None


def load_model() -> Any:
    global _model
    if _model is None:
        if not MODEL_PATH.is_file():
            raise HTTPException(status_code=503, detail="The trained fraud model is unavailable.")
        try:
            _model = joblib.load(MODEL_PATH)
        except Exception as exc:
            raise HTTPException(status_code=503, detail="The trained fraud model could not be loaded.") from exc
    return _model


def _feature_frame(frame: pd.DataFrame, model: Any) -> pd.DataFrame:
    expected = [str(name) for name in model.feature_names_in_]
    missing = [name for name in expected if name not in frame.columns]
    if missing:
        preview = ", ".join(missing[:12])
        suffix = f" and {len(missing) - 12} more" if len(missing) > 12 else ""
        raise HTTPException(
            status_code=422,
            detail=f"CSV is missing {len(missing)} model features: {preview}{suffix}.",
        )

    features = frame.loc[:, expected].copy()
    feature_types = model.get_booster().feature_types or []
    for index, name in enumerate(expected):
        is_categorical = (
            feature_types[index] == "c"
            if index < len(feature_types)
            else not pd.api.types.is_numeric_dtype(features[name])
        )
        if is_categorical:
            features[name] = features[name].astype("category")
        else:
            features[name] = pd.to_numeric(features[name], errors="coerce")
    return features


def _display_value(value: Any) -> str:
    if pd.isna(value):
        return "Unknown"
    return str(value)


def _risk_level(score: int) -> str:
    if score >= 70:
        return "high"
    if score >= 40:
        return "watch"
    return "clean"


def _contribution_details(model: Any, features: pd.DataFrame) -> list[list[dict[str, Any]]]:
    try:
        contributions = model.get_booster().predict(
            xgb.DMatrix(features, enable_categorical=True),
            pred_contribs=True,
        )
    except (ValueError, xgb.core.XGBoostError):
        return [[] for _ in range(len(features))]

    details = []
    names = [str(name) for name in model.feature_names_in_]
    for row_index, values in enumerate(contributions):
        impacts = values[:-1]
        top_indices = np.argsort(np.abs(impacts))[-3:][::-1]
        total = float(np.abs(impacts[top_indices]).sum())
        row_details = []
        for feature_index in top_indices:
            impact = float(impacts[feature_index])
            raw_value = _display_value(features.iloc[row_index, feature_index])
            row_details.append(
                {
                    "label": names[feature_index],
                    "value": f"{raw_value} · impact {impact:+.2f}",
                    "weight": abs(impact) / total if total else 0,
                }
            )
        details.append(row_details)
    return details


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "model_available": MODEL_PATH.is_file(),
        "model_loaded": _model is not None,
    }


@app.post("/api/score")
async def score_csv(file: UploadFile = File(...)) -> dict[str, Any]:
    if not file.filename or Path(file.filename).suffix.lower() != ".csv":
        raise HTTPException(status_code=415, detail="Upload a CSV file.")

    contents = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="CSV files must be 50 MB or smaller.")
    if not contents:
        raise HTTPException(status_code=400, detail="The uploaded CSV is empty.")

    try:
        frame = pd.read_csv(io.BytesIO(contents), low_memory=False)
    except (UnicodeDecodeError, pd.errors.ParserError, pd.errors.EmptyDataError) as exc:
        raise HTTPException(status_code=400, detail="The uploaded file is not a readable CSV.") from exc

    if "isFraud" in frame.columns:
        frame = frame.drop(columns=["isFraud"])
    if frame.empty:
        raise HTTPException(status_code=400, detail="The CSV contains no transaction rows.")
    if len(frame) > MAX_ROWS:
        raise HTTPException(status_code=413, detail=f"CSV files are limited to {MAX_ROWS:,} rows.")

    started_at = time.perf_counter()
    model = load_model()
    features = _feature_frame(frame, model)
    try:
        probabilities = model.predict_proba(features)[:, 1]
    except (ValueError, xgb.core.XGBoostError) as exc:
        raise HTTPException(
            status_code=422,
            detail="CSV feature values could not be scored by the trained model.",
        ) from exc

    scores = np.rint(probabilities * 100).astype(int)
    levels = [_risk_level(int(score)) for score in scores]
    amounts = pd.to_numeric(frame["TransactionAmt"], errors="coerce").fillna(0)
    flagged_mask = scores >= 40

    top_indices = np.argsort(scores)[-REPORT_ROW_LIMIT:][::-1]
    top_features = features.iloc[top_indices]
    contribution_rows = _contribution_details(model, top_features) if len(top_indices) else []
    report_rows = []
    for position, row_index in enumerate(top_indices):
        row = frame.iloc[row_index]
        score = int(scores[row_index])
        product = _display_value(row.get("ProductCD", "Unknown"))
        card_type = _display_value(row.get("card4", "Unknown"))
        details = contribution_rows[position]
        report_rows.append(
            {
                "id": _display_value(row.get("TransactionID", row_index)),
                "date": "IEEE-CIS",
                "timestamp": f"DT {_display_value(row.get('TransactionDT', 'Unknown'))}",
                "merchant": f"ProductCD {product}",
                "account": "IEEE-CIS transaction",
                "amount": float(amounts.iloc[row_index]),
                "riskScore": score,
                "risk": levels[row_index],
                "channel": f"card4 {card_type}",
                "reasons": (
                    [f"Largest model contribution: {detail['label']}" for detail in details]
                    or [f"Fraud probability: {score}%"]
                ),
                "features": details,
            }
        )

    distribution = [
        {
            "band": label,
            "count": int(((scores >= lower) & (scores <= upper)).sum()),
            "level": "clean" if upper < 40 else "watch" if lower < 70 else "high",
        }
        for lower, upper, label in RISK_BANDS
    ]
    elapsed = round(time.perf_counter() - started_at, 3)
    return {
        "summary": {
            "batchId": f"BATCH-{uuid.uuid4().hex[:10].upper()}",
            "fileName": file.filename,
            "scanned": len(frame),
            "flagged": int(flagged_mask.sum()),
            "flaggedAmount": round(float(amounts[flagged_mask].sum()), 2),
            "modelVersion": "xgboost-ieee-cis",
            "runtimeSeconds": elapsed,
            "completedAt": datetime.now(timezone.utc).isoformat(),
        },
        "flaggedTransactions": report_rows,
        "riskDistribution": distribution,
    }