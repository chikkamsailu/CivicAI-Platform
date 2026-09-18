// CivicAI - Issue Reporting Wizard & Live AI Assistant

let reportMap = null;
let reportMarker = null;
let aiDebounceTimer = null;
let uploadedPhotoUrl = null;

const DEFAULT_COORDS = [12.9716, 77.5946]; // Bangalore civic center

function initReportMap() {
  const mapContainer = document.getElementById('report-map');
  if (!mapContainer || reportMap) {
    if (reportMap) reportMap.invalidateSize();
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
    html: `<div style="background:#26717C; width:28px; height:28px; border-radius:50%; border:3px solid #FFF; box-shadow:0 2px 8px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; color:#FFF; font-size:12px;">📍</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
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
  if (coordDisplay) coordDisplay.innerText = `GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;

  triggerAIPreAnalyze();
}

function useCurrentGPS() {
  if (!navigator.geolocation) {
    showToast('Geolocation is not supported by your browser', 'error');
    return;
  }

  showToast('Acquiring precise GPS coordinates...', 'info');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      if (reportMap && reportMarker) {
        reportMap.setView([latitude, longitude], 16);
        reportMarker.setLatLng([latitude, longitude]);
        updateLocationInputs(latitude, longitude);
        showToast('Location updated from device GPS!', 'success');
      }
    },
    (err) => {
      console.warn('Geolocation error:', err);
      showToast('Could not acquire GPS location. Tap map to place pin.', 'error');
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

// Live Interactive AI Pre-Analysis
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
  }, 450);
}

