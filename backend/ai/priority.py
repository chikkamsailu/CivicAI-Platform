import os
import joblib
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from backend.ai.dataset import TRAINING_DATA

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'priority_model.joblib')

CRITICAL_TERMS = [
    'live wire', 'sparking', 'spark', 'gas leak', 'cylinder', 'burst', 'collapse',
    'open manhole', 'cave-in', 'deep crater', 'toxic', 'carcass', 'fire', 'icu',
    'falling plaster', 'electrocution', 'blood', 'biological fluid', 'near collision'
]

HIGH_TERMS = [
    'no water', 'dark', 'blackout', 'choked', 'flooding', 'overflowing', 'overflow',
    'broken swing', 'steep', 'loose handrail', 'accident', 'debris', 'geyser steam',
    'leaking water', 'overheating', 'tripping', 'foul smell'
]

class PriorityPredictor:
    def __init__(self):
        self.model = None
        self._load_or_train()

    def _build_pipeline(self):
        return Pipeline([
            ('tfidf', TfidfVectorizer(ngram_range=(1, 2), min_df=1)),
            ('clf', LogisticRegression(max_iter=1000, C=1.5, class_weight='balanced'))
        ])

    def train(self, data=None):
        data = data or TRAINING_DATA
        X = [item[0] for item in data]
        y = [item[2] for item in data]

        self.model = self._build_pipeline()
        self.model.fit(X, y)
        self.save()
        return self

    def save(self, path=MODEL_PATH):
        if self.model is not None:
            joblib.dump(self.model, path)

    def _load_or_train(self):
        if os.path.exists(MODEL_PATH):
            try:
                self.model = joblib.load(MODEL_PATH)
                return
            except Exception:
                pass
        self.train()

    def predict(self, text: str, category: str = '', location_type: str = ''):
        if not text or not text.strip():
            return 'Medium', 'Default priority assigned for general submission'

        text_lower = text.lower()

        # Rule 1: Immediate Safety & Hazard Scanning
        for term in CRITICAL_TERMS:
            if re.search(r'\b' + re.escape(term) + r'\b', text_lower):
                return 'Critical', f'Critical safety risk detected: matched hazard pattern "{term}"'

        # Rule 2: Institutional Vulnerability Elevation
        is_sensitive_institution = location_type in ['School', 'College / University', 'Hospital']
        if is_sensitive_institution:
            if category in ['Electrical', 'Sanitation', 'School Issues', 'College Issues', 'Drainage & Sewage']:
                for term in HIGH_TERMS:
                    if term in text_lower:
                        return 'Critical', f'Elevated to Critical due to safety impact at {location_type}'

        # Rule 3: High disruption keywords
        for term in HIGH_TERMS:
            if term in text_lower:
                return 'High', f'High operational disruption detected: matched pattern "{term}"'

        # Rule 4: ML Prediction Fallback / Confirmation
        if self.model is None:
            self._load_or_train()

        ml_pred = self.model.predict([text.strip()])[0]
        
        reasons = {
            'Critical': 'ML model classified issue as critical risk based on historical civic patterns',
            'High': 'ML model classified issue as high urgency requiring priority dispatch',
            'Medium': 'Standard maintenance requirement without imminent public hazard',
            'Low': 'Routine cosmetic or non-blocking maintenance request'
        }

        return ml_pred, reasons.get(ml_pred, 'Automated priority classification')

# Global singleton
priority_predictor = PriorityPredictor()
