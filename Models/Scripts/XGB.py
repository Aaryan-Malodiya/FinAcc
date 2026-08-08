import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from xgboost import XGBClassifier

def CatConversion(cat_name, old_cat_name,df):
    for label,content in df.items():
        if df[label].dtype == old_cat_name:
            df[label] = df[label].astype(cat_name)

#Dataset used: IEEE-CIS Fraud Detection

identity = pd.read_csv("Path\\To\\train_identity.csv")
transaction = pd.read_csv("Path\\To\\train_transaction.csv")

CatConversion("category","object",identity)
CatConversion("category","object",transaction)


#Training Split for transaction:
TX, TY =transaction.drop(columns=["isFraud"]),transaction["isFraud"]
                                                                            
X_Trans_Train, X_Trans_Test, Y_Trans_Train, Y_Trans_Test = train_test_split(TX,
                                                                            TY,
                                                                            test_size=0.2,
                                                                            random_state=420,
                                                                            stratify=TY)

Model_Trans = XGBClassifier(enable_categorical=True)
Model_Trans.fit(X_Trans_Train,Y_Trans_Train)
#Accuracy Results
Y_Trans_Pred = Model_Trans.predict(X_Trans_Test)
print("Accuracy of transactions model: ", accuracy_score(Y_Trans_Pred,Y_Trans_Test))

#Exporting Model

import joblib

joblib.dump(Model_Trans, "XGB_Transactions_Model.pkl")


