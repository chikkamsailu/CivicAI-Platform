# CivicAI Training Dataset for Civic & Institutional Issues

TRAINING_DATA = [
    # --- Roads & Potholes ---
    ('Massive deep pothole on 100ft road near junction causing bike accidents', 'Roads & Potholes', 'Critical'),
    ('Multiple craters and broken bitumen after monsoon rain on 5th Main', 'Roads & Potholes', 'High'),
    ('Uneven road surface and sunken trench cut by telecom operator', 'Roads & Potholes', 'Medium'),
    ('Small crack developing on residential street asphalt', 'Roads & Potholes', 'Low'),
    ('Dangerous pothole right in front of government school gate', 'Roads & Potholes', 'Critical'),
    ('Road cave-in near storm drain opening', 'Roads & Potholes', 'Critical'),
    ('Asphalt peeling off exposing sharp gravel on bus route', 'Roads & Potholes', 'High'),
    ('Speed breaker markings faded and damaged road hump', 'Roads & Potholes', 'Medium'),
    ('Potholes along arterial highway service road causing severe traffic jam', 'Roads & Potholes', 'High'),
    ('Footpath slabs broken and missing concrete tiles on sidewalk', 'Roads & Potholes', 'Medium'),

    # --- Garbage & Waste ---
    ('Overflowing community dumpster spreading foul smell and flies near food stalls', 'Garbage & Waste', 'High'),
    ('Illegal dumping of construction debris and toxic chemical paint cans in open plot', 'Garbage & Waste', 'Critical'),
    ('Garbage truck has not collected waste for 5 consecutive days in layout', 'Garbage & Waste', 'Medium'),
    ('Litter accumulated around public park entrance bins', 'Garbage & Waste', 'Low'),
    ('Rotting animal carcass and medical waste dumped on empty roadside plot', 'Garbage & Waste', 'Critical'),
    ('Commercial kitchen waste dumped into open vacant space attracting stray dogs', 'Garbage & Waste', 'High'),
    ('Plastic waste and paper flyers scattered across public plaza', 'Garbage & Waste', 'Low'),
    ('Heavy wet waste black spots accumulating outside residential society gate', 'Garbage & Waste', 'Medium'),

    # --- Drainage & Sewage ---
    ('Open manhole with missing lid on busy pedestrian walkway at night', 'Drainage & Sewage', 'Critical'),
    ('Sewage backflow overflowing into ground floor residential apartments', 'Drainage & Sewage', 'Critical'),
    ('Stormwater drain completely blocked with plastic sludge causing road flooding', 'Drainage & Sewage', 'High'),
    ('Foul smelling black sewage water leaking onto public road', 'Drainage & Sewage', 'High'),
    ('Drainage concrete cover cracked and wobbling under pedestrian foot traffic', 'Drainage & Sewage', 'Medium'),
    ('Rainwater stagnating for 3 days due to clogged culvert pipe', 'Drainage & Sewage', 'Medium'),
    ('Minor silt buildup along curb gutter drain', 'Drainage & Sewage', 'Low'),
    ('Underground sewer line leaking into nearby drinking water pipeline trench', 'Drainage & Sewage', 'Critical'),

    # --- Water Supply ---
    ('Main drinking water pipeline burst with high pressure geyser flooding street', 'Water Supply', 'Critical'),
    ('Municipal tap water coming with dark brownish muddy contamination and foul odor', 'Water Supply', 'Critical'),
    ('No municipal water supply to Ward 8 for 4 consecutive days', 'Water Supply', 'High'),
    ('Leaking public water tap valve continuously wasting clean drinking water', 'Water Supply', 'Medium'),
    ('Low water pressure in municipal pipeline during morning distribution hours', 'Water Supply', 'Medium'),
    ('Community borewell motor burnt out and no backup pump running', 'Water Supply', 'High'),
    ('Minor dripping from overhead public water tank air-vent', 'Water Supply', 'Low'),

    # --- Electrical ---
    ('Live electrical wire snapped and sparking on wet ground near bus stop', 'Electrical', 'Critical'),
    ('Transformer smoking and emitting loud buzzing noise on roadside pole', 'Electrical', 'Critical'),
    ('Exposed distribution panel box door broken with bare live busbars reachable by children', 'Electrical', 'Critical'),
    ('Low hanging high-tension electric cable touching passing trucks and trees', 'Electrical', 'High'),
    ('Electric meter board sparking intermittently in community center hallway', 'Electrical', 'High'),
    ('Overhead service cable tangled in fallen tree branch', 'Electrical', 'Medium'),
    ('Rusted electrical junction box pillar needs weatherproof cover replacement', 'Electrical', 'Low'),

    # --- Streetlights ---
    ('Entire street dark as 8 consecutive streetlight fixtures are not turning on', 'Streetlights', 'High'),
    ('Streetlight pole leaning dangerously at 45 degrees towards pedestrian path', 'Streetlights', 'Critical'),
    ('Sodium vapor street lamp blinking rapidly and flickering all night', 'Streetlights', 'Low'),
    ('Streetlight timer broken so lamps remain turned on during bright daylight hours', 'Streetlights', 'Low'),
    ('Dark alleyway behind college hostel has zero functioning lights causing safety concerns', 'Streetlights', 'High'),
    ('Streetlight glass globe shattered after storm with exposed bulb socket', 'Streetlights', 'Medium'),
    ('Smart LED street pole sensor controller not responding to network', 'Streetlights', 'Medium'),

    # --- Public Infrastructure ---
    ('Pedestrian foot overbridge railing rusted through and missing safety barrier section', 'Public Infrastructure', 'Critical'),
    ('Public bus stop shelter roof collapsed under heavy wind and rain', 'Public Infrastructure', 'High'),
    ('Public community hall emergency exit door jammed shut', 'Public Infrastructure', 'Critical'),
    ('Damaged subway underpass tiles and water dripping from ceiling slab', 'Public Infrastructure', 'Medium'),
    ('Benches broken in public municipal library waiting lounge', 'Public Infrastructure', 'Low'),
    ('Municipal clinic wheelchair access ramp cracked and steep handrail loose', 'Public Infrastructure', 'High'),
    ('Public clock tower mechanism stopped working', 'Public Infrastructure', 'Low'),

    # --- Traffic & Road Signs ---
    ('Traffic signal lights dark at busy 4-way intersection causing chaotic near collisions', 'Traffic & Road Signs', 'Critical'),
    ('Stop sign knocked down and lying flat on pavement at blind curve', 'Traffic & Road Signs', 'High'),
    ('Directional sign board obscured by overgrown tree branches on Ring Road', 'Traffic & Road Signs', 'Medium'),
    ('Pelican pedestrian crossing push button button stuck and not turning red for cars', 'Traffic & Road Signs', 'Medium'),
    ('Reflective cat eye road studs broken and dislodged on flyover lane divider', 'Traffic & Road Signs', 'Low'),
    ('School zone 20 kmh speed limit warning sign vandalized and unreadable', 'Traffic & Road Signs', 'Medium'),

    # --- Parks & Public Spaces ---
    ('Children playground swing chain snapped with sharp metal link exposed', 'Parks & Public Spaces', 'High'),
    ('Broken beer bottles and sharp glass littering children play sand pit in public park', 'Parks & Public Spaces', 'Critical'),
    ('Fountain in central city square water stagnant, green algae and mosquito breeding', 'Parks & Public Spaces', 'Medium'),
    ('Public park jogging track interlocking pavers loose and causing tripping hazard', 'Parks & Public Spaces', 'Medium'),
    ('Park perimeter fence wire cut and stray cattle entering flower beds', 'Parks & Public Spaces', 'Low'),
    ('Dead tree branch hanging precariously above park exercise bench', 'Parks & Public Spaces', 'High'),

    # --- School Issues ---
    ('Primary school classroom ceiling plaster falling onto student desks', 'School Issues', 'Critical'),
    ('School girls washroom toilets choked, no water supply and broken door latches', 'School Issues', 'Critical'),
    ('Classroom ceiling fan wobbling violently and making screeching metal sound', 'School Issues', 'High'),
    ('Drinking water RO purifier in high school corridor showing filter error and leaking', 'School Issues', 'High'),
    ('School playground compound wall tilted and showing deep structural crack', 'School Issues', 'Critical'),
    ('Broken wooden student benches with sharp protruding nails in Grade 7 room', 'School Issues', 'Medium'),
    ('School laboratory emergency fire extinguisher inspection date expired 3 years ago', 'School Issues', 'High'),
    ('Classroom blackboard paint chipped making lessons hard to read', 'School Issues', 'Low'),

    # --- College Issues ---
    ('Chemistry department laboratory LPG gas cylinder pipeline smelling of leak', 'College Issues', 'Critical'),
    ('Engineering college lecture hall 4 central ceiling fan motor sparked and fell', 'College Issues', 'Critical'),
    ('University library air conditioning completely broken during examination week', 'College Issues', 'Medium'),
    ('College hostel staircase emergency lighting out leaving stairwell pitch black', 'College Issues', 'High'),
    ('Computer lab networking switchboard overheating with burnt plastic smell', 'College Issues', 'High'),
    ('Campus auditorium sound amplification system buzzing loudly during seminars', 'College Issues', 'Low'),
    ('College cafeteria drinking water cooler dispenser leaking ice cold water onto floor', 'College Issues', 'Medium'),
    ('Hostel bathroom water geyser thermostat failed causing scalding water steam', 'College Issues', 'High'),

    # --- Office/Workplace Issues ---
    ('Ceiling central AC duct leaking water directly above server rack in office IT room', 'Office/Workplace Issues', 'Critical'),
    ('Office building elevator stuck between 3rd and 4th floor with passengers inside', 'Office/Workplace Issues', 'Critical'),
    ('Workplace emergency fire sprinkler head dripping onto employee workstations', 'Office/Workplace Issues', 'High'),
    ('Pest infestation and termites spotted in municipal archives file storage room', 'Office/Workplace Issues', 'Medium'),
    ('Automatic sliding glass entrance door sensor malfunctioning and locking employees', 'Office/Workplace Issues', 'Medium'),
    ('Fluorescent light tube flickering constantly in 2nd floor accounting cubicle', 'Office/Workplace Issues', 'Low'),
    ('Office cafeteria microwave sparking and circuit tripping pantry breaker', 'Office/Workplace Issues', 'High'),

    # --- Sanitation ---
    ('Public bus terminus public toilet overflowing with human waste and no water', 'Sanitation', 'Critical'),
    ('Hospital outpatient corridor floor stained with biological fluid not cleaned for hours', 'Sanitation', 'Critical'),
    ('Community public urinal block choked with plastic bottles and foul stench', 'Sanitation', 'High'),
    ('Municipal market vegetable slaughterhouse waste left rotting on open drain edge', 'Sanitation', 'High'),
    ('Public park toilet paper dispenser empty and hand sanitizer unit damaged', 'Sanitation', 'Low'),
    ('Dead rat found inside public community health center medicine dispensary', 'Sanitation', 'Critical'),
    ('Sanitation workers safety gloves and masks stock depleted at ward depot', 'Sanitation', 'Medium')
]
