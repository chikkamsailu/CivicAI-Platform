import os
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from backend.ai.dataset import TRAINING_DATA

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'issue_classifier.joblib')

class IssueClassifier:
    def __init__(self):
        self.model = None
        self._load_or_train()

    def _build_pipeline(self):
        return Pipeline([
            ('tfidf', TfidfVectorizer(ngram_range=(1, 2), min_df=1, sublinear_tf=True)),
            ('clf', LogisticRegression(max_iter=1000, C=2.0, class_weight='balanced'))
        ])

    def train(self, data=None):
        data = data or TRAINING_DATA
        X = [item[0] for item in data]
        y = [item[1] for item in data]

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

    def predict(self, text: str):
        if not text or not text.strip():
            return 'Other', 0.5

        if self.model is None:
            self._load_or_train()

        clean_text = text.strip()
        category = self.model.predict([clean_text])[0]
        
        # Calculate confidence from predict_proba
        try:
            probs = self.model.predict_proba([clean_text])[0]
            confidence = float(max(probs))
        except Exception:
            confidence = 0.85

        return category, round(confidence, 3)

# Global singleton
classifier = IssueClassifier()
