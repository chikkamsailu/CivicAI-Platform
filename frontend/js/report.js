// CivicAI - Guided 4-Step Issue Reporting Wizard & Location-Specific Dynamic Context
let reportMap = null;
let reportMarker = null;
let aiDebounceTimer = null;
let uploadedPhotoUrl = null;
let currentWizardStep = 1;

const DEFAULT_COORDS = [12.9716, 77.5946]; // Bengaluru Civic Center

// Pre-configured Verified Institutional Directory
const LOCATION_PRESETS = {
  colleges: [
    { id: "INST-001", name: "National Institute of Engineering & Technology", ward: "Ward 4 - Indiranagar", address: "100ft Road, HAL 2nd Stage", lat: 12.9719, lng: 77.6412 },
    { id: "INST-007", name: "Vidya Vardhaka Law & Arts College", ward: "Ward 9 - Rajajinagar", address: "Dr. Rajkumar Road", lat: 12.9915, lng: 77.5552 },
    { id: "", name: "RV College of Engineering", ward: "Ward 5 - Jayanagar", address: "RV Vidyaniketan Post, Mysore Road", lat: 12.9240, lng: 77.5000 },
    { id: "", name: "Indian Institute of Science (IISc)", ward: "Ward 2 - Malleshwaram", address: "CV Raman Road, Malleshwaram", lat: 13.0219, lng: 77.5671 },
    { id: "", name: "Bangalore University - Central Campus", ward: "Ward 1 - Majestic", address: "Jnana Bharathi Campus", lat: 12.9740, lng: 77.5750 },
    { id: "", name: "PES University", ward: "Ward 3 - HSR Layout", address: "Outer Ring Road, Banashankari", lat: 12.9344, lng: 77.5344 },
    { id: "", name: "Bangalore Medical College & Research Institute", ward: "Ward 1 - Majestic", address: "Fort Road, near City Market", lat: 12.9620, lng: 77.5760 }
  ],
  schools: [
    { id: "INST-002", name: "St. Xavier Public Senior Secondary School", ward: "Ward 7 - Koramangala", address: "8th Main, 4th Block", lat: 12.9352, lng: 77.6245 },
    { id: "INST-005", name: "Indira Gandhi Memorial Girls High School", ward: "Ward 5 - Jayanagar", address: "11th Main, 4th T Block", lat: 12.9250, lng: 77.5938 },
    { id: "", name: "Government Model High School", ward: "Ward 2 - Malleshwaram", address: "13th Cross, Margosa Road", lat: 12.9970, lng: 77.5700 },
    { id: "", name: "Kendriya Vidyalaya - Hebbal Campus", ward: "Ward 1 - Majestic", address: "Sadashivanagar Post, Bellary Road", lat: 13.0250, lng: 77.5890 },
    { id: "", name: "National Public School - Indiranagar", ward: "Ward 4 - Indiranagar", address: "12th A Main Road, HAL 2nd Stage", lat: 12.9780, lng: 77.6400 },
    { id: "", name: "Delhi Public School - South", ward: "Ward 5 - Jayanagar", address: "Kanakapura Road, Konanakunte", lat: 12.8900, lng: 77.5600 },
    { id: "", name: "St. Joseph's Boys' High School", ward: "Ward 4 - Indiranagar", address: "Museum Road, Shanthala Nagar", lat: 12.9705, lng: 77.6010 }
  ],
  workplaces: [
    { id: "INST-004", name: "Apex Global Technology Park - Campus 3", ward: "Ward 11 - Whitefield", address: "ITPL Main Road", lat: 12.9863, lng: 77.7305 },
    { id: "INST-008", name: "Civic Technology & Innovation Hub", ward: "Ward 3 - HSR Layout", address: "27th Main Road, Sector 1", lat: 12.9116, lng: 77.6499 },
    { id: "", name: "Manyata Embassy Business Park", ward: "Ward 11 - Whitefield", address: "Outer Ring Road, Nagawara", lat: 13.0480, lng: 77.6200 },
    { id: "", name: "Bagmane Tech Park", ward: "Ward 4 - Indiranagar", address: "CV Raman Nagar", lat: 12.9800, lng: 77.6600 },
    { id: "", name: "RMZ Infinity Corporate Complex", ward: "Ward 4 - Indiranagar", address: "Old Madras Road, Bennigana Halli", lat: 12.9930, lng: 77.6610 },
    { id: "", name: "UB City Commercial Complex", ward: "Ward 1 - Majestic", address: "24 Vittal Mallya Road", lat: 12.9718, lng: 77.5958 },
    { id: "", name: "Karnataka Government Secretariat / Vidhana Soudha", ward: "Ward 1 - Majestic", address: "Ambedkar Veedhi", lat: 12.9796, lng: 77.5906 },
    { id: "", name: "Peenya Industrial Estate Phase 1", ward: "Ward 9 - Rajajinagar", address: "Peenya Industrial Area", lat: 13.0300, lng: 77.5200 }
  ],
  hospitals: [
    { id: "INST-003", name: "City Central Multispecialty Hospital", ward: "Ward 2 - Malleshwaram", address: "Sampige Road, 15th Cross", lat: 12.9982, lng: 77.5714 },
    { id: "", name: "Victoria Hospital & Emergency Complex", ward: "Ward 1 - Majestic", address: "Fort Road, near City Market", lat: 12.9640, lng: 77.5750 },
    { id: "", name: "Bowring & Lady Curzon Hospital", ward: "Ward 4 - Indiranagar", address: "Hospital Road, Shivaji Nagar", lat: 12.9840, lng: 77.6030 },
    { id: "", name: "NIMHANS Neuro & Emergency Hospital", ward: "Ward 7 - Koramangala", address: "Hosur Road, Lakkasandra", lat: 12.9400, lng: 77.5960 },
    { id: "", name: "Manipal Hospital - Old Airport Road", ward: "Ward 4 - Indiranagar", address: "98 HAL Old Airport Road", lat: 12.9580, lng: 77.6480 },
    { id: "", name: "Jayanagar General Hospital", ward: "Ward 5 - Jayanagar", address: "4th T Block, Jayanagar", lat: 12.9290, lng: 77.5850 },
    { id: "", name: "K.C. General Hospital", ward: "Ward 2 - Malleshwaram", address: "5th Cross Road, Malleshwaram", lat: 12.9990, lng: 77.5680 },
    { id: "", name: "Urban Primary Health Centre", ward: "Ward 3 - HSR Layout", address: "Sector 2, HSR Layout", lat: 12.9150, lng: 77.6400 }
  ],
  publicFacilities: [
    { id: "INST-006", name: "Metropolitan Transit Operations Terminal", ward: "Ward 1 - Majestic", address: "Platform Road, Majestic Central", lat: 12.9774, lng: 77.5729 },
    { id: "", name: "Majestic Central Bus Station (BMTC/KSRTC)", ward: "Ward 1 - Majestic", address: "Kempegowda Bus Station, Majestic", lat: 12.9760, lng: 77.5710 },
    { id: "", name: "Cubbon Park Public Facilities & Pavilion", ward: "Ward 1 - Majestic", address: "Kasturba Road, Sampangi Rama Nagar", lat: 12.9760, lng: 77.5930 },
    { id: "", name: "Lalbagh Botanical Garden Facilities", ward: "Ward 5 - Jayanagar", address: "Mavalli, South Bengaluru", lat: 12.9500, lng: 77.5850 },
    { id: "", name: "Russell Market Historical Municipal Complex", ward: "Ward 4 - Indiranagar", address: "Shivaji Nagar, Tasker Town", lat: 12.9860, lng: 77.6050 },
    { id: "", name: "Indiranagar BBMP Community Hall", ward: "Ward 4 - Indiranagar", address: "100 Feet Road, Indiranagar", lat: 12.9720, lng: 77.6380 },
    { id: "", name: "Malleshwaram 8th Cross Public Market", ward: "Ward 2 - Malleshwaram", address: "8th Cross Road, Malleshwaram", lat: 12.9970, lng: 77.5720 },
    { id: "", name: "City Central Library - South End", ward: "Ward 5 - Jayanagar", address: "South End Circle, Jayanagar", lat: 12.9320, lng: 77.5780 },
    { id: "", name: "Kanteerava Sports Stadium Complex", ward: "Ward 1 - Majestic", address: "Kasturba Road, Nunegundlapalli", lat: 12.9690, lng: 77.5920 }
  ]
};

