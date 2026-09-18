"""
CivicAI Platform - Launch Runner
Initializes database, trains AI models, seeds realistic municipal data, and starts dev server.
"""

import os
import sys
import uvicorn
from backend.database import engine, Base
from backend.seed_data import seed_database
from backend.ai import classifier, priority_predictor

def main():
    print("=" * 65)
    print("               CIVICAI PLATFORM INITIALIZATION")
    print("   AI-Powered Civic Issue Reporting & Resolution Platform")
    print("=" * 65)

    # 1. Initialize Tables & Database
    print("[1/3] Checking database schema & seeding initial dataset...")
    Base.metadata.create_all(bind=engine)
    seed_database()

    # 2. Verify AI Models
    print("[2/3] Verifying Scikit-Learn models...")
    sample_cat, sample_conf = classifier.predict("Deep crater pothole on main road")
    sample_pri, _ = priority_predictor.predict("Live wire sparking near school gate")
    print(f"      • Issue Classifier: Active (Tested: '{sample_cat}', {int(sample_conf*100)}% conf)")
    print(f"      • Priority Predictor: Active (Tested: '{sample_pri}')")

    # 3. Start Web Server
    print("[3/3] Launching FastAPI Web Application...")
    print("      • Portal URL: http://127.0.0.1:8000")
    print("      • OpenAPI Docs: http://127.0.0.1:8000/docs")
    print("=" * 65)

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.app:app", host="0.0.0.0", port=port, reload=False)

if __name__ == "__main__":
    main()
