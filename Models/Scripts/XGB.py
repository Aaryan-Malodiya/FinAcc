import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

def CatConversion(df):
    for col in df.columns:
        dtype = df[col].dtype
        if (
            pd.api.types.is_object_dtype(dtype)
            or pd.api.types.is_string_dtype(df[col])
        ):
            df[col] = df[col].astype("category")


identity = pd.read_csv(r"Path\to\train_identity.csv")
transaction = pd.read_csv(
    r"Path\to\train_transaction.csv"
)

CatConversion(identity)
CatConversion(transaction)

TX, TY = transaction.drop(columns=["isFraud"]), transaction["isFraud"]

X_Trans_Train, X_Trans_Test, Y_Trans_Train, Y_Trans_Test = train_test_split(
    TX, TY, test_size=0.2, random_state=420, stratify=TY
)

counts = Y_Trans_Train.value_counts()
calculated_weight = counts[0] / counts[1]
print(f"Scale Pos Weight Applied: {calculated_weight:.4f}")

Model_Trans = XGBClassifier(
    enable_categorical=True,
    scale_pos_weight=calculated_weight,
    eval_metric="aucpr",
    random_state=420,
)

Model_Trans.fit(X_Trans_Train, Y_Trans_Train)
Y_Trans_Probs = Model_Trans.predict_proba(X_Trans_Test)[:, 1]

threshold = 0.63
Y_Trans_Pred = (Y_Trans_Probs >= threshold).astype(int)

print(f"\n--- Results at Threshold {threshold} ---")
print(
    "Accuracy of transactions model: ",
    accuracy_score(Y_Trans_Test, Y_Trans_Pred),
)
print("\nClassification Report:\n", classification_report(Y_Trans_Test, Y_Trans_Pred))
print("Confusion Matrix:\n", confusion_matrix(Y_Trans_Test, Y_Trans_Pred))

joblib.dump(Model_Trans, "XGB_Transactions_Model.pkl")
print("\nModel saved successfully as 'XGB_Transactions_Model.pkl'")
