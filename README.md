# FinAcc

**Financial Accounting Workbench with Fraud Detection**

FinAcc is a financial accounting project that combines basic accounting and ledger management with a fraud detection system. The main idea of the project is to record financial transactions and also check uploaded transaction data for possible fraudulent or unusual transactions.

The project has two main parts:

- Recording and Maintenance
- Fraud Detection

The accounting part is used to enter and manage transactions, while the fraud detection part uses machine learning to analyse transaction data and generate a risk report.

## Problem Statement

Most accounting software mainly focuses on recording transactions and maintaining ledgers. It may not provide proper analysis of unusual or suspicious transactions.

Fraudulent transactions, duplicate entries, and unusual transaction patterns can sometimes remain unnoticed until an audit is performed.

FinAcc tries to solve this problem by combining accounting and fraud detection in one system.

## Main Features

### 1. Recording and Maintenance

The accounting module provides features for recording and managing financial transactions.

Some of the main features are:

- Add new journal transactions
- Enter posting date, amount, reference and description
- Select debit and credit accounts
- Validate transaction entries
- Check double-entry rules
- Validate account information
- Check whether the amount is valid
- Check the posting date
- Store valid transactions in the database
- View ledger entries
- Search and filter transactions
- Sort transactions by different fields
- Track transaction status
- Send high-value transactions for additional approval

### 2. Fraud Detection

The fraud detection module is used to analyse transaction batches.

The main features include:

- Upload IEEE-CIS transaction CSV files
- Validate uploaded file structure
- Clean and preprocess transaction data
- Perform feature engineering
- Score transactions using a trained detection model
- Generate a risk score between 0 and 100
- Classify transactions based on their risk
- Generate a fraud risk report
- View suspicious transactions
- View reasons/features related to a flagged transaction
- Mark transactions as cleared or escalated

## Risk Classification

Each transaction receives a risk score from 0 to 100.

| Score | Risk Level |
|-------|------------|
| 0–39 | Clean |
| 40–69 | Watch |
| 70–100 | High Risk |

A clean transaction has a lower risk score, while a high-risk transaction requires further investigation.

## System Architecture

FinAcc consists of two main pipelines that use a shared database.

**Recording and Maintenance Pipeline**

```
User → Transaction Entry → Validation → Database → Ledger
```

**Fraud Detection Pipeline**

```
Transaction File → Preprocessing → Feature Engineering → Detection Model → Risk Score → Risk Report
```

The accounting pipeline stores valid transactions in the database. The fraud detection pipeline can also use transaction history during the analysis process.

## Machine Learning

The primary fraud detection model uses **XGBoost**. Model artifacts and comparison work for other architectures (see `Models/Model_Data/Transformer/` and `Models/Model_Data/Other_Models/`) live alongside it — XGBoost is the production/target model unless noted otherwise in that folder.

The model is trained and evaluated using the **IEEE-CIS Fraud Detection dataset**.

The dataset contains transaction and identity information and uses `isFraud` as the target variable:

- `isFraud = 0` → Legitimate
- `isFraud = 1` → Fraudulent

The dataset contains around 590,000 labelled transactions and has a highly imbalanced distribution between fraudulent and legitimate transactions.

Because of this imbalance, metrics such as **AUC-ROC** and **PR-AUC** are used instead of depending only on accuracy.

### Dataset Features

Some of the important feature groups in the dataset include:

- `TransactionAmt`
- `ProductCD`
- `card1`–`card6`
- `addr1`–`addr2`
- `dist1`–`dist2`
- `P_emaildomain`
- `R_emaildomain`
- `C1`–`C14`
- `D1`–`D15`
- `M1`–`M9`
- `V1`–`V339`
- `DeviceType`
- `DeviceInfo`
- `id_01`–`id_38`

The transaction and identity tables are joined using `TransactionID`.

### Full-Dataset Model Comparison

The comparison notebook uses a small synthetic CSV for demonstration. To train its six classifiers on the labeled IEEE-CIS training data instead, run from the repository root:

```powershell
python Models\Scripts\train_model_comparison.py --data-dir C:\Datasets\ieee-fraud-detection
```

