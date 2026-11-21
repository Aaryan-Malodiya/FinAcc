from __future__ import annotations

import argparse
import gc
import json
import os
import time
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from catboost import CatBoostClassifier
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import ExtraTreesClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer, OrdinalEncoder, StandardScaler
from sklearn.utils.class_weight import compute_sample_weight
from xgboost import XGBClassifier

RANDOM_STATE = 420
TEST_SIZE = 0.20
MAX_WORKERS = 2


def _project_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _compact_features(features: pd.DataFrame) -> pd.DataFrame:
    for column in features.select_dtypes(include=["object", "string"]).columns:
        features[column] = features[column].astype("category")

    for column in features.select_dtypes(include=["integer"]).columns:
        features[column] = pd.to_numeric(features[column], downcast="integer")
    for column in features.select_dtypes(include=["floating"]).columns:
        features[column] = pd.to_numeric(features[column], downcast="float")
    return features


def load_labeled_dataset(
    transaction_path: Path,
    identity_path: Path,
) -> tuple[pd.DataFrame, pd.Series]:
    transactions = pd.read_csv(transaction_path, low_memory=False)
    if "isFraud" not in transactions.columns:
        raise ValueError(f"Training target 'isFraud' was not found in {transaction_path}.")
    if "TransactionID" not in transactions.columns:
        raise ValueError(f"Join key 'TransactionID' was not found in {transaction_path}.")

    identity = pd.read_csv(identity_path, low_memory=False)
    if "TransactionID" not in identity.columns:
        raise ValueError(f"Join key 'TransactionID' was not found in {identity_path}.")

    merged = transactions.merge(
        identity,
        on="TransactionID",
        how="left",
        validate="one_to_one",
        sort=False,
    )
    del transactions, identity
    gc.collect()

    target = merged.pop("isFraud").astype(np.uint8)
    features = merged.drop(columns=["TransactionID"])
    del merged
    return _compact_features(features), target


def _preprocessor(
    numeric_columns: list[str],
    categorical_columns: list[str],
    scale_numeric: bool,
) -> ColumnTransformer:
    numeric_steps: list[tuple[str, Any]] = [
        ("imputer", SimpleImputer(strategy="median", keep_empty_features=True))
    ]
    if scale_numeric:
        numeric_steps.append(("scaler", StandardScaler()))
    numeric_steps.append(
        ("float32", FunctionTransformer(_to_float32, feature_names_out="one-to-one"))
    )

    categorical_steps = Pipeline(
        [
            ("imputer", SimpleImputer(strategy="most_frequent", keep_empty_features=True)),
            (
                "encoder",
                OrdinalEncoder(
                    handle_unknown="use_encoded_value",
                    unknown_value=-1,
                    dtype=np.float32,
                ),
            ),
        ]
    )
    return ColumnTransformer(
        [
            ("numeric", Pipeline(numeric_steps), numeric_columns),
            ("categorical", categorical_steps, categorical_columns),
        ],
        remainder="drop",
        sparse_threshold=0,
    )


def _to_float32(values: Any) -> np.ndarray:
    return np.asarray(values, dtype=np.float32)


def _models(
    numeric_columns: list[str],
    categorical_columns: list[str],
    scale_pos_weight: float,
) -> dict[str, Pipeline]:
    return {
        "Logistic Regression": Pipeline(
            [
                ("preprocessor", _preprocessor(numeric_columns, categorical_columns, scale_numeric=True)),
                ("classifier", LogisticRegression(class_weight="balanced", max_iter=1000, random_state=RANDOM_STATE)),
            ]
        ),
        "Random Forest": Pipeline(
            [
                ("preprocessor", _preprocessor(numeric_columns, categorical_columns, scale_numeric=False)),
                (
                    "classifier",
                    RandomForestClassifier(
                        n_estimators=100,
                        max_depth=16,
                        min_samples_leaf=3,
                        class_weight="balanced_subsample",
                        random_state=RANDOM_STATE,
                        n_jobs=MAX_WORKERS,
                    ),
                ),
            ]
        ),
        "Extra Trees": Pipeline(
            [
                ("preprocessor", _preprocessor(numeric_columns, categorical_columns, scale_numeric=False)),
                (
                    "classifier",
                    ExtraTreesClassifier(
                        n_estimators=100,
                        max_depth=16,
                        min_samples_leaf=3,
                        class_weight="balanced",
                        random_state=RANDOM_STATE,
                        n_jobs=MAX_WORKERS,
                    ),
                ),
            ]
        ),
        "CatBoost": Pipeline(
            [
                ("preprocessor", _preprocessor(numeric_columns, categorical_columns, scale_numeric=False)),
                (
                    "classifier",
                    CatBoostClassifier(
                        iterations=300,
                        learning_rate=0.05,
                        depth=6,
                        scale_pos_weight=scale_pos_weight,
                        loss_function="Logloss",
                        eval_metric="PRAUC",
                        random_seed=RANDOM_STATE,
                        verbose=False,
                        allow_writing_files=False,
                        thread_count=MAX_WORKERS,
                    ),
                ),
            ]
        ),
        "XGBoost": Pipeline(
            [
                ("preprocessor", _preprocessor(numeric_columns, categorical_columns, scale_numeric=False)),
                (
                    "classifier",
                    XGBClassifier(
                        n_estimators=300,
                        learning_rate=0.05,
                        max_depth=6,
                        subsample=0.8,
                        colsample_bytree=0.8,
                        scale_pos_weight=scale_pos_weight,
                        eval_metric="aucpr",
                        random_state=RANDOM_STATE,
                        n_jobs=MAX_WORKERS,
                    ),
                ),
            ]
        ),
        "MLP": Pipeline(
            [
                ("preprocessor", _preprocessor(numeric_columns, categorical_columns, scale_numeric=True)),
                (
                    "classifier",
                    MLPClassifier(
                        hidden_layer_sizes=(64, 32),
                        activation="relu",
                        alpha=0.001,
                        learning_rate_init=0.001,
                        batch_size=1024,
                        max_iter=200,
                        early_stopping=True,
                        n_iter_no_change=20,
                        random_state=RANDOM_STATE,
                    ),
                ),
            ]
        ),
    }


