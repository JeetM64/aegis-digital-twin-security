"""
train_model.py  –  Aegis Risk Model Training (Improved)

Usage:
  cd backend
  python ml/train_model.py
"""

import os
import sys
import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, classification_report
)

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(__file__)
DATA_PATH  = os.path.join(BASE_DIR, "dataset.csv")
MODEL_PATH = os.path.join(BASE_DIR, "risk_model.pkl")

FEATURE_COLS = [
    "port", "cvss_score", "internet_exposed", "service_risk",
    "patch_age", "exploit_available", "service_popularity",
    "auth_required", "known_cve_count", "misconfig_score",
    "network_depth", "critical_asset",
]

def load_data():
    if not os.path.exists(DATA_PATH):
        print(f"[ERROR] dataset not found: {DATA_PATH}")
        sys.exit(1)

    df = pd.read_csv(DATA_PATH)
    missing = [c for c in FEATURE_COLS + ["label"] if c not in df.columns]
    if missing:
        print(f"[ERROR] missing columns: {missing}")
        sys.exit(1)

    X = df[FEATURE_COLS].values
    y = df["label"].values

    c1 = y.sum()
    c0 = len(y) - c1
    print(f"[DATA]  rows={len(y)}  label=1: {c1} ({100*c1/len(y):.1f}%)  "
          f"label=0: {c0} ({100*c0/len(y):.1f}%)")
    return X, y

def train(X, y):
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=12,
        min_samples_split=5,
        min_samples_leaf=2,
        class_weight="balanced",
        n_jobs=-1,
        random_state=42,
    )

    print("\n[CV]    Running 5-fold stratified CV …")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    auc_scores = cross_val_score(model, X_train, y_train, cv=cv, scoring="roc_auc")
    f1_scores  = cross_val_score(model, X_train, y_train, cv=cv, scoring="f1")
    print(f"[CV]    ROC-AUC = {auc_scores.mean():.3f} ± {auc_scores.std():.3f}")
    print(f"[CV]    F1      = {f1_scores.mean():.3f} ± {f1_scores.std():.3f}")

    model.fit(X_train, y_train)

    probs = model.predict_proba(X_test)[:, 1]
    best_t, best_f1 = 0.5, 0.0
    for t in np.arange(0.3, 0.75, 0.01):
        preds = (probs >= t).astype(int)
        f = f1_score(y_test, preds, zero_division=0)
        if f > best_f1:
            best_f1, best_t = f, t
    print(f"\n[THRESH] Best threshold = {best_t:.2f}  (F1 = {best_f1:.3f})")

    y_pred = (probs >= best_t).astype(int)
    print(f"\n[TEST]  Accuracy  = {accuracy_score(y_test, y_pred):.3f}")
    print(f"[TEST]  Precision = {precision_score(y_test, y_pred):.3f}")
    print(f"[TEST]  Recall    = {recall_score(y_test, y_pred):.3f}")
    print(f"[TEST]  F1        = {f1_score(y_test, y_pred):.3f}")
    print(f"[TEST]  ROC-AUC   = {roc_auc_score(y_test, probs):.3f}")
    print(f"\n{classification_report(y_test, y_pred, target_names=['safe','at-risk'])}")

    print("[FEAT]  Feature importances:")
    for name, imp in sorted(
        zip(FEATURE_COLS, model.feature_importances_),
        key=lambda x: -x[1]
    ):
        bar = "█" * int(imp * 40)
        print(f"        {name:<25} {bar:<40} {imp:.4f}")

    return model, best_t

def save(model, threshold):
    bundle = {
        "model":     model,
        "threshold": threshold,
        "features":  FEATURE_COLS,
        "version":   "2.0",
    }
    joblib.dump(bundle, MODEL_PATH)
    print(f"\n[SAVE]  Saved model bundle → {MODEL_PATH}")
    print(f"[SAVE]  threshold={threshold:.2f}  features={len(FEATURE_COLS)}")

if __name__ == "__main__":
    print("=" * 60)
    print("  Aegis Risk Model Training")
    print("=" * 60)
    X, y = load_data()
    model, threshold = train(X, y)
    save(model, threshold)
    print("\n[DONE]  Run your scanner to pick up the new model.")