# -*- coding: utf-8 -*-
"""
지방간 위험도 예측 모델 학습 스크립트
실행: python notebooks/train.py
"""
import json
import os
import warnings
warnings.filterwarnings("ignore")

import threading
import time

import joblib
import numpy as np
import pandas as pd
import optuna
from tqdm import tqdm
optuna.logging.set_verbosity(optuna.logging.WARNING)

from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline
from lightgbm import LGBMClassifier
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier, StackingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.metrics import accuracy_score, f1_score, recall_score
from sklearn.preprocessing import OrdinalEncoder, StandardScaler
from xgboost import XGBClassifier

# ================================
# 경로 설정
# ================================
BASE_DIR  = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "nhanes_fatty_liver.csv")
MODEL_DIR = os.path.join(BASE_DIR, "ai_worker", "models")
os.makedirs(MODEL_DIR, exist_ok=True)

# ================================
# 데이터 로드
# ================================
df = pd.read_csv(DATA_PATH)
print(f"shape: {df.shape}")
print(f"지방간 단계 분포:\n{df['지방간단계'].value_counts().sort_index()}")

TARGET = "지방간단계"
ALCOHOL_COLS = ["음주여부", "1회음주량", "주당음주빈도", "월폭음빈도"]
X = df.drop(columns=[TARGET, "지방간단계명"] + ALCOHOL_COLS)
y = df[TARGET]

# ================================
# 피처 정의 및 전처리기 (음주 피처 제거 — Sick Quitter Effect)
# ================================
NUMERIC_FEATURES = ["나이", "키", "몸무게", "BMI", "허리둘레",
                    "주당운동횟수"]
BINARY_FEATURES  = ["성별", "흡연여부",
                    "당뇨진단여부", "고혈압진단여부", "수면장애여부",
                    "간질환진단여부"]
ORDINAL_FEATURES = ["식습관자가평가"]

preprocessor = ColumnTransformer(transformers=[
    ("num", StandardScaler(), NUMERIC_FEATURES),
    ("bin", OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1), BINARY_FEATURES),
    ("ord", OrdinalEncoder(
        categories=[["매우나쁨", "나쁨", "보통", "좋음", "매우좋음"]],
        handle_unknown="use_encoded_value", unknown_value=-1
    ), ORDINAL_FEATURES),
])

# ================================
# Train / Test split
# ================================
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"\nTrain: {X_train.shape}, Test: {X_test.shape}")

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

# ================================
# Optuna 하이퍼파라미터 튜닝 (best_params.json 없을 때만)
# ================================
PARAMS_PATH = os.path.join(MODEL_DIR, "best_params.json")

def make_pipeline(classifier):
    return ImbPipeline([
        ("preprocessor", preprocessor),
        ("smote", SMOTE(random_state=42)),
        ("classifier", classifier),
    ])

def cv_f1(pipeline, X, y, cv):
    scores = cross_val_score(pipeline, X, y, cv=cv, scoring="f1_macro", n_jobs=-1)
    return scores.mean()

if os.path.exists(PARAMS_PATH):
    with open(PARAMS_PATH) as f:
        best_params = json.load(f)
    print(f"\nbest_params.json 로드 완료 → 튜닝 스킵")
    best_rf   = best_params["RandomForest"]
    best_xgb  = best_params["XGBoost"]
    best_lgbm = best_params["LightGBM"]