def _fit(model: Pipeline, name: str, features: pd.DataFrame, target: pd.Series) -> None:
    if name == "MLP":
        weights = compute_sample_weight("balanced", target)
        model.fit(features, target, classifier__sample_weight=weights)
    else:
        model.fit(features, target)


def _measure(model: Pipeline, features: pd.DataFrame, target: pd.Series) -> dict[str, float]:
    predictions = model.predict(features)
    probabilities = model.predict_proba(features)[:, 1]
    return {
        "Accuracy": float(accuracy_score(target, predictions)),
        "Precision": float(precision_score(target, predictions, zero_division=0)),
        "Recall": float(recall_score(target, predictions, zero_division=0)),
        "F1": float(f1_score(target, predictions, zero_division=0)),
        "ROC-AUC": float(roc_auc_score(target, probabilities)),
        "PR-AUC": float(average_precision_score(target, probabilities)),
    }


def _write_json(path: Path, payload: dict[str, Any]) -> None:
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def train(
    transaction_path: Path,
    identity_path: Path,
    output_dir: Path,
    resume: bool = False,
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    metrics_path = output_dir / "validation_metrics.csv"
    manifest_path = output_dir / "manifest.json"
    if not resume and (metrics_path.exists() or manifest_path.exists() or any(output_dir.glob("*.joblib"))):
        raise FileExistsError(
            f"Training output already exists in {output_dir}. Choose a new directory or pass --resume."
        )

    print(f"Loading labeled transactions from {transaction_path}", flush=True)
    started_at = time.perf_counter()
    features, target = load_labeled_dataset(transaction_path, identity_path)
    if target.nunique() != 2:
        raise ValueError("The training target must contain both fraud and non-fraud labels.")

    numeric_columns = features.select_dtypes(include=["number"]).columns.tolist()
    categorical_columns = features.select_dtypes(include=["category"]).columns.tolist()
    indices = np.arange(len(target))
    train_indices, validation_indices = train_test_split(
        indices,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=target,
    )
    train_target = target.iloc[train_indices]
    validation_target = target.iloc[validation_indices]
    class_counts = {str(label): int(count) for label, count in target.value_counts().sort_index().items()}
    scale_pos_weight = float(
        train_target.value_counts().get(0, 1) / max(train_target.value_counts().get(1, 1), 1)
    )
    models = _models(numeric_columns, categorical_columns, scale_pos_weight)
    model_names = list(models)

    print(
        f"Loaded {len(features):,} labeled rows, {features.shape[1]} features "
        f"({len(numeric_columns)} numeric, {len(categorical_columns)} categorical).",
        flush=True,
    )
    print(f"Stratified split: {len(train_indices):,} train / {len(validation_indices):,} validation.", flush=True)

    if metrics_path.exists():
        if not resume:
            raise FileExistsError(f"{metrics_path} already exists; pass --resume to continue this run.")
        metrics_frame = pd.read_csv(metrics_path)
        if "Model" not in metrics_frame.columns:
            raise ValueError(f"{metrics_path} does not contain a Model column.")
        metrics = metrics_frame.to_dict(orient="records")
    else:
        metrics = []
    completed_validation = {str(row["Model"]) for row in metrics}
    unknown_models = completed_validation - set(model_names)
    if unknown_models:
        raise ValueError(f"Existing metrics contain unrecognized models: {sorted(unknown_models)}.")

    manifest: dict[str, Any]
    if manifest_path.exists():
        if not resume:
            raise FileExistsError(f"{manifest_path} already exists; pass --resume to continue this run.")
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        prior_dataset = manifest.get("dataset", {})
        if (
            prior_dataset.get("transaction_csv") != str(transaction_path.resolve())
            or prior_dataset.get("identity_csv") != str(identity_path.resolve())
            or prior_dataset.get("labeled_rows") != len(target)
        ):
            raise ValueError("The existing run manifest does not match the selected dataset files.")
    else:
        manifest = {
            "dataset": {
                "transaction_csv": str(transaction_path.resolve()),
                "identity_csv": str(identity_path.resolve()),
                "labeled_rows": len(target),
                "feature_count": features.shape[1],
                "numeric_feature_count": len(numeric_columns),
                "categorical_feature_count": len(categorical_columns),
                "class_counts": class_counts,
            },
            "validation": {
                "test_size": TEST_SIZE,
                "random_state": RANDOM_STATE,
                "metrics_file": "validation_metrics.csv",
                "completed_models": [],
            },
            "full_data_refits": {},
            "resource_settings": {
                "max_workers": MAX_WORKERS,
                "forest_estimators": 100,
                "forest_max_depth": 16,
                "forest_min_samples_leaf": 3,
                "mlp_max_iter": 200,
            },
            "total_elapsed_seconds": None,
        }
    _write_json(manifest_path, manifest)

    train_features = features.iloc[train_indices]
    validation_features = features.iloc[validation_indices]
    del features, indices, train_indices, validation_indices
    gc.collect()

    for name in model_names:
        if name in completed_validation:
            print(f"Skipping completed validation: {name}.", flush=True)
            continue
        model = models.pop(name)
        print(f"Evaluating {name}...", flush=True)
        started = time.perf_counter()
        _fit(model, name, train_features, train_target)
        row = {"Model": name, **_measure(model, validation_features, validation_target)}
        row["ValidationSeconds"] = round(time.perf_counter() - started, 2)
        metrics.append(row)
        del model
        gc.collect()
        pd.DataFrame(metrics).to_csv(metrics_path, index=False)
        manifest["validation"]["completed_models"] = [str(row["Model"]) for row in metrics]
        _write_json(manifest_path, manifest)
        print(
            f"  PR-AUC={row['PR-AUC']:.4f}, ROC-AUC={row['ROC-AUC']:.4f}, "
            f"recall={row['Recall']:.4f} ({row['ValidationSeconds']:.1f}s)",
            flush=True,
        )

    del train_features, validation_features, train_target, validation_target, models, target
    gc.collect()
    print("Reloading all labeled rows for final model refits.", flush=True)
    features, target = load_labeled_dataset(transaction_path, identity_path)
    full_scale_pos_weight = float(
        target.value_counts().get(0, 1) / max(target.value_counts().get(1, 1), 1)
    )

    for name in model_names:
        previous_refit = manifest["full_data_refits"].get(name, {})
        previous_artifact = output_dir / previous_refit.get("artifact", "")
        if previous_refit and previous_artifact.is_file():
            print(f"Skipping completed full-data refit: {name}.", flush=True)
            continue
        print(f"Refitting {name} on all {len(target):,} labeled rows...", flush=True)
        started = time.perf_counter()
        model = _models(numeric_columns, categorical_columns, full_scale_pos_weight)[name]
        _fit(model, name, features, target)
        filename = name.lower().replace(" ", "_") + "_full.joblib"
        joblib.dump(model, output_dir / filename, compress=3)
        elapsed = round(time.perf_counter() - started, 2)
        manifest["full_data_refits"][name] = {
            "artifact": filename,
            "rows": len(target),
            "elapsed_seconds": elapsed,
        }
        _write_json(output_dir / "manifest.json", manifest)
        del model
        gc.collect()
        print(f"  Saved {filename} ({elapsed:.1f}s).", flush=True)

    manifest["total_elapsed_seconds"] = round(time.perf_counter() - started_at, 2)
    _write_json(output_dir / "manifest.json", manifest)
    print(f"Training complete. Artifacts and validation metrics: {output_dir.resolve()}", flush=True)


def main() -> None:
    root = _project_root()
    default_data_dir = Path(os.environ.get("IEEE_CIS_DATA_DIR", r"C:\Datasets\ieee-fraud-detection"))
    parser = argparse.ArgumentParser(
        description="Evaluate the six FinAcc comparison models and refit them on all labeled IEEE-CIS rows."
    )
    parser.add_argument("--data-dir", type=Path, default=default_data_dir)
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=root / "Models" / "Model_Data" / "IEEE_CIS_Comparison",
    )
    parser.add_argument(
        "--resume",
        action="store_true",
        help="Continue a previous run in the same output directory, preserving completed work.",
    )
    args = parser.parse_args()
    train(
        args.data_dir / "train_transaction.csv",
        args.data_dir / "train_identity.csv",
        args.output_dir,
        resume=args.resume,
    )


if __name__ == "__main__":
    main()
