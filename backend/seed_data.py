import random
from datetime import datetime, timedelta
from backend.database import SessionLocal, Base, engine
from backend.models import Institution, FieldTeam, InventoryItem, MaterialConsumption, Complaint, AuditLog
from backend.ai import classifier, priority_predictor, team_recommender

INSTITUTIONS = [
    ('INST-001', 'National Institute of Engineering & Technology', 'College / University', 'Ward 4 - Indiranagar', '100ft Road, HAL 2nd Stage', 12.9719, 77.6412, 'Prof. Rajesh Kulkarni', 'facilities@niet.edu.in', '+91 80 2528 1100'),
    ('INST-002', 'St. Xavier Public Senior Secondary School', 'School', 'Ward 7 - Koramangala', '8th Main, 4th Block', 12.9352, 77.6245, 'Sister Mary Teresa', 'admin@stxavierschool.org', '+91 80 2553 4422'),
    ('INST-003', 'City Central Multispecialty Hospital', 'Hospital', 'Ward 2 - Malleshwaram', 'Sampige Road, 15th Cross', 12.9982, 77.5714, 'Dr. Arvind Varma', 'superintendent@cityhospital.gov.in', '+91 80 2334 9900'),
    ('INST-004', 'Apex Global Technology Park - Campus 3', 'Office / Workplace', 'Ward 11 - Whitefield', 'ITPL Main Road', 12.9863, 77.7305, 'Gaurav Mehta', 'facility@globaltech.com', '+91 80 4129 8800'),
    ('INST-005', 'Indira Gandhi Memorial Girls High School', 'School', 'Ward 5 - Jayanagar', '11th Main, 4th T Block', 12.9250, 77.5938, 'Mrs. Shailaja Hegde', 'igm.highschool@karnataka.gov.in', '+91 80 2663 1188'),
    ('INST-006', 'Metropolitan Transit Operations Terminal', 'Municipal Facility', 'Ward 1 - Majestic', 'Platform Road, Majestic Central', 12.9774, 77.5729, 'K. Narayanaswamy', 'transit.central@citytransit.gov.in', '+91 80 2287 4300'),
    ('INST-007', 'Vidya Vardhaka Law & Arts College', 'College / University', 'Ward 9 - Rajajinagar', 'Dr. Rajkumar Road', 12.9915, 77.5552, 'Dr. B. K. Ramanathan', 'admin@vvlawcollege.ac.in', '+91 80 2312 7744'),
    ('INST-008', 'Civic Technology & Innovation Hub', 'Office / Workplace', 'Ward 3 - HSR Layout', '27th Main Road, Sector 1', 12.9116, 77.6499, 'Ananya Sen', 'support@civictechhub.org', '+91 80 4950 3311')
]

TEAMS = [
    ('TEAM-RDS', 'Rapid Road Maintenance Squad', 'Roads & Potholes', 'Ramesh Sharma', '+91 98450 11201', 'City-Wide', 'Asphalt, Cold-Mix Pothole Patching & Pavements', 4, 10),
    ('TEAM-ELE', 'Electrical & Streetlight Division', 'Electrical & Grid Ops', 'Priya Varma', '+91 98450 22302', 'City-Wide', 'Smart LED Fixtures, High-Tension Cables & Transformers', 5, 10),
    ('TEAM-WAT', 'Water Supply & Drainage Taskforce', 'Water & Sanitation Squad', 'Mohan Kumar', '+91 98450 33403', 'City-Wide', 'Underground Pipeline Burst Repair, Sewer Clearance & Valves', 3, 10),
    ('TEAM-SWM', 'Solid Waste & Sanitation Wing', 'Solid Waste Management', 'Anil Deshmukh', '+91 98450 44504', 'City-Wide', 'Dumpster Clearance, Chemical Sanitization & Blackspot Removal', 2, 10),
    ('TEAM-CIV', 'Civil Infrastructure & Public Works', 'Civil & Infrastructure', 'Suresh Patil', '+91 98450 55605', 'City-Wide', 'Bridges, Safety Barriers, Road Signs, Parks & Footpaths', 3, 10),
    ('TEAM-INS', 'Institutional Facilities Response Unit', 'Institutional Facilities Unit', 'Deepa Nair', '+91 98450 66706', 'City-Wide', 'Classroom Equipment, Educational Safety, Lab Infrastructure & HVAC', 4, 10)
]