The script joins `train_transaction.csv` with `train_identity.csv`, evaluates each model on the same stratified 20% holdout, then refits each model on all labeled training rows. Validation metrics and the refitted pipelines are saved under `Models/Model_Data/IEEE_CIS_Comparison/`. The official `test_transaction.csv` has no fraud labels and is not used for supervised training or evaluation. The existing production XGBoost artifact is left unchanged. To keep the full-data run within typical workstation memory, forest sizes/depths, MLP iterations, and parallel workers are bounded; see the generated manifest for those settings.


## Technology Stack

**Frontend**
- React
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- React Router

**Machine Learning**
- Python
- XGBoost
- Scikit-learn

**Data Processing**
- Pandas
- NumPy

**Database**
- Relational Database

## Validation

A rule-based validation system is used for checking accounting entries. It includes:

- Required field checking
- Data type checking
- Positive amount checking
- Account validation
- Double-entry validation
- Posting date validation

## Repository Structure

```
FinAcc/
│
├── Models/
│   ├── Model_Data/
│   │   ├── XGB/
│   │   │   ├── model.pkl
│   │   │   ├── scaler.pkl
│   │   │   └── metadata.json
│   │   │
│   │   ├── Transformer/
│   │   │   └── ...
│   │   │
│   │   └── Other_Models/
│   │       └── ...
│   │
│   └── Scripts/
│       ├── preprocessing.py
│       ├── feature_engineering.py
│       ├── train_xgb.py
│       ├── evaluate.py
│       └── predict.py
│
├── finacc-app/              # Frontend (React + TypeScript + Vite)
│   ├── src/
│   │   └── ...
│   │
│   ├── assets/
│   │   └── ...
│   │
│   └── config/
│       └── ...
│
├── DB/
│   ├── schema/
│   │   └── ...
│   │
│   ├── scripts/
│   │   └── ...
│   │
│   └── data/
│       └── ...
│
├── README.md
├── requirements.txt
└── .gitignore
```


## Getting Started

### Prerequisites

- Node.js and npm — for `finacc-app/`
- Python — for the FastAPI service and model
- A running instance of the chosen relational database

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd FinAcc

# Frontend setup
cd finacc-app
npm install

# Python/API setup (run from the repository root)
python -m pip install -r requirements.txt
```

### Running Locally

Start the API from the repository root:

```bash
python -m uvicorn backend.main:app --reload
```

Then start the frontend in another terminal:

```bash
cd finacc-app
npm run dev
```

The frontend proxies `/api` requests to `http://127.0.0.1:8000`. API health and interactive docs are available at `/api/health` and `/docs` on the API server.

On API startup, FinAcc creates the database tables and `transaction_feed` view, then adds any missing demo chart-of-accounts records, demo user, and an open period (the current calendar year if none exists). Journal entries are saved in `ledger_entries` and can be read from the General Ledger screen. References must be unique. Entries above $50,000 are saved as pending approval; journal-entry risk scoring and authentication are not implemented yet. Keep this demo backend on a trusted local environment.

### Running the Model Pipeline

```bash
cd Models/Scripts
python preprocessing.py
python feature_engineering.py
python train_xgb.py
python evaluate.py
```

## Transaction Upload Format

The fraud detection screen accepts IEEE-CIS transaction data in CSV format. The trained XGBoost artifact requires its complete 438-feature schema, including fields such as:

- `TransactionID`, `TransactionDT`, `TransactionAmt`, and `ProductCD`
- Card, address, distance, email, count, day, and `V`-series features from the IEEE-CIS transaction table

An optional `isFraud` label column is ignored during scoring. Additional columns are ignored, but missing model features and unsupported file types are rejected with an API validation error. The bundled synthetic mock CSV is a documented exception: when it contains its `FraudScenario` and `CaseNotes` marker columns, the API supplies unavailable identity/device values as missing and derives the same card-based user features used by training. Because its identity data is synthetic and user statistics come only from the uploaded batch, its scores are approximate and must not be used for real fraud decisions. Uploads are limited to 15 MB and 100,000 rows. Results include scores for the top 250 rows, risk-band counts for the full batch, and a fraud-risk rate; evaluation metrics such as AUC are not inferred from unlabeled uploads.

### Deploying the Backend to Vercel

