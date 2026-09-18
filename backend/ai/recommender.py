from typing import List, Optional, Tuple, Dict, Any

CATEGORY_DEPARTMENT_MAP = {
    'Roads & Potholes': ['Roads & Potholes', 'Civil & Infrastructure'],
    'Garbage & Waste': ['Solid Waste Management', 'Sanitation Taskforce'],
    'Drainage & Sewage': ['Water & Sanitation Squad', 'Drainage Engineering'],
    'Water Supply': ['Water & Sanitation Squad', 'Municipal Water Works'],
    'Electrical': ['Electrical & Grid Ops', 'Power Infrastructure'],
    'Streetlights': ['Electrical & Grid Ops', 'Street Lighting Division'],
    'Public Infrastructure': ['Civil & Infrastructure', 'Public Works'],
    'Traffic & Road Signs': ['Traffic & Transit Management', 'Civil & Infrastructure'],
    'Parks & Public Spaces': ['Horticulture & Public Spaces', 'Civil & Infrastructure'],
    'School Issues': ['Institutional Facilities Unit', 'Civil & Infrastructure', 'Electrical & Grid Ops'],
    'College Issues': ['Institutional Facilities Unit', 'Campus Maintenance Squad', 'Electrical & Grid Ops'],
    'Office/Workplace Issues': ['Institutional Facilities Unit', 'Facility Engineering'],
    'Sanitation': ['Sanitation Taskforce', 'Solid Waste Management']
}

class TeamRecommender:
    def recommend_team(
        self,
        category: str,
        location_type: str,
        ward: str,
        teams: List[Any]
    ) -> Tuple[Optional[str], Optional[str], str]:
        """
        Ranks field teams by category specialization, location/zone affinity, and current workload.
        Returns: (team_id, team_name, recommendation_rationale)
        """
        if not teams:
            return None, None, "No active field teams registered in database"

        target_departments = CATEGORY_DEPARTMENT_MAP.get(category, ['General Civic Maintenance'])
        is_institution = location_type in ['School', 'College / University', 'Office / Workplace', 'Hospital', 'Public Institution']

        scored_teams = []

        for team in teams:
            team_id = getattr(team, 'id', '')
            team_name = getattr(team, 'name', '')
            dept = getattr(team, 'department', '')
            specialization = getattr(team, 'specialization', '')
            zone = getattr(team, 'assigned_zone', '')
            active_load = getattr(team, 'active_workload', 0)
            max_cap = getattr(team, 'max_capacity', 10)
            status = getattr(team, 'status', 'Active')

            score = 0.0

            # 1. Department match
            if dept in target_departments:
                # Primary department match
                rank_idx = target_departments.index(dept)
                score += 50.0 - (rank_idx * 10.0)
            elif any(d.lower() in specialization.lower() for d in target_departments):
                score += 30.0

            # 2. Institutional Specialization Bonus
            if is_institution and ('Institutional' in dept or 'Campus' in dept or 'Facility' in dept or 'Facility' in specialization):
                score += 25.0

            # 3. Zone Match
            if ward and zone and (zone.lower() in ward.lower() or ward.lower() in zone.lower() or zone == 'City-Wide'):
                score += 20.0

            # 4. Workload Availability & Load Balancing
            capacity_remaining = max(0, max_cap - active_load)
            load_ratio = active_load / max(1, max_cap)
            
            # Heavy penalty if over capacity
            if active_load >= max_cap:
                score -= 40.0
            else:
                score += (1.0 - load_ratio) * 25.0

            # Status availability
            if status != 'Active' and status != 'On Field':
                score -= 50.0

            scored_teams.append((score, team, capacity_remaining))

        scored_teams.sort(key=lambda x: x[0], reverse=True)
        best_score, best_team, remaining = scored_teams[0]

        reason = (
            f"Recommended '{best_team.name}' based on department match ({best_team.department}), "
            f"specialization in {best_team.specialization}, and available capacity ({remaining} slots free)."
        )

        return best_team.id, best_team.name, reason

team_recommender = TeamRecommender()