INVENTORY = [
    ('INV-001', 'Bitumen Cold-Mix Asphalt (50kg Bag)', 'Roads', 'Bags', 140, 30, 450.0, 'In Stock'),
    ('INV-002', '45W High-Lumen Smart LED Streetlight', 'Electrical', 'Pieces', 48, 20, 1850.0, 'In Stock'),
    ('INV-003', '110mm Heavy-Duty PVC Drainage Pipe (6m)', 'Water & Sanitation', 'Meters', 85, 25, 620.0, 'In Stock'),
    ('INV-004', 'Ductile Iron Heavy Manhole Cover 600mm', 'Roads', 'Pieces', 14, 10, 3400.0, 'In Stock'),
    ('INV-005', 'Armored Power Cable 4-Core 16sqmm', 'Electrical', 'Meters', 220, 50, 280.0, 'In Stock'),
    ('INV-006', '1200mm Ceiling Fan High-Speed Motor Kit', 'Institutional', 'Units', 28, 12, 1250.0, 'In Stock'),
    ('INV-007', '2-inch Cast Brass Sluice Valve', 'Water & Sanitation', 'Pieces', 19, 10, 1650.0, 'In Stock'),
    ('INV-008', 'Solar Reflective Cat-Eye Road Studs', 'Roads', 'Pieces', 8, 25, 320.0, 'Low Stock'),
    ('INV-009', 'Concentrated Bio-Enzyme Disinfectant (20L)', 'Sanitation', 'Cans', 35, 15, 890.0, 'In Stock'),
    ('INV-010', 'Interlocking Concrete Paver Blocks (M30)', 'Roads', 'Pieces', 450, 100, 25.0, 'In Stock'),
    ('INV-011', 'Laboratory Gas Flow Regulator & Hose', 'Institutional', 'Sets', 9, 10, 2100.0, 'Low Stock'),
    ('INV-012', '63A 3-Phase Industrial MCB Breaker', 'Electrical', 'Units', 18, 8, 1450.0, 'In Stock'),
    ('INV-013', '6kg ABC Dry Powder Fire Extinguisher', 'Institutional', 'Units', 22, 10, 1750.0, 'In Stock'),
    ('INV-014', 'Cast Iron Drain Grate 300x500mm', 'Water & Sanitation', 'Pieces', 3, 10, 1900.0, 'Critical Reorder')
]

