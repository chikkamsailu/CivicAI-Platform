# CivicAI

> **AI-Powered Civic Issue Reporting & Resolution Platform**  
> Universal municipal and institutional intelligence for cities, universities, schools, workplaces, and public healthcare facilities.

---

## 🏛 Vision & Overview

CivicAI reimagines civic reporting by breaking beyond ordinary pothole and streetlight trackers. It provides a single, cohesive, production-grade platform connecting citizens, students, faculty, and corporate employees directly with responsible maintenance units and automated spatial telemetry.

### One Universal Platform For:
* **Public Municipal Roads & Infrastructure**: Potholes, road cave-ins, traffic signs, missing manhole covers, storm drainage.
* **Schools & Educational Campuses**: Broken classroom equipment, safety wall cracks, playground hazards, restroom sanitation.
* **Colleges & Universities**: Laboratory gas pipeline monitoring, lecture hall electrical hazards, library HVAC, hostel amenities.
* **Corporate Offices & Tech Parks**: IT server room HVAC leaks, elevator safety sensors, fire sprinkler inspections.
* **Hospitals & Municipal Facilities**: Ambulance bay drainage grates, biomedical staging hygiene, clinic ramps.

---

## 🧠 Real Machine Learning Architecture (Scikit-Learn)

CivicAI does not use mock AI or static mockups. All machine learning workflows are powered by active Python Scikit-Learn models:

1. **TF-IDF Category Classification (`backend/ai/classifier.py`)**:
   - Calibrated TF-IDF vectorizer + LogisticRegression trained on diversified civic and institutional reports.
   - Automatically outputs predicted category and statistical confidence.

2. **Risk-Weighted Priority Prediction (`backend/ai/priority.py`)**:
   - ML priority categorization combined with immediate hazard pattern detection (live wires, sparking, structural collapse, gas leaks, hospital and school zone elevation).
   - Generates human-readable diagnostic explanations for administrators.

3. **Hybrid Spatial & Text Duplicate Detection (`backend/ai/duplicate.py`)**:
   - Real-time Haversine great-circle distance filtering combined with TF-IDF cosine text similarity against active tickets.
   - Flags potential duplicates to prevent redundant dispatch while compounding priority.

4. **Workload-Aware Team Recommendation (`backend/ai/recommender.py`)**:
   - Matches issue category, institutional context, and geographic ward.
   - Ranks available field squads while balancing live active workload capacity to prevent bottlenecking.

5. **AI Insights & Geo-Clustering Engine (`backend/ai/insights.py`)**:
   - Ward density hotspot risk scoring (`Critical × 3.5 + High × 2 + Medium × 1`).
   - SLA turnaround benchmarking and actionable operational advisories.

---

## 🎨 Sophisticated Pastel Civic-Tech Design System

CivicAI adopts a warm, editorial, pastel civic-tech identity:
- **Warm Off-White & Soft Ivory**: `#FAF9F6`, `#F3F6F4`
- **Soft Sage & Mint**: `#448974`, `#35705E`, `#E1EDE6`
- **Muted Teal**: `#26717C`, `#1D5861`
- **Deep Navy Contrast**: `#111D2B`, `#192A3E`
- **Functional Accents**: Coral (`#E05D44`) for Critical alerts, Amber (`#E59A26`) for High warnings.
- **Dynamic Wave Flow Canvas**: Subtle continuous sine waves symbolizing `Report → AI → Action → Resolution`.
- **Responsive & Touch-Friendly**: Mobile-first citizen reporting with interactive Leaflet GPS pin-drop.

---

## 🚀 Quick Start

### 1. Requirements
Ensure Python 3.10+ is installed.

### 2. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 3. Launch Application
```powershell
python run.py
```

Open your browser at:
- **Portal**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **API Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 🧪 Automated Test Suite

Run the full automated Pytest test suite:
```powershell
python -m pytest tests/ -v
```

Tests verify:
- Scikit-Learn TF-IDF issue classification & confidence scoring
- Risk-weighted priority prediction & hazard pattern detection
- Spatial Haversine distance & text cosine duplicate detection
- Field team recommendation & workload balancing
- Full REST API CRUD & ticket tracking
- End-to-end resolution lifecycle: Report → AI Analyze → Assign → In Progress → Resolve with Proof Photo & Inventory Consumption.

---

## 📁 Project Architecture

```
CivicAI-New/
├── backend/
│   ├── app.py                     # FastAPI application & static mounts
│   ├── database.py                # SQLAlchemy SQLite session lifecycle
│   ├── models/                    # Complaint, Institution, FieldTeam, InventoryItem, AuditLog
│   ├── schemas/                   # Pydantic schemas with ConfigDict
│   ├── ai/                        # Scikit-Learn classifiers, priority, duplicate, recommender, insights
│   ├── api/                       # REST endpoints (complaints, ai, institutions, field_ops, inventory, gis)
│   ├── seed_data.py               # Realistic municipal & campus seeding
│   └── static/uploads/            # Issue and resolution photo evidence
├── frontend/
│   ├── index.html                 # Single-page application markup
│   ├── css/                       # main.css, animations.css, responsive.css
│   ├── js/                        # app.js, report.js, track.js, map.js, institutions.js, field_ops.js, inventory.js, dashboard.js
│   └── assets/                    # Photorealistic civic hero & evidence imagery
├── tests/                         # Pytest test suite
├── requirements.txt
├── run.py                         # One-click launch runner
└── README.md
```