// Step Wizard Navigation
function goToWizardStep(step) {
  currentWizardStep = step;

  // Update step nodes
  for (let i = 1; i <= 4; i++) {
    const node = document.getElementById(`wizard-node-${i}`);
    const section = document.getElementById(`wizard-step-${i}`);

    if (node) {
      if (i < step) {
        node.className = 'wizard-step-node completed';
      } else if (i === step) {
        node.className = 'wizard-step-node active';
      } else {
        node.className = 'wizard-step-node';
      }
    }

    if (section) {
      section.style.display = (i === step) ? 'block' : 'none';
      if (i === step) section.classList.add('fade-in');
    }
  }

  // Refresh map view if moving to locate step
  if (step === 2) {
    setTimeout(() => {
      if (reportMap) {
        reportMap.invalidateSize();
      } else {
        initReportMap();
      }
    }, 100);
  }

  // Populate Review step summary if moving to step 4
  if (step === 4) {
    populateReviewSummary();
  }

  const wizardCard = document.getElementById('issue-report-form');
  if (wizardCard) {
    wizardCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function nextWizardStep() {
  if (currentWizardStep === 1) {
    const title = document.getElementById('report-title')?.value.trim();
    const desc = document.getElementById('report-description')?.value.trim();
    if (!title || !desc) {
      showToast('Please provide an issue title and description to proceed.', 'error');
      return;
    }

    const locType = document.querySelector('input[name="location_type"]:checked')?.value || 'Public / Community';

    if (locType === 'College / University') {
      const select = document.getElementById('college-select');
      const custom = document.getElementById('college-custom-name')?.value.trim();
      const block = document.getElementById('college-block')?.value.trim();
      if (!select?.value && !custom) {
        showToast('Please select or specify a College / University.', 'error');
        return;
      }
      if (select?.value === 'OTHER' && !custom) {
        showToast('Please enter the College / University name.', 'error');
        return;
      }
      if (!block) {
        showToast('Please specify the campus, block, or building.', 'error');
        return;
      }
    } else if (locType === 'School') {
      const select = document.getElementById('school-select');
      const custom = document.getElementById('school-custom-name')?.value.trim();
      const block = document.getElementById('school-block')?.value.trim();
      if (!select?.value && !custom) {
        showToast('Please select or specify a School.', 'error');
        return;
      }
      if (select?.value === 'OTHER' && !custom) {
        showToast('Please enter the School name.', 'error');
        return;
      }
      if (!block) {
        showToast('Please specify the school block, building, or area.', 'error');
        return;
      }
    } else if (locType === 'Office / Workplace') {
      const select = document.getElementById('workplace-select');
      const custom = document.getElementById('workplace-custom-name')?.value.trim();
      const building = document.getElementById('workplace-building')?.value.trim();
      if (!select?.value && !custom) {
        showToast('Please select or specify a Workplace / Office.', 'error');
        return;
      }
      if (select?.value === 'OTHER' && !custom) {
        showToast('Please enter the Workplace name.', 'error');
        return;
      }
      if (!building) {
        showToast('Please specify the workplace building or block.', 'error');
        return;
      }
    } else if (locType === 'Hospital / Healthcare') {
      const select = document.getElementById('hospital-select');
      const custom = document.getElementById('hospital-custom-name')?.value.trim();
      const building = document.getElementById('hospital-building')?.value.trim();
      if (!select?.value && !custom) {
        showToast('Please select or specify a Hospital / Healthcare Facility.', 'error');
        return;
      }
      if (select?.value === 'OTHER' && !custom) {
        showToast('Please enter the Hospital / Facility name.', 'error');
        return;
      }
      if (!building) {
        showToast('Please specify the hospital building or block.', 'error');
        return;
      }
    } else if (locType === 'Public Institution') {
      const select = document.getElementById('public-facility-select');
      const custom = document.getElementById('public-facility-custom-name')?.value.trim();
      const area = document.getElementById('public-facility-area')?.value.trim();
      if (!select?.value && !custom) {
        showToast('Please select or specify a Public Facility.', 'error');
        return;
      }
      if (select?.value === 'OTHER' && !custom) {
        showToast('Please enter the Public Facility name.', 'error');
        return;
      }
      if (!area) {
        showToast('Please specify the area or section of the facility.', 'error');
        return;
      }
    }
  } else if (currentWizardStep === 2) {
    const address = document.getElementById('report-address')?.value.trim();
    if (!address) {
      showToast('Please enter an address or street location.', 'error');
      return;
    }
  }

  goToWizardStep(Math.min(4, currentWizardStep + 1));
}

function prevWizardStep() {
  goToWizardStep(Math.max(1, currentWizardStep - 1));
}

function populateReviewSummary() {
  const title = document.getElementById('report-title')?.value || '—';
  const desc = document.getElementById('report-description')?.value || '—';
  const category = document.querySelector('input[name="category"]:checked')?.value || 'Other';
  const locType = document.querySelector('input[name="location_type"]:checked')?.value || 'Public / Community';
  const address = document.getElementById('report-address')?.value || '—';
  const ward = document.getElementById('report-ward')?.value || '—';
  const name = document.getElementById('report-name')?.value || 'Anonymous Citizen';

  let locationSummary = `${locType} (${ward})`;

  if (locType === 'College / University') {
    const colSelect = document.getElementById('college-select');
    const colName = (colSelect?.value === 'OTHER') ? document.getElementById('college-custom-name')?.value : (colSelect?.options[colSelect.selectedIndex]?.text || 'College');
    const colBlock = document.getElementById('college-block')?.value || '';
    const colRoom = document.getElementById('college-room')?.value || '';
    locationSummary = `${colName} • ${colBlock}${colRoom ? ' (' + colRoom + ')' : ''}`;
  } else if (locType === 'School') {
    const schSelect = document.getElementById('school-select');
    const schName = (schSelect?.value === 'OTHER') ? document.getElementById('school-custom-name')?.value : (schSelect?.options[schSelect.selectedIndex]?.text || 'School');
    const schBlock = document.getElementById('school-block')?.value || '';
    const schArea = document.getElementById('school-area-type')?.value || '';
    locationSummary = `${schName} • ${schBlock} [${schArea}]`;
  } else if (locType === 'Office / Workplace') {
    const wpSelect = document.getElementById('workplace-select');
    const wpName = (wpSelect?.value === 'OTHER') ? document.getElementById('workplace-custom-name')?.value : (wpSelect?.options[wpSelect.selectedIndex]?.text || 'Workplace');
    const wpType = document.getElementById('workplace-type')?.value || '';
    const wpBuilding = document.getElementById('workplace-building')?.value || '';
    locationSummary = `${wpName} (${wpType}) • ${wpBuilding}`;
  } else if (locType === 'Hospital / Healthcare') {
    const hospSelect = document.getElementById('hospital-select');
    const hospName = (hospSelect?.value === 'OTHER') ? document.getElementById('hospital-custom-name')?.value : (hospSelect?.options[hospSelect.selectedIndex]?.text || 'Hospital');
    const hospType = document.getElementById('hospital-type')?.value || '';
    const hospDept = document.getElementById('hospital-dept')?.value || '';
    locationSummary = `${hospName} (${hospType}) • ${hospDept}`;
  } else if (locType === 'Public Institution') {
    const pubSelect = document.getElementById('public-facility-select');
    const pubName = (pubSelect?.value === 'OTHER') ? document.getElementById('public-facility-custom-name')?.value : (pubSelect?.options[pubSelect.selectedIndex]?.text || 'Public Facility');
    const pubType = document.getElementById('public-facility-type')?.value || '';
    const pubArea = document.getElementById('public-facility-area')?.value || '';
    locationSummary = `${pubName} (${pubType}) • ${pubArea}`;
  }

  const revTitle = document.getElementById('rev-title');
  const revCat = document.getElementById('rev-category');
  const revLoc = document.getElementById('rev-location');
  const revAddress = document.getElementById('rev-address');
  const revReporter = document.getElementById('rev-reporter');

  if (revTitle) revTitle.innerText = title;
  if (revCat) revCat.innerText = category;
  if (revLoc) revLoc.innerText = locationSummary;
  if (revAddress) revAddress.innerText = address;
  if (revReporter) revReporter.innerText = name;
}

// Leaflet Map Initialization
function initReportMap() {
  const mapContainer = document.getElementById('report-map');
  if (!mapContainer) return;

  if (reportMap) {
    reportMap.invalidateSize();
    return;
  }

  reportMap = L.map('report-map', {
    scrollWheelZoom: false
  }).setView(DEFAULT_COORDS, 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(reportMap);

  const customPin = L.divIcon({
    className: 'custom-map-pin',
    html: `<div style="background:#26717C; width:30px; height:30px; border-radius:50%; border:3px solid #FFF; box-shadow:0 2px 8px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; color:#FFF; font-size:14px;">📍</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

  reportMarker = L.marker(DEFAULT_COORDS, {
    draggable: true,
    icon: customPin
  }).addTo(reportMap);

  reportMarker.on('dragend', (e) => {
    const pos = e.target.getLatLng();
    updateLocationInputs(pos.lat, pos.lng);
  });

  reportMap.on('click', (e) => {
    reportMarker.setLatLng(e.latlng);
    updateLocationInputs(e.latlng.lat, e.latlng.lng);
  });

  updateLocationInputs(DEFAULT_COORDS[0], DEFAULT_COORDS[1]);
}

function updateLocationInputs(lat, lng) {
  const latInput = document.getElementById('report-lat');
  const lngInput = document.getElementById('report-lng');
  const coordDisplay = document.getElementById('report-coords-display');

  if (latInput) latInput.value = lat.toFixed(6);
  if (lngInput) lngInput.value = lng.toFixed(6);
  if (coordDisplay) {
    coordDisplay.innerHTML = `Pin Coordinates: <strong>${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E</strong> (drag marker to refine)`;
  }
}

// GPS Geolocate Button
function useCurrentGPS() {
  const btn = document.getElementById('report-use-gps-btn');
  if (!navigator.geolocation) {
    showToast('Geolocation is not supported by your browser.', 'error');
    return;
  }

  if (btn) btn.innerHTML = '<span>📡 Acquiring GPS Fix...</span>';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      if (reportMap && reportMarker) {
        reportMap.setView([lat, lng], 16);
        reportMarker.setLatLng([lat, lng]);
      }
      updateLocationInputs(lat, lng);
      showToast('GPS position locked successfully!', 'success');
      if (btn) btn.innerHTML = '<span>📍 Position Updated</span>';
    },
    (err) => {
      console.warn('GPS error:', err);
      showToast('Could not fetch GPS. Defaulting to municipal center.', 'info');
      if (btn) btn.innerHTML = '<span>📍 Use My GPS Location</span>';
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

// Live AI Assistant Pre-Analyze Debounce
function triggerAIPreAnalyze() {
  clearTimeout(aiDebounceTimer);
  aiDebounceTimer = setTimeout(async () => {
    const title = document.getElementById('report-title')?.value.trim() || '';
    const desc = document.getElementById('report-description')?.value.trim() || '';
    const locType = document.querySelector('input[name="location_type"]:checked')?.value || 'Public / Community';
    const lat = parseFloat(document.getElementById('report-lat')?.value) || 0.0;
    const lng = parseFloat(document.getElementById('report-lng')?.value) || 0.0;
    const ward = document.getElementById('report-ward')?.value || '';

    if (title.length < 4 && desc.length < 5) {
      resetAIPreview();
      return;
    }

    try {
      const res = await fetch('/api/ai/pre-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: desc,
          location_type: locType,
          latitude: lat,
          longitude: lng,
          ward
        })
      });

      if (!res.ok) return;
      const data = await res.json();
      renderAIPreview(data);
    } catch (err) {
      console.error('AI Pre-analyze error:', err);
    }
  }, 400);
}

function renderAIPreview(aiData) {
  const panel = document.getElementById('ai-assistant-preview');
  if (!panel) return;

  panel.style.display = 'block';

  const catEl = document.getElementById('ai-pred-category');
  const confEl = document.getElementById('ai-pred-confidence');
  if (catEl) catEl.innerText = aiData.predicted_category;
  if (confEl) confEl.innerText = `${Math.round(aiData.category_confidence * 100)}% Confidence`;

  const priEl = document.getElementById('ai-pred-priority');
  const reasonEl = document.getElementById('ai-pred-reason');
  if (priEl) {
    priEl.innerText = aiData.predicted_priority;
    priEl.className = `badge badge-${aiData.predicted_priority.toLowerCase()}`;
  }
  if (reasonEl) reasonEl.innerText = aiData.priority_reason;

  const teamEl = document.getElementById('ai-rec-team');
  if (teamEl) teamEl.innerText = aiData.recommended_team || 'Municipal Maintenance Division';

  const dupBox = document.getElementById('ai-dup-alert');
  if (dupBox) {
    if (aiData.potential_duplicate) {
      dupBox.style.display = 'flex';
      dupBox.innerHTML = `
        <div style="font-size:1.25rem;">⚠️</div>
        <div>
          <strong style="color:var(--amber-500);">Nearby Matching Issue Detected</strong>
          <p style="font-size:0.84rem; margin-top:0.2rem;">Matches active ticket <strong>${aiData.duplicate_ticket_id}</strong> (${Math.round(aiData.duplicate_similarity * 100)}% match). You may still submit to boost resolution priority.</p>
        </div>
      `;
    } else {
      dupBox.style.display = 'none';
    }
  }

  const autoSyncCheckbox = document.getElementById('auto-sync-category');
  if (autoSyncCheckbox && autoSyncCheckbox.checked && aiData.predicted_category) {
    const radio = document.querySelector(`input[name="category"][value="${aiData.predicted_category}"]`);
    if (radio) radio.checked = true;
  }
}

function resetAIPreview() {
  const panel = document.getElementById('ai-assistant-preview');
  if (panel) panel.style.display = 'none';
}

// DYNAMIC CONDITIONAL LOCATION FORM LOGIC
function normalizeLocationType(locType) {
  if (!locType) return 'Public / Community';
  const val = String(locType).trim();
  if (val === 'Public / Road' || val === 'Public' || val === 'Road' || val === 'Public / Community') {
    return 'Public / Community';
  }
  if (val === 'College / University' || val === 'College / Univ' || val === 'College' || val === 'University') {
    return 'College / University';
  }
  if (val === 'School' || val === 'Schools') {
    return 'School';
  }
  if (val === 'Office / Workplace' || val === 'Workplace' || val === 'Office' || val === 'Workplaces') {
    return 'Office / Workplace';
  }
  if (val === 'Hospital / Healthcare' || val === 'Hospital' || val === 'Healthcare' || val === 'Hospitals') {
    return 'Hospital / Healthcare';
  }
  if (val === 'Public Institution' || val === 'Public Facility' || val === 'Municipal Facility' || val === 'Public Facilities') {
    return 'Public Institution';
  }
  return val;
}

function selectLocationType(locType) {
  const normalized = normalizeLocationType(locType);

  // Update corresponding radio button
  const radios = document.querySelectorAll('input[name="location_type"]');
  radios.forEach(radio => {
    if (radio.value === normalized || normalizeLocationType(radio.value) === normalized) {
      radio.checked = true;
    } else {
      radio.checked = false;
    }
  });

  // Switch form context card immediately
  switchLocationTypeForm(normalized);

  // Trigger AI pre-analyze to adapt to new location context
  if (typeof triggerAIPreAnalyze === 'function') {
    triggerAIPreAnalyze();
  }
}
window.selectLocationType = selectLocationType;

function switchLocationTypeForm(locType) {
  const normalized = normalizeLocationType(locType);

  const cardMap = {
    'Public / Community': 'loc-card-public',
    'College / University': 'loc-card-college',
    'School': 'loc-card-school',
    'Office / Workplace': 'loc-card-workplace',
    'Hospital / Healthcare': 'loc-card-hospital',
    'Public Institution': 'loc-card-public-facility'
  };

  const allCards = [
    'loc-card-public',
    'loc-card-college',
    'loc-card-school',
    'loc-card-workplace',
    'loc-card-hospital',
    'loc-card-public-facility'
  ];

  // Immediately hide all 6 cards
  allCards.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = 'none';
    }
  });

  // Highlight selected button card, unhighlight others
  document.querySelectorAll('.wizard-options-grid label').forEach(lbl => {
    const r = lbl.querySelector('input[name="location_type"]');
    const isSelected = r && (r.value === normalized || normalizeLocationType(r.value) === normalized);
    if (isSelected) {
      lbl.style.borderColor = 'var(--teal-600)';
      lbl.style.background = '#FFFFFF';
      lbl.style.boxShadow = '0 2px 8px rgba(38, 113, 124, 0.15)';
    } else {
      lbl.style.borderColor = 'var(--border-light)';
      lbl.style.background = 'var(--bg-secondary)';
      lbl.style.boxShadow = 'none';
    }
  });

  // Display target card immediately
  const targetId = cardMap[normalized] || 'loc-card-public';
  const targetCard = document.getElementById(targetId);
  if (targetCard) {
    targetCard.style.display = 'block';
    targetCard.classList.add('fade-in');
  }

  // Populate dynamic dropdowns
  if (normalized === 'College / University') populateColleges();
  else if (normalized === 'School') populateSchools();
  else if (normalized === 'Office / Workplace') populateWorkplaces();
  else if (normalized === 'Hospital / Healthcare') populateHospitals();
  else if (normalized === 'Public Institution') populatePublicFacilities();
}
window.switchLocationTypeForm = switchLocationTypeForm;

function handleInstitutionSelection(selectEl, customBoxId) {
  const selected = selectEl.options[selectEl.selectedIndex];
  const customBox = document.getElementById(customBoxId);

  if (selectEl.value === 'OTHER') {
    if (customBox) customBox.style.display = 'block';
    return;
  } else {
    if (customBox) customBox.style.display = 'none';
  }

  if (selected && selected.dataset.lat) {
    const lat = parseFloat(selected.dataset.lat);
    const lng = parseFloat(selected.dataset.lng);
    const ward = selected.dataset.ward;
    const addr = selected.dataset.address;

    if (lat && lng) {
      updateLocationInputs(lat, lng);
      if (reportMap && reportMarker) {
        reportMap.setView([lat, lng], 16);
        reportMarker.setLatLng([lat, lng]);
      }
    }

    if (ward) {
      const wardSelect = document.getElementById('report-ward');
      if (wardSelect) wardSelect.value = ward;
    }

    if (addr) {
      const addrInput = document.getElementById('report-address');
      if (addrInput) addrInput.value = addr;
    }
  }
}

function populateDropdown(selectId, customBoxId, items, defaultLabel, otherLabel) {
  const select = document.getElementById(selectId);
  if (!select || select.children.length > 1) return;

  select.innerHTML = `<option value="">${defaultLabel}</option>`;

  items.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.id || item.name;
    opt.innerText = item.ward ? `${item.name} (${item.ward})` : item.name;
    opt.dataset.id = item.id || '';
    opt.dataset.name = item.name;
    opt.dataset.lat = item.lat || '';
    opt.dataset.lng = item.lng || '';
    opt.dataset.ward = item.ward || '';
    opt.dataset.address = item.address || '';
    select.appendChild(opt);
  });

  const otherOpt = document.createElement('option');
  otherOpt.value = 'OTHER';
  otherOpt.innerText = otherLabel || 'Other (Specify Below)...';
  select.appendChild(otherOpt);

  select.onchange = () => handleInstitutionSelection(select, customBoxId);
}

function populateColleges() {
  populateDropdown('college-select', 'college-custom-name-box', LOCATION_PRESETS.colleges, 'Select College / University...', 'Other College / University (Specify Name)...');
}

function populateSchools() {
  populateDropdown('school-select', 'school-custom-name-box', LOCATION_PRESETS.schools, 'Select School...', 'Other School (Specify Name)...');
}

function populateWorkplaces() {
  populateDropdown('workplace-select', 'workplace-custom-name-box', LOCATION_PRESETS.workplaces, 'Select Workplace / Office...', 'Other Workplace / Office (Specify Name)...');
}

function populateHospitals() {
  populateDropdown('hospital-select', 'hospital-custom-name-box', LOCATION_PRESETS.hospitals, 'Select Hospital / Healthcare Facility...', 'Other Hospital / Facility (Specify Name)...');
}

function populatePublicFacilities() {
  populateDropdown('public-facility-select', 'public-facility-custom-name-box', LOCATION_PRESETS.publicFacilities, 'Select Public Facility...', 'Other Public Facility (Specify Name)...');
}

// Photo Upload Handler
function initPhotoUpload() {
  const fileInput = document.getElementById('report-photo-input');
  const previewContainer = document.getElementById('photo-preview-container');
  const previewImg = document.getElementById('photo-preview-img');
  const dropZone = document.getElementById('photo-dropzone');

  if (!fileInput || !dropZone) return;

  fileInput.addEventListener('change', async () => {
    if (fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      
      const reader = new FileReader();
      reader.onload = (e) => {
        if (previewImg && previewContainer) {
          previewImg.src = e.target.result;
          previewContainer.style.display = 'block';
        }
      };
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/complaints/upload', {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          uploadedPhotoUrl = data.url;
          showToast('Photo evidence attached successfully!', 'success');
        }
      } catch (err) {
        console.error('Photo upload error:', err);
      }
    }
  });
}

// Form Submission Handler
async function handleReportSubmit(e) {
  e.preventDefault();

  const title = document.getElementById('report-title')?.value.trim();
  const description = document.getElementById('report-description')?.value.trim();
  const location_type = document.querySelector('input[name="location_type"]:checked')?.value || 'Public / Community';
  const category = document.querySelector('input[name="category"]:checked')?.value || 'Other';

  let institution_id = null;
  let institution_name = null;
  let specificLandmark = document.getElementById('report-landmark')?.value.trim() || '';

  if (location_type === 'College / University') {
    const sel = document.getElementById('college-select');
    const custom = document.getElementById('college-custom-name')?.value.trim();
    const block = document.getElementById('college-block')?.value.trim() || '';
    const dept = document.getElementById('college-dept')?.value.trim() || '';
    const room = document.getElementById('college-room')?.value.trim() || '';

    if (sel?.value === 'OTHER') {
      institution_name = custom;
    } else if (sel && sel.selectedIndex > 0) {
      institution_id = sel.options[sel.selectedIndex].dataset.id || null;
      institution_name = sel.options[sel.selectedIndex].dataset.name || sel.options[sel.selectedIndex].text;
    }
    specificLandmark = `Block: ${block}${dept ? ' | Dept: ' + dept : ''}${room ? ' | Room: ' + room : ''}`;
  } else if (location_type === 'School') {
    const sel = document.getElementById('school-select');
    const custom = document.getElementById('school-custom-name')?.value.trim();
    const block = document.getElementById('school-block')?.value.trim() || '';
    const area = document.getElementById('school-area-type')?.value || '';
    const room = document.getElementById('school-room')?.value.trim() || '';

    if (sel?.value === 'OTHER') {
      institution_name = custom;
    } else if (sel && sel.selectedIndex > 0) {
      institution_id = sel.options[sel.selectedIndex].dataset.id || null;
      institution_name = sel.options[sel.selectedIndex].dataset.name || sel.options[sel.selectedIndex].text;
    }
    specificLandmark = `Block: ${block} | Area: ${area}${room ? ' | Section: ' + room : ''}`;
  } else if (location_type === 'Office / Workplace') {
    const sel = document.getElementById('workplace-select');
    const custom = document.getElementById('workplace-custom-name')?.value.trim();
    const wpType = document.getElementById('workplace-type')?.value || '';
    const building = document.getElementById('workplace-building')?.value.trim() || '';
    const dept = document.getElementById('workplace-dept')?.value.trim() || '';
    const room = document.getElementById('workplace-room')?.value.trim() || '';

    if (sel?.value === 'OTHER') {
      institution_name = custom;
    } else if (sel && sel.selectedIndex > 0) {
      institution_id = sel.options[sel.selectedIndex].dataset.id || null;
      institution_name = sel.options[sel.selectedIndex].dataset.name || sel.options[sel.selectedIndex].text;
    }
    specificLandmark = `Type: ${wpType} | Building: ${building}${dept ? ' | Dept: ' + dept : ''}${room ? ' | Room: ' + room : ''}`;
  } else if (location_type === 'Hospital / Healthcare') {
    const sel = document.getElementById('hospital-select');
    const custom = document.getElementById('hospital-custom-name')?.value.trim();
    const hospType = document.getElementById('hospital-type')?.value || '';
    const building = document.getElementById('hospital-building')?.value.trim() || '';
    const dept = document.getElementById('hospital-dept')?.value || '';
    const floor = document.getElementById('hospital-floor')?.value.trim() || '';
    const room = document.getElementById('hospital-room')?.value.trim() || '';

    if (sel?.value === 'OTHER') {
      institution_name = custom;
    } else if (sel && sel.selectedIndex > 0) {
      institution_id = sel.options[sel.selectedIndex].dataset.id || null;
      institution_name = sel.options[sel.selectedIndex].dataset.name || sel.options[sel.selectedIndex].text;
    }
    specificLandmark = `Type: ${hospType} | Building: ${building} | Ward: ${dept}${floor ? ' | Floor: ' + floor : ''}${room ? ' | Room: ' + room : ''}`;
  } else if (location_type === 'Public Institution') {
    const sel = document.getElementById('public-facility-select');
    const custom = document.getElementById('public-facility-custom-name')?.value.trim();
    const pubType = document.getElementById('public-facility-type')?.value || '';
    const area = document.getElementById('public-facility-area')?.value.trim() || '';

    if (sel?.value === 'OTHER') {
      institution_name = custom;
    } else if (sel && sel.selectedIndex > 0) {
      institution_id = sel.options[sel.selectedIndex].dataset.id || null;
      institution_name = sel.options[sel.selectedIndex].dataset.name || sel.options[sel.selectedIndex].text;
    }
    specificLandmark = `Type: ${pubType} | Section: ${area}`;
  }

  const latitude = parseFloat(document.getElementById('report-lat')?.value) || DEFAULT_COORDS[0];
  const longitude = parseFloat(document.getElementById('report-lng')?.value) || DEFAULT_COORDS[1];
  const address = document.getElementById('report-address')?.value.trim() || 'Unspecified Location';
  const ward = document.getElementById('report-ward')?.value || 'Ward 4 - Indiranagar';

  const reporter_name = document.getElementById('report-name')?.value.trim() || 'Citizen';
  const reporter_contact = document.getElementById('report-phone')?.value.trim() || '';

  if (!title || !description) {
    showToast('Please provide an issue title and description.', 'error');
    goToWizardStep(1);
    return;
  }

  const submitBtn = document.getElementById('report-submit-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText = 'Submitting & AI Routing...';
  }

  try {
    const payload = {
      title,
      description,
      location_type,
      institution_id,
      institution_name,
      category,
      latitude,
      longitude,
      address,
      landmark: specificLandmark,
      ward,
      reporter_name,
      reporter_contact,
      photo_url: uploadedPhotoUrl
    };

    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || 'Submission failed');
    }

    const complaint = await res.json();
    showToast(`Issue ${complaint.id} successfully logged!`, 'success');
    
    openSuccessModal(complaint);

    // Reset Form & Wizard
    document.getElementById('issue-report-form').reset();
    resetAIPreview();
    if (document.getElementById('photo-preview-container')) {
      document.getElementById('photo-preview-container').style.display = 'none';
    }
    switchLocationTypeForm('Public / Community');
    goToWizardStep(1);
  } catch (err) {
    console.error('Submission error:', err);
    showToast(err.message, 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Submit Issue Report';
    }
  }
}

function openSuccessModal(complaint) {
  const modal = document.getElementById('report-success-modal');
  if (!modal) return;

  document.getElementById('modal-ticket-id').innerText = complaint.id;
  document.getElementById('modal-ticket-title').innerText = complaint.title;
  document.getElementById('modal-ticket-category').innerText = complaint.category;
  document.getElementById('modal-ticket-priority').innerText = complaint.priority;
  document.getElementById('modal-ticket-priority').className = `badge badge-${complaint.priority.toLowerCase()}`;
  document.getElementById('modal-ticket-status').innerText = complaint.status;

  const trackBtn = document.getElementById('modal-track-btn');
  if (trackBtn) {
    trackBtn.onclick = () => {
      modal.classList.remove('active');
      switchTab('track');
      setTimeout(() => {
        const trackInput = document.getElementById('track-search-input');
        if (trackInput) {
          trackInput.value = complaint.id;
          if (typeof searchComplaintById === 'function') {
            searchComplaintById(complaint.id);
          }
        }
      }, 150);
    };
  }

  modal.classList.add('active');
}

function closeSuccessModal() {
  const modal = document.getElementById('report-success-modal');
  if (modal) modal.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('issue-report-form');
  if (form) {
    form.addEventListener('submit', handleReportSubmit);
  }

  const gpsBtn = document.getElementById('report-use-gps-btn');
  if (gpsBtn) {
    gpsBtn.addEventListener('click', useCurrentGPS);
  }

  // Location type selection bindings (both label cards and radio inputs)
  document.querySelectorAll('.wizard-options-grid label').forEach(lbl => {
    lbl.addEventListener('click', function (e) {
      const radio = this.querySelector('input[name="location_type"]');
      if (radio) {
        selectLocationType(radio.value);
      }
    });
  });

  document.querySelectorAll('input[name="location_type"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      selectLocationType(e.target.value);
    });
    radio.addEventListener('click', (e) => {
      selectLocationType(e.target.value);
    });
  });

  document.querySelectorAll('input[name="category"]').forEach(radio => {
    radio.addEventListener('change', triggerAIPreAnalyze);
  });

  const titleInput = document.getElementById('report-title');
  const descInput = document.getElementById('report-description');
  if (titleInput) titleInput.addEventListener('input', triggerAIPreAnalyze);
  if (descInput) descInput.addEventListener('input', triggerAIPreAnalyze);

  initPhotoUpload();
  selectLocationType('Public / Community');
});

function selectCategoryAndReport(categoryName) {
  if (typeof switchTab === 'function') switchTab('report');
  if (typeof goToWizardStep === 'function') goToWizardStep(1);
  setTimeout(() => {
    const radio = document.querySelector(`input[name="category"][value="${categoryName}"]`);
    if (radio) {
      radio.checked = true;
      radio.dispatchEvent(new Event('change'));
    }
  }, 100);
}