COMPLAINTS_RAW = [
    # id, title, desc, loc_type, inst_id, inst_name, cat, priority, status, lat, lng, addr, landmark, ward, reporter, team_id, c_hrs, r_hrs, res_notes
    ('CIVIC-2026-1001', 'Broken classroom ceiling fan sparking and wobbling violently', 'In Engineering College Block C Lecture Hall 4, center fan motor sparked and vibrates dangerously.', 'College / University', 'INST-001', 'National Institute of Engineering & Technology', 'College Issues', 'Critical', 'In Progress', 12.9719, 77.6412, 'Block C 2nd Floor, NIET Campus', 'Opposite Library', 'Ward 4 - Indiranagar', 'Aditya Rao (Student)', 'TEAM-INS', 6, None, None),
    ('CIVIC-2026-1002', 'Chemistry laboratory gas pipeline valve hiss and leak', 'Chemistry research lab 203 pipeline valve has loose seal causing persistent LPG odor during practicals.', 'College / University', 'INST-001', 'National Institute of Engineering & Technology', 'College Issues', 'Critical', 'Resolved', 12.9723, 77.6418, 'Science Block Ground Floor', 'Near Chemical Shed', 'Ward 4 - Indiranagar', 'Dr. Sunita Sen (Lab Lead)', 'TEAM-INS', 36, 8, 'Emergency valve gasket replaced with high-pressure Teflon seal. Pressure tested to 4 bar.'),
    ('CIVIC-2026-1003', 'Law college library fluorescent lights failure in study bay', 'Four overhead lighting ballasts burnt out in the south reading wing of Vidya Vardhaka Law College library.', 'College / University', 'INST-007', 'Vidya Vardhaka Law & Arts College', 'College Issues', 'Medium', 'Assigned', 12.9915, 77.5552, 'Library Wing, Vidya Vardhaka Campus', 'Near Moot Court', 'Ward 9 - Rajajinagar', 'Siddharth Jain (Student)', 'TEAM-INS', 18, None, None),
    ('CIVIC-2026-1004', 'Girls washroom flush valves broken and sanitation blockage', 'Three toilet stalls in girls junior block at St. Xavier School are choked with wastewater overflow.', 'School', 'INST-002', 'St. Xavier Public Senior Secondary School', 'School Issues', 'Critical', 'In Progress', 12.9352, 77.6245, 'Junior Wing 1st Floor', 'Behind Assembly Ground', 'Ward 7 - Koramangala', 'Sister Mary Teresa (Principal)', 'TEAM-INS', 10, None, None),
    ('CIVIC-2026-1005', 'School playground boundary wall deep structural crack', 'Perimeter brick wall adjacent to primary school swing set developed wide fracture leaning outward.', 'School', 'INST-005', 'Indira Gandhi Memorial Girls High School', 'School Issues', 'Critical', 'Assigned', 12.9250, 77.5938, 'Compound Boundary, IGM School', 'Gate 2 Bus Bay', 'Ward 5 - Jayanagar', 'Mrs. Shailaja Hegde (Headmistress)', 'TEAM-CIV', 14, None, None),
    ('CIVIC-2026-1006', 'Drinking water cooler filter alarm and murky discharge', 'Main corridor drinking water purification station dispensing brownish water with filter service alarm flashing.', 'School', 'INST-002', 'St. Xavier Public Senior Secondary School', 'School Issues', 'High', 'Resolved', 12.9355, 77.6248, 'Corridor A Ground Floor', 'Near Staff Room', 'Ward 7 - Koramangala', 'Rohan Gupta (Teacher)', 'TEAM-INS', 48, 12, 'Replaced 5-micron sediment filter cartridge and UV quartz sleeve. Water TDS 110 ppm.'),
    ('CIVIC-2026-1007', 'Central air conditioning condensation line leaking into server room', 'Condensate pan overflowing in Building 3 Server Room 4B; ceiling tiles soaked and dripping near switch rack.', 'Office / Workplace', 'INST-004', 'Apex Global Technology Park - Campus 3', 'Office/Workplace Issues', 'Critical', 'In Progress', 12.9863, 77.7305, 'Building 3 Floor 4 Server Room 4B', 'Apex Tech Park', 'Ward 11 - Whitefield', 'Karan Singhal (IT Ops)', 'TEAM-INS', 4, None, None),
    ('CIVIC-2026-1008', 'Elevator door safety optical sensor failure', 'Lift #2 in Innovation Hub closing aggressively without detecting passengers passing through doorway.', 'Office / Workplace', 'INST-008', 'Civic Technology & Innovation Hub', 'Office/Workplace Issues', 'High', 'Resolved', 12.9116, 77.6499, 'Main Entrance Lobby, Civic Tech Hub', 'Security Desk', 'Ward 3 - HSR Layout', 'Ananya Sen (Facility Mgr)', 'TEAM-INS', 72, 30, 'Infrared curtain sensor aligned and cleaned. Re-calibrated obstruction sensitivity.'),
    ('CIVIC-2026-1009', 'Hospital emergency ramp drainage grate dislodged', 'Heavy cast iron grate on ambulance entry ramp cracked, leaving an 8-inch tire-trapping void.', 'Hospital', 'INST-003', 'City Central Multispecialty Hospital', 'Public Infrastructure', 'Critical', 'In Progress', 12.9982, 77.5714, 'Emergency Ambulance Bay', 'Gate 1 Drop-off', 'Ward 2 - Malleshwaram', 'Dr. Arvind Varma', 'TEAM-CIV', 5, None, None),
    ('CIVIC-2026-1010', 'Hospital basement waste segregation bay overflow', 'Non-infectious staging zone overwhelmed; municipal waste pickup skipped for 48 hours creating hazard.', 'Hospital', 'INST-003', 'City Central Multispecialty Hospital', 'Sanitation', 'Critical', 'Resolved', 12.9986, 77.5719, 'Sub-basement Dock B2', 'Near Oxygen Plant', 'Ward 2 - Malleshwaram', 'Santosh B. (Hygiene Officer)', 'TEAM-SWM', 28, 6, 'Dedicated compactor cleared backlog. Bay scrubbed with bio-enzyme disinfectant.'),
    ('CIVIC-2026-1011', 'Massive 2-foot deep crater on 100ft road Indiranagar', 'Deep sunken crater right after 12th Main signal on 100ft road causing two-wheelers to skid and swerve dangerously.', 'Public / Community', None, None, 'Roads & Potholes', 'Critical', 'In Progress', 12.9735, 77.6438, '100ft Road near 12th Main', 'Opposite Toit Pub', 'Ward 4 - Indiranagar', 'Vikram Chandra (Citizen)', 'TEAM-RDS', 8, None, None),
    ('CIVIC-2026-1012', 'Sharp edge pothole along Koramangala 80ft road flyover ramp', 'Bitumen collapsed along concrete joint line on flyover descent; exposed rebar scratching vehicle undercarriages.', 'Public / Community', None, None, 'Roads & Potholes', 'High', 'Assigned', 12.9368, 77.6212, '80ft Road Flyover Incline', 'Near Sony Signal', 'Ward 7 - Koramangala', 'Pooja Hegde (Commuter)', 'TEAM-RDS', 15, None, None),
    ('CIVIC-2026-1013', 'Asphalt peeling off residential cross road in Malleshwaram', 'Gravel scattered across 8th Cross road after private water tanker leakage degraded road surface.', 'Public / Community', None, None, 'Roads & Potholes', 'Medium', 'Resolved', 12.9965, 77.5732, '8th Cross Road, Malleshwaram', 'Near Veena Stores', 'Ward 2 - Malleshwaram', 'Gopal Rao (Resident)', 'TEAM-RDS', 60, 18, 'Filled with 12 bags of Bitumen Cold-Mix Asphalt. Roller compacted and edges sealed.'),
    ('CIVIC-2026-1014', 'Sunken telecommunication utility trench across HSR 27th Main', 'Unpaved 1-foot trench cut across entire road width left unpaved with sharp asphalt ridges.', 'Public / Community', None, None, 'Roads & Potholes', 'High', 'Resolved', 12.9125, 77.6521, '27th Main Road Sector 2', 'Near NIFT Campus', 'Ward 3 - HSR Layout', 'Deepak Mittal (Resident)', 'TEAM-RDS', 40, 10, 'Backfilled with wet gravel base and topped with hot-mix asphalt layer.'),
    ('CIVIC-2026-1015', 'Open manhole with missing cover on busy footpath', '600mm stormwater inspection chamber lid missing; pedestrian foot traffic heavy and no barricading.', 'Public / Community', None, None, 'Drainage & Sewage', 'Critical', 'In Progress', 12.9751, 77.5742, 'Subedar Chatram Road', 'Near Central Bus Terminus', 'Ward 1 - Majestic', 'Manjunath S. (Shopkeeper)', 'TEAM-WAT', 3, None, None),
    ('CIVIC-2026-1016', 'Sewage backflow overflowing into residential driveway', 'Underground sanitary sewer choked with plastic debris; foul black water flooding 3 house compounds.', 'Public / Community', None, None, 'Drainage & Sewage', 'Critical', 'Resolved', 12.9234, 77.5912, '14th Main 4th Block Jayanagar', 'Near Cosmopolitan Club', 'Ward 5 - Jayanagar', 'Venkatesh Murthy (Resident)', 'TEAM-WAT', 26, 4, 'High pressure suction jetting unit cleared silt blockage. Sprayed with disinfectant.'),
    ('CIVIC-2026-1017', 'Live 440V overhead electrical wire snapped hanging near school bus stop', 'High tension cable detached from pole arm and dangling 4 feet above wet pavement directly adjacent to bus shelter.', 'Public / Community', None, None, 'Electrical', 'Critical', 'In Progress', 12.9348, 77.6258, '8th Main Road 4th Block', 'Adjacent St Xavier Gate', 'Ward 7 - Koramangala', 'Suresh Gowda (Warden)', 'TEAM-ELE', 2, None, None),
    ('CIVIC-2026-1018', 'Complete darkness as 12 consecutive streetlights failed on Ring Road', 'Entire 400-meter corridor between Indiranagar flyover and Domlur bridge pitch black at night.', 'Public / Community', None, None, 'Streetlights', 'High', 'Assigned', 12.9691, 77.6385, 'Intermediate Ring Road Stretch', 'Near Domlur Loop', 'Ward 4 - Indiranagar', 'Sneha Reddy (Resident)', 'TEAM-ELE', 22, None, None),
    ('CIVIC-2026-1019', 'Smart LED streetlight cycling on/off every 10 seconds', 'Pole #42 LED fixture controller failing, flashing like strobe light outside apartment balconies.', 'Public / Community', None, None, 'Streetlights', 'Low', 'Resolved', 12.9102, 77.6475, '19th Main Sector 1', 'Opposite Sector 1 Park', 'Ward 3 - HSR Layout', 'Harish V. (Resident)', 'TEAM-ELE', 52, 16, 'Replaced faulty LED driver module. Tested continuous illumination.'),
    ('CIVIC-2026-1020', 'Huge overflowing garbage black spot near public primary health clinic', 'Uncollected commercial waste and rotting food remnants accumulating for 4 days attracting stray cattle.', 'Public / Community', None, None, 'Garbage & Waste', 'High', 'In Progress', 12.9928, 77.5582, '10th Main 2nd Stage Rajajinagar', 'Adjacent Urban Health Center', 'Ward 9 - Rajajinagar', 'Meenakshi S. (Resident)', 'TEAM-SWM', 12, None, None),
    ('CIVIC-2026-1021', 'Construction debris and chemical paint containers dumped on footpath', 'Renovation contractor dumped 4 truckloads of broken concrete and open solvent cans blocking sidewalk.', 'Public / Community', None, None, 'Garbage & Waste', 'High', 'Resolved', 12.9842, 77.7289, 'Whitefield Main Road', 'Near Hope Farm Junction', 'Ward 11 - Whitefield', 'Arun Pillai (Citizen)', 'TEAM-SWM', 44, 14, 'Debris loaded onto municipal dumper truck. Area cleaned and sanitized.'),
    ('CIVIC-2026-1022', 'Main 8-inch drinking water feeder pipeline burst gushing water', 'Severe underground joint rupture with high-pressure clean water fountain flooding street.', 'Public / Community', None, None, 'Water Supply', 'Critical', 'In Progress', 12.9275, 77.5962, '33rd Cross 7th Block Jayanagar', 'Near Kanakadasa Circle', 'Ward 5 - Jayanagar', 'Naveen Prasad (Resident)', 'TEAM-WAT', 4, None, None),
    ('CIVIC-2026-1023', 'Traffic signal controller stuck on all-red causing intersection gridlock', 'Signal junction at Indiranagar 100ft & CMH Road frozen on all-way stop; cross traffic blocked.', 'Public / Community', None, None, 'Traffic & Road Signs', 'Critical', 'Resolved', 12.9782, 77.6415, 'CMH Road - 100ft Road Junction', 'Indiranagar Metro', 'Ward 4 - Indiranagar', 'Traffic SI R. Patil', 'TEAM-CIV', 16, 14, 'Solid-state controller logic rebooted and optical sensor cable re-seated.'),
    ('CIVIC-2026-1024', 'Children playground swing snapped with sharp exposed metal edge', 'Steel chain linkage sheared off on heavy swing set in Koramangala park; iron bar hanging loose.', 'Parks & Public Spaces', None, None, 'Parks & Public Spaces', 'High', 'Resolved', 12.9328, 77.6272, 'Koramangala 3rd Block Park', 'Play Area Zone B', 'Ward 7 - Koramangala', 'Anita B. (Parent)', 'TEAM-CIV', 30, 8, 'Installed new galvanized safety chain with protective rubber sleeve.')
]

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if db.query(Institution).count() > 0:
        print('Database already seeded.')
        db.close()
        return

    print('Seeding institutions...')
    for item in INSTITUTIONS:
        db.add(Institution(id=item[0], name=item[1], type=item[2], ward=item[3], address=item[4], latitude=item[5], longitude=item[6], contact_person=item[7], contact_email=item[8], contact_phone=item[9]))
    db.commit()

    print('Seeding field teams...')
    for item in TEAMS:
        db.add(FieldTeam(id=item[0], name=item[1], department=item[2], lead_name=item[3], contact_phone=item[4], assigned_zone=item[5], specialization=item[6], active_workload=item[7], max_capacity=item[8]))
    db.commit()

    print('Seeding inventory...')
    for item in INVENTORY:
        db.add(InventoryItem(id=item[0], name=item[1], category=item[2], unit=item[3], quantity_in_stock=item[4], minimum_threshold=item[5], unit_cost=item[6], status=item[7]))
    db.commit()

    print('Seeding complaints and audit logs...')
    for raw in COMPLAINTS_RAW:
        cid, title, desc, loc_type, inst_id, inst_name, cat, prio, status, lat, lng, addr, lmark, ward, reporter, tid, c_hrs, r_hrs, res_notes = raw
        created_time = datetime.utcnow() - timedelta(hours=c_hrs)
        resolved_time = datetime.utcnow() - timedelta(hours=r_hrs) if r_hrs else None
        
        pred_cat, cat_conf = classifier.predict(f'{title} {desc}')
        pred_pri, pri_reason = priority_predictor.predict(f'{title} {desc}', category=cat, location_type=loc_type)

        complaint = Complaint(
            id=cid, title=title, description=desc, location_type=loc_type,
            institution_id=inst_id, institution_name=inst_name,
            category=cat, predicted_category=pred_cat, category_confidence=cat_conf,
            priority=prio, predicted_priority=pred_pri, priority_reason=pri_reason,
            status=status, latitude=lat, longitude=lng, address=addr, landmark=lmark, ward=ward,
            reporter_name=reporter, assigned_team_id=tid, resolution_notes=res_notes,
            photo_url='/static/uploads/sample_civic.jpg',
            resolution_photo_url='/static/uploads/sample_resolved.jpg' if status in ['Resolved', 'Verified'] else None,
            created_at=created_time, updated_at=resolved_time or created_time, resolved_at=resolved_time
        )
        db.add(complaint)

        db.add(AuditLog(
            complaint_id=cid, action='Submitted & AI Analyzed', old_status=None, new_status='AI Analyzed',
            actor='CivicAI Intelligence Pipeline', notes=f'Classified as {pred_cat} ({int(cat_conf*100)}% conf). Priority: {pred_pri}. Assigned: {tid}.',
            timestamp=created_time
        ))

        if status in ['In Progress', 'Resolved', 'Verified']:
            db.add(AuditLog(
                complaint_id=cid, action='Field Dispatch', old_status='AI Analyzed', new_status='In Progress',
                actor='Field Dispatch Supervisor', notes='Crew dispatched on-site for immediate remediation.',
                timestamp=created_time + timedelta(hours=1)
            ))

        if status in ['Resolved', 'Verified']:
            db.add(AuditLog(
                complaint_id=cid, action='Resolved', old_status='In Progress', new_status='Resolved',
                actor='Field Operations Lead', notes=res_notes or 'Remediation completed and verified.',
                timestamp=resolved_time
            ))
            inv_map = {'Roads & Potholes': 'INV-001', 'Streetlights': 'INV-002', 'College Issues': 'INV-006', 'Drainage & Sewage': 'INV-003'}
            db.add(MaterialConsumption(
                complaint_id=cid, item_id=inv_map.get(cat, 'INV-001'), quantity_used=2,
                logged_at=resolved_time, notes='Standard replacement parts applied.'
            ))

    db.commit()
    print('Seeding completed successfully!')
    db.close()

if __name__ == '__main__':
    seed_database()
