from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Complaint, FieldTeam, Institution
from backend.schemas import AIPreAnalyzeRequest, AIPreAnalyzeResponse
from backend.ai import classifier, priority_predictor, duplicate_detector, team_recommender, ai_insights

router = APIRouter(prefix="/api/ai", tags=["AI Intelligence"])

@router.post("/pre-analyze", response_model=AIPreAnalyzeResponse)
def pre_analyze_issue(
    payload: AIPreAnalyzeRequest,
    db: Session = Depends(get_db)
):
    """
    Real-time interactive AI pre-analysis invoked as the citizen/user types their report.
    Returns predicted category, estimated priority with rationale, duplicate check, and team recommendation.
    """
    text_corpus = f"{payload.title} {payload.description}".strip()
    
    # 1. Category Prediction
    pred_cat, cat_conf = classifier.predict(text_corpus)

    # 2. Priority Prediction
    pred_priority, priority_reason = priority_predictor.predict(
        text_corpus,
        category=pred_cat,
        location_type=payload.location_type or "Public / Community"
    )

    # 3. Duplicate Detection against open issues
    active_complaints = db.query(Complaint).filter(Complaint.status.notin_(["Resolved", "Verified"])).all()
    is_dup, dup_id, dup_sim, dup_reason = duplicate_detector.check_duplicate(
        new_title=payload.title,
        new_desc=payload.description,
        new_lat=payload.latitude or 0.0,
        new_lng=payload.longitude or 0.0,
        new_category=pred_cat,
        new_institution_id=None,
        existing_complaints=active_complaints
    )

    # 4. Team Recommendation
    all_teams = db.query(FieldTeam).all()
    rec_team_id, rec_team_name, _ = team_recommender.recommend_team(
        category=pred_cat,
        location_type=payload.location_type or "Public / Community",
        ward=payload.ward or "",
        teams=all_teams
    )

    return AIPreAnalyzeResponse(
        predicted_category=pred_cat,
        category_confidence=cat_conf,
        predicted_priority=pred_priority,
        priority_reason=priority_reason,
        recommended_team=rec_team_name,
        recommended_team_id=rec_team_id,
        potential_duplicate=is_dup,
        duplicate_ticket_id=dup_id,
        duplicate_similarity=dup_sim
    )

@router.get("/insights")
def get_ai_insights(db: Session = Depends(get_db)):
    """
    Aggregated civic intelligence, ward hotspot clustering, category and priority distribution,
    and automated operational insights.
    """
    complaints = db.query(Complaint).all()
    institutions = db.query(Institution).all()
    return ai_insights.generate_insights(complaints, institutions)