function renderAIPreview(aiData) {
  const panel = document.getElementById('ai-assistant-preview');
  if (!panel) return;

  panel.style.display = 'block';

  // Category & Confidence
  const catEl = document.getElementById('ai-pred-category');
  const confEl = document.getElementById('ai-pred-confidence');
  if (catEl) catEl.innerText = aiData.predicted_category;
  if (confEl) confEl.innerText = `${Math.round(aiData.category_confidence * 100)}% Confidence`;

  // Priority & Reason
  const priEl = document.getElementById('ai-pred-priority');
  const reasonEl = document.getElementById('ai-pred-reason');
  if (priEl) {
    priEl.innerText = aiData.predicted_priority;
    priEl.className = `badge badge-${aiData.predicted_priority.toLowerCase()}`;
  }
  if (reasonEl) reasonEl.innerText = aiData.priority_reason;

  // Recommended Squad
  const teamEl = document.getElementById('ai-rec-team');
  if (teamEl) teamEl.innerText = aiData.recommended_team || 'Municipal Maintenance Division';

  // Duplicate Alert
  const dupBox = document.getElementById('ai-dup-alert');
  if (dupBox) {
    if (aiData.potential_duplicate) {
      dupBox.style.display = 'flex';
      dupBox.innerHTML = `
        <div style="font-size:1.2rem;">⚠️</div>
        <div>
          <strong style="color:var(--amber-500);">Nearby Matching Issue Detected</strong>
          <p style="font-size:0.84rem; margin-top:0.2rem;">Matches active ticket <strong>${aiData.duplicate_ticket_id}</strong> (${Math.round(aiData.duplicate_similarity * 100)}% match). You may still submit to boost resolution priority.</p>
        </div>
      `;
    } else {
      dupBox.style.display = 'none';
    }
  }

  // Auto-sync category selection if user hasn't locked one
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

// Load Institutions for Dropdown
async function populateInstitutionDropdown(selectedType) {
  const select = document.getElementById('report-institution-select');
  const container = document.getElementById('institution-select-container');
  if (!select || !container) return;

  if (selectedType === 'Public / Community' || selectedType === 'Other') {
    container.style.display = 'none';
    select.innerHTML = '<option value="">Not Applicable</option>';
    return;
  }

  container.style.display = 'block';
  select.innerHTML = '<option value="">Select Institution / Campus...</option>';

  try {
    const res = await fetch('/api/institutions');
    if (!res.ok) return;
    const institutions = await res.json();

    const filtered = institutions.filter(inst => {
      if (selectedType === 'School' && inst.type === 'School') return true;
      if (selectedType === 'College / University' && inst.type === 'College / University') return true;
      if (selectedType === 'Office / Workplace' && inst.type === 'Office / Workplace') return true;
      if (selectedType === 'Hospital / Healthcare' && inst.type === 'Hospital') return true;
      if (selectedType === 'Public Institution') return true;
      return false;
    });

    (filtered.length ? filtered : institutions).forEach(inst => {
      const opt = document.createElement('option');
      opt.value = inst.id;
      opt.innerText = `${inst.name} (${inst.ward})`;
      opt.dataset.lat = inst.latitude;
      opt.dataset.lng = inst.longitude;
      opt.dataset.ward = inst.ward;
      opt.dataset.name = inst.name;
      select.appendChild(opt);
    });

    select.onchange = () => {
      const selected = select.options[select.selectedIndex];
      if (selected && selected.dataset.lat && reportMap && reportMarker) {
        const lat = parseFloat(selected.dataset.lat);
        const lng = parseFloat(selected.dataset.lng);
        reportMap.setView([lat, lng], 16);
        reportMarker.setLatLng([lat, lng]);
        updateLocationInputs(lat, lng);

        const wardInput = document.getElementById('report-ward');
        if (wardInput && selected.dataset.ward) {
          wardInput.value = selected.dataset.ward;
        }
      }
    };
  } catch (err) {
    console.error('Error fetching institutions:', err);
  }
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
      
      // Local preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (previewImg && previewContainer) {
          previewImg.src = e.target.result;
          previewContainer.style.display = 'block';
        }
      };
      reader.readAsDataURL(file);

      // Async upload to backend
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
          showToast('Photo uploaded successfully!', 'success');
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
  
  const instSelect = document.getElementById('report-institution-select');
  const institution_id = (instSelect && instSelect.value) ? instSelect.value : null;
  const institution_name = (instSelect && instSelect.selectedIndex > 0) ? instSelect.options[instSelect.selectedIndex].dataset.name : null;

  const latitude = parseFloat(document.getElementById('report-lat')?.value) || DEFAULT_COORDS[0];
  const longitude = parseFloat(document.getElementById('report-lng')?.value) || DEFAULT_COORDS[1];
  const address = document.getElementById('report-address')?.value.trim() || 'Unspecified Location';
  const landmark = document.getElementById('report-landmark')?.value.trim() || '';
  const ward = document.getElementById('report-ward')?.value || 'Ward 4 - Indiranagar';

  const reporter_name = document.getElementById('report-name')?.value.trim() || 'Citizen';
  const reporter_contact = document.getElementById('report-phone')?.value.trim() || '';

  if (!title || !description) {
    showToast('Please provide an issue title and description.', 'error');
    return;
  }

  const submitBtn = document.getElementById('report-submit-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText = 'Submitting & Processing with AI...';
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
      landmark,
      ward,
      reporter_name,
      reporter_contact
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
    showToast(`Issue ${complaint.id} successfully filed!`, 'success');
    
    // Show confirmation modal
    openSuccessModal(complaint);

    // Reset Form
    document.getElementById('issue-report-form').reset();
    resetAIPreview();
    if (document.getElementById('photo-preview-container')) {
      document.getElementById('photo-preview-container').style.display = 'none';
    }
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

// Setup Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('issue-report-form');
  if (form) {
    form.addEventListener('submit', handleReportSubmit);
  }

  const gpsBtn = document.getElementById('report-use-gps-btn');
  if (gpsBtn) {
    gpsBtn.addEventListener('click', useCurrentGPS);
  }

  // Location Type Radio Change
  document.querySelectorAll('input[name="location_type"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      populateInstitutionDropdown(e.target.value);
      triggerAIPreAnalyze();
    });
  });

  // Category Radio Change
  document.querySelectorAll('input[name="category"]').forEach(radio => {
    radio.addEventListener('change', triggerAIPreAnalyze);
  });

  // Real-time Text Inputs
  const titleInput = document.getElementById('report-title');
  const descInput = document.getElementById('report-description');
  if (titleInput) titleInput.addEventListener('input', triggerAIPreAnalyze);
  if (descInput) descInput.addEventListener('input', triggerAIPreAnalyze);

  initPhotoUpload();
});