The backend can be deployed as a separate Vercel project from this repository. Set the backend project's Root Directory to the repository root; `pyproject.toml` points Vercel to `backend.main:app`, and `vercel.json` includes the trained model file in the Python function bundle. The Vercel dependency list is kept in `requirements-vercel.txt` to avoid installing training and notebook-only packages. Python is pinned to 3.14.

Configure these backend environment variables in Vercel:

- `DB_USER`, `DB_PASSWORD`, `DB_HOST`, and optionally `DB_PORT` and `DB_NAME` for a remotely reachable MySQL database.
- `FRONTEND_ORIGINS`: comma-separated exact origins of the deployed frontend, such as `https://finacc.example.com`. Add preview origins only if needed.
- Leave `FINACC_RUN_DEMO_BOOTSTRAP` unset. Vercel instances do not create or seed database tables on startup; provision the schema and required demo/account rows once through a controlled setup process.

In the existing frontend Vercel project, set `VITE_API_BASE_URL` to the backend's HTTPS origin (without a trailing slash), then redeploy the frontend. The Vite proxy remains in use locally when this variable is empty.

Vercel Functions accept request bodies up to 20 MiB, so the CSV upload limit is 15 MiB to leave room for multipart encoding; the API still limits batches to 100,000 rows. Larger dataset uploads need object storage and asynchronous processing or a separately hosted backend. Keep the model bundle within Vercel's Python function size limit.

**Security note:** the accounting API currently has no authentication and uses demo accounting behavior. Do not expose it publicly for real financial data until authentication, authorization, and production database initialization are implemented. Use a managed database with TLS, private networking or provider-supported connection pooling, backups, and least-privilege credentials.

## Risk Report

After processing a transaction batch, the system generates a risk report.

The report can contain:

- Total transactions scanned
- Total flagged transactions
- Flagged transaction amount
- Risk score distribution
- Model performance information
- List of flagged transactions
- Risk score of each transaction
- Features contributing to the risk
- Transaction status
- Cleared or escalated transactions

The purpose of the report is to help the user identify transactions that need further checking.

## UML Diagrams

The project includes the following UML diagrams:

1. Use Case Diagram
2. Class Diagram
3. Sequence Diagram for Recording and Maintenance
4. Sequence Diagram for Fraud Detection
5. Activity Diagram
6. Component Diagram

These diagrams are used to explain the structure and working of the FinAcc system.

## Model Performance Targets

The following values are the targets planned for the model:

| Metric | Target |
|--------|--------|
| AUC-ROC | ~0.97 |
| Precision | ~0.91 |
| Recall | ~0.88 |
| F1-Score | ~0.90 |

**These are only target values.** They should be replaced with the actual results after the model is trained and tested.

## Limitations

The current version of the project does not include:

- Real-time transaction monitoring
- Multi-user role-based access control
- Regulatory compliance reporting
- Full SHAP-based model explainability
- Native mobile application

Currently, fraud detection is based on uploaded transaction batches.

## Future Scope

Some possible improvements for the future are:

- Real-time fraud detection
- Better model explainability
- Multi-user login and role management
- Regulatory reporting
- Mobile application
- Better fraud investigation features
- More detailed dashboards
- Improved transaction monitoring

## Team

| Name | Role |
|------|------|
| Abhisar Sharma | Scrum Master / Project Manager, Frontend |
| Aaryan Malodiya | Model (ML) and Backend |
| Aditi Nigam | Documentation, Frontend tweaks |
| Atharva Bhandari | Database, Backend tweaks |

**Institution:** Symbiosis University of Applied Sciences (SUAS), Indore
**Course:** B.Tech CSIT
**Project:** Innovation Project, 2026

## References

1. FinAcc Project Synopsis (2026)
2. Chenoori, R. K. and Kavuri, R. (2022). "Online Transaction Fraud Detection Using Efficient Dimensionality Reduction and Machine Learning Techniques." *Revue d'Intelligence Artificielle*, 36(4), 621–628.
3. Chen, T. and Guestrin, C. (2016). "XGBoost: A Scalable Tree Boosting System." arXiv:1603.02754.
4. IEEE Computational Intelligence Society and Vesta Corporation — IEEE-CIS Fraud Detection Dataset. Kaggle competition.

## Project Status

The project is currently under development.

The aim of FinAcc is to build a working financial accounting system that can record transactions, maintain a ledger, and analyse transaction batches for possible fraud using machine learning.