else:
    N_TRIALS = 30

    def run_study(name, objective):
        study = optuna.create_study(direction="maximize")
        with tqdm(total=N_TRIALS, desc=f"[Optuna] {name}", unit="trial") as pbar:
            def callback(study, _trial):
                pbar.update(1)
                pbar.set_postfix({"best_f1": f"{study.best_value:.4f}"})
            study.optimize(objective, n_trials=N_TRIALS, callbacks=[callback])
        print(f"{name} best F1: {study.best_value:.4f} | params: {study.best_params}")
        return study.best_params

    def objective_rf(trial):
        clf = RandomForestClassifier(
            n_estimators=trial.suggest_int("n_estimators", 100, 400),
            max_depth=trial.suggest_int("max_depth", 5, 20),
            min_samples_split=trial.suggest_int("min_samples_split", 2, 10),
            min_samples_leaf=trial.suggest_int("min_samples_leaf", 1, 5),
            random_state=42, n_jobs=-1,
        )
        return cv_f1(make_pipeline(clf), X_train, y_train, cv)

    def objective_xgb(trial):
        clf = XGBClassifier(
            n_estimators=trial.suggest_int("n_estimators", 100, 500),
            max_depth=trial.suggest_int("max_depth", 3, 10),
            learning_rate=trial.suggest_float("learning_rate", 0.01, 0.3, log=True),
            subsample=trial.suggest_float("subsample", 0.6, 1.0),
            colsample_bytree=trial.suggest_float("colsample_bytree", 0.6, 1.0),
            min_child_weight=trial.suggest_int("min_child_weight", 1, 10),
            random_state=42, eval_metric="mlogloss", verbosity=0,
        )
        return cv_f1(make_pipeline(clf), X_train, y_train, cv)

    def objective_lgbm(trial):
        clf = LGBMClassifier(
            n_estimators=trial.suggest_int("n_estimators", 100, 500),
            max_depth=trial.suggest_int("max_depth", 3, 10),
            learning_rate=trial.suggest_float("learning_rate", 0.01, 0.3, log=True),
            num_leaves=trial.suggest_int("num_leaves", 20, 100),
            subsample=trial.suggest_float("subsample", 0.6, 1.0),
            colsample_bytree=trial.suggest_float("colsample_bytree", 0.6, 1.0),
            random_state=42, verbosity=-1,
        )
        return cv_f1(make_pipeline(clf), X_train, y_train, cv)

    best_rf   = run_study("RandomForest", objective_rf)
    best_xgb  = run_study("XGBoost",     objective_xgb)
    best_lgbm = run_study("LightGBM",    objective_lgbm)

    best_params = {"RandomForest": best_rf, "XGBoost": best_xgb, "LightGBM": best_lgbm}
    with open(PARAMS_PATH, "w") as f:
        json.dump(best_params, f, indent=4, ensure_ascii=False)
    print("\nbest_params.json 저장 완료")

# ================================
# 최종 Stacking 모델 학습
# ================================
print("\n[학습] 최종 Stacking 모델 학습 중...")

rf_pipe   = ImbPipeline([("preprocessor", preprocessor), ("smote", SMOTE(random_state=42)), ("classifier", RandomForestClassifier(**best_rf, random_state=42, n_jobs=-1))])
xgb_pipe  = ImbPipeline([("preprocessor", preprocessor), ("smote", SMOTE(random_state=42)), ("classifier", XGBClassifier(**best_xgb, random_state=42, eval_metric="mlogloss", verbosity=0))])
lgbm_pipe = ImbPipeline([("preprocessor", preprocessor), ("smote", SMOTE(random_state=42)), ("classifier", LGBMClassifier(**best_lgbm, random_state=42, verbosity=-1))])

stacking = StackingClassifier(
    estimators=[("rf", rf_pipe), ("xgb", xgb_pipe), ("lgbm", lgbm_pipe)],
    final_estimator=LogisticRegression(max_iter=1000, random_state=42),
    cv=5,
    passthrough=False,
    n_jobs=-1,
)

_done = False

def _progress():
    with tqdm(bar_format="{desc} {elapsed}", desc="[학습] Stacking 진행 중...") as pbar:
        while not _done:
            time.sleep(0.5)
            pbar.update(0)
        pbar.set_description("[학습] Stacking 완료")

t = threading.Thread(target=_progress, daemon=True)
t.start()
t0 = time.time()
stacking.fit(X_train, y_train)
_done = True
t.join()
elapsed = time.time() - t0
print(f"학습 시간: {elapsed:.1f}초")

# ================================
# 테스트 성능 출력
# ================================
y_pred = stacking.predict(X_test)
acc  = accuracy_score(y_test, y_pred)
f1   = f1_score(y_test, y_pred, average="macro")
risk_recall = recall_score(y_test, y_pred, labels=[2, 3], average="macro")

print(f"\n[결과] Stacking")
print(f"  Accuracy     : {acc:.4f}")
print(f"  F1 (macro)   : {f1:.4f}")
print(f"  Risk Recall  : {risk_recall:.4f}  (중등도+중증)")


# ================================
# 모델 저장
# ================================
model_path = os.path.join(MODEL_DIR, "fatty_liver_model.pkl")
joblib.dump(stacking, model_path)
print(f"\n모델 저장 완료: {model_path}")
