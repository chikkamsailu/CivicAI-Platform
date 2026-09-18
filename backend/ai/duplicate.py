import math
from typing import List, Optional, Tuple, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two points in meters."""
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

class DuplicateDetector:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words='english')

    def check_duplicate(
        self,
        new_title: str,
        new_desc: str,
        new_lat: float,
        new_lng: float,
        new_category: str,
        new_institution_id: Optional[str],
        existing_complaints: List[Any]
    ) -> Tuple[bool, Optional[str], float, str]:
        """
        Compares new issue against active issues.
        Returns: (is_duplicate, matching_id, similarity_score, reason)
        """
        if not existing_complaints:
            return False, None, 0.0, "No existing complaints to compare against"

        new_text = f"{new_title} {new_desc}".strip().lower()
        candidates = []

        # Filter candidates by geographic or institutional proximity first
        for item in existing_complaints:
            # Skip resolved or closed complaints if needed, or check status
            status = getattr(item, 'status', 'Open')
            if status in ['Resolved', 'Verified']:
                continue

            item_lat = getattr(item, 'latitude', None)
            item_lng = getattr(item, 'longitude', None)
            item_inst = getattr(item, 'institution_id', None)
            item_id = getattr(item, 'id', str(getattr(item, 'complaint_id', '')))

            dist = None
            if item_lat is not None and item_lng is not None and new_lat and new_lng:
                dist = haversine_distance(new_lat, new_lng, item_lat, item_lng)

            # Check eligibility: within 500m or same institution
            is_geo_near = (dist is not None and dist <= 500.0)
            is_same_inst = (new_institution_id and item_inst and new_institution_id == item_inst)

            if is_geo_near or is_same_inst or (new_category and getattr(item, 'category', '') == new_category):
                candidates.append((item, dist, is_same_inst))

        if not candidates:
            return False, None, 0.0, "No nearby or same-category open complaints found"

        # TF-IDF Cosine Similarity on candidate texts
        corpus = [new_text] + [f"{getattr(c[0], 'title', '')} {getattr(c[0], 'description', '')}".strip().lower() for c in candidates]
        
        try:
            tfidf_matrix = self.vectorizer.fit_transform(corpus)
            similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:])[0]
        except Exception:
            return False, None, 0.0, "Similarity calculation error"

        best_score = 0.0
        best_match_id = None
        best_reason = ""

        for idx, (candidate_item, dist, is_same_inst) in enumerate(candidates):
            sim = float(similarities[idx])
            cat_match = getattr(candidate_item, 'category', '') == new_category

            # Heuristics for duplicate classification
            is_dup = False
            reason = ""

            if is_same_inst and sim >= 0.50:
                is_dup = True
                reason = f"Duplicate detected within same institution ({round(sim * 100)}% text similarity)"
            elif dist is not None and dist <= 150.0 and sim >= 0.40:
                is_dup = True
                reason = f"Duplicate detected within {int(dist)}m radius ({round(sim * 100)}% text match)"
            elif dist is not None and dist <= 300.0 and cat_match and sim >= 0.50:
                is_dup = True
                reason = f"Matching {new_category} issue within {int(dist)}m radius ({round(sim * 100)}% similarity)"
            elif sim >= 0.85:
                is_dup = True
                reason = f"Extremely high textual similarity ({round(sim * 100)}% match)"

            if is_dup and sim > best_score:
                best_score = sim
                best_match_id = getattr(candidate_item, 'id', None)
                best_reason = reason

        if best_match_id:
            return True, best_match_id, round(best_score, 3), best_reason

        max_sim = float(max(similarities)) if len(similarities) > 0 else 0.0
        return False, None, round(max_sim, 3), "No duplicate threshold exceeded"

duplicate_detector = DuplicateDetector()
