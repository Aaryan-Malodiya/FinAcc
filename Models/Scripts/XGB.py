import hashlib
import gc
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
identity = pd.read_csv(r"C:\Datasets\ieee-fraud-detection\train_identity.csv")
transaction = pd.read_csv(r"C:\Datasets\ieee-fraud-detection\train_transaction.csv")

df = pd.merge(transaction, identity, on="TransactionID", how="left")
del identity, transaction
gc.collect()

df = df.copy()
combined_str = df["card1"].fillna("").astype(str) + "_" + df["card2"].fillna("").astype(str) + "_" + df["addr1"].fillna("").astype(str)
df["user_id"] = combined_str.map(lambda x: hashlib.md5(x.encode()).hexdigest()).astype("category")

user_grouped = df.groupby("user_id", observed=False)
user_avg = user_grouped["TransactionAmt"].transform("mean")
user_std = user_grouped["TransactionAmt"].transform("std").fillna(0)

df["user_average_transaction_amount"] = user_avg.astype(np.float32)
df["user_spending_std"] = user_std.astype(np.float32)

df['email_mismatch'] = (
    (df['P_emaildomain'].astype(str) != df['R_emaildomain'].astype(str)) & 
    (df['P_emaildomain'].notna()) & 
    (df['R_emaildomain'].notna())
).astype(np.uint8)

df['device_info_completely_missing'] = (df['id_30'].isna() & df['id_31'].isna()).astype(np.uint8)
df['is_missing_identity_profile'] = df['id_01'].isna().astype(np.uint8)
df['missing_purchaser_email'] = df['P_emaildomain'].isna().astype(np.uint8)

df["current_transaction_to_user_average_ratio"] = (df["TransactionAmt"] / df["user_average_transaction_amount"]).astype(np.float32)
df["current_transaction_to_user_std_ratio"] = np.where(
    df["user_spending_std"] != 0, 
    df["TransactionAmt"] / df["user_spending_std"], 
    0
).astype(np.float32)

CatConversion(df)

TX, TY = df.drop(columns=["isFraud"]), df["isFraud"]
del df
gc.collect()

X_Train, X_Test, Y_Train, Y_Test = train_test_split(
    TX, TY, test_size=0.2, random_state=420, stratify=TY
)
del TX, TY
gc.collect()

counts = Y_Train.value_counts()
calculated_weight = counts[0] / counts[1]
print(f"Scale Pos Weight Applied: {calculated_weight:.4f}")

Model_Trans = XGBClassifier(
    enable_categorical=True,
    scale_pos_weight=calculated_weight,
    eval_metric="aucpr",  
    random_state=420,
)

Model_Trans.fit(X_Train, Y_Train)
Y_Probs = Model_Trans.predict_proba(X_Test)[:, 1]

threshold = 0.82
Y_Pred = (Y_Probs >= threshold).astype(int)

print(f"\n--- Results at Threshold {threshold} ---")
print("Accuracy of transactions model: ", accuracy_score(Y_Test, Y_Pred))
print("\nClassification Report:\n", classification_report(Y_Test, Y_Pred))
print("Confusion Matrix:\n", confusion_matrix(Y_Test, Y_Pred))

joblib.dump(Model_Trans, "XGB_Epitaph_Model.pkl")
print("\nModel saved successfully as 'XGB_Epitaph_Model.pkl'")
