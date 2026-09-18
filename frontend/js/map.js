// CivicAI - GIS Command Center & Spatial Geo-Intelligence

let gisMap = null;
let gisMarkerLayer = null;
let gisHotspotLayer = null;
let gisInstitutionLayer = null;

function initGISMap() {
  const container = document.getElementById('gis-map');
  if (!container) return;

  if (gisMap) {
    gisMap.invalidateSize();
    loadGISData();
    return;
  }

  gisMap = L.map('gis-map', {
    zoomControl: true,
    scrollWheelZoom: true
  }).setView([12.9716, 77.5946], 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors | CivicAI Geo-Intelligence'
  }).addTo(gisMap);

  gisMarkerLayer = L.layerGroup().addTo(gisMap);
  gisHotspotLayer = L.layerGroup().addTo(gisMap);
  gisInstitutionLayer = L.layerGroup().addTo(gisMap);

  // Setup Map Filter Listeners
  const filterCategory = document.getElementById('gis-filter-category');
  const filterPriority = document.getElementById('gis-filter-priority');
  const filterStatus = document.getElementById('gis-filter-status');
  const filterWard = document.getElementById('gis-filter-ward');

  [filterCategory, filterPriority, filterStatus, filterWard].forEach(el => {
    if (el) el.addEventListener('change', () => loadGISData());
  });

  const toggleHotspots = document.getElementById('gis-toggle-hotspots');
  if (toggleHotspots) {
    toggleHotspots.addEventListener('change', (e) => {
      if (e.target.checked) gisMap.addLayer(gisHotspotLayer);
      else gisMap.removeLayer(gisHotspotLayer);
    });
  }

  const toggleInstitutions = document.getElementById('gis-toggle-institutions');
  if (toggleInstitutions) {
    toggleInstitutions.addEventListener('change', (e) => {
      if (e.target.checked) gisMap.addLayer(gisInstitutionLayer);
      else gisMap.removeLayer(gisInstitutionLayer);
    });
  }

  loadGISData();
}

async function loadGISData() {
  if (!gisMap) return;

  const category = document.getElementById('gis-filter-category')?.value || 'All';
  const priority = document.getElementById('gis-filter-priority')?.value || 'All';
  const status = document.getElementById('gis-filter-status')?.value || 'All';
  const ward = document.getElementById('gis-filter-ward')?.value || 'All';

  try {
    const params = new URLSearchParams({ category, priority, status, ward });
    const res = await fetch(`/api/gis/map-data?${params.toString()}`);
    if (!res.ok) return;

    const data = await res.json();
    renderGISLayers(data);
  } catch (err) {
    console.error('Failed to load GIS data:', err);
  }
}

function renderGISLayers(data) {
  gisMarkerLayer.clearLayers();
  gisHotspotLayer.clearLayers();
  gisInstitutionLayer.clearLayers();

  const { markers, institutions, hotspots } = data;

  // Render Complaints Markers
  let criticalCount = 0;
  let inProgressCount = 0;
  let resolvedCount = 0;

  markers.forEach(c => {
    if (c.priority === 'Critical') criticalCount++;
    if (c.status === 'In Progress') inProgressCount++;
    if (c.status === 'Resolved' || c.status === 'Verified') resolvedCount++;

    const isCritical = c.priority === 'Critical';
    const color = c.priority === 'Critical' ? '#DF6347' :
                  c.priority === 'High' ? '#E59A26' :
                  c.priority === 'Medium' ? '#4B88E2' : '#448974';

    const pulseClass = isCritical ? 'pulse-critical' : '';

    const iconHtml = `
      <div style="position:relative; width:26px; height:26px;">
        <div class="${pulseClass}" style="position:absolute; inset:0; border-radius:50%; background:${color}; border:2px solid #FFF; box-shadow:0 2px 6px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; color:#FFF; font-size:11px; font-weight:700;">
          ${c.category.charAt(0)}
        </div>
      </div>
    `;

    const customIcon = L.divIcon({
      className: 'gis-marker-div',
      html: iconHtml,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });

    const marker = L.marker([c.latitude, c.longitude], { icon: customIcon });

    const popupHtml = `
      <div style="min-width:230px; font-family:var(--font-body); padding:4px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="font-weight:700; font-size:11px; color:#566573;">${c.id}</span>
          <span class="badge badge-${c.priority.toLowerCase()}" style="font-size:10px; padding:1px 6px;">${c.priority}</span>
        </div>
        <h4 style="font-size:13px; font-weight:600; line-height:1.3; margin-bottom:4px;">${c.title}</h4>
        <p style="font-size:11px; color:#566573; margin-bottom:8px;">📍 ${c.address} (${c.ward})</p>
        <div style="display:flex; gap:6px; margin-top:8px;">
          <button class="btn btn-primary btn-sm" style="flex:1; font-size:11px; padding:4px;" onclick="viewTrackTicket('${c.id}')">Track Ticket</button>
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml);
    gisMarkerLayer.addLayer(marker);
  });

  // Render Institutions Layer
  institutions.forEach(inst => {
    const instIcon = L.divIcon({
      className: 'gis-inst-div',
      html: `<div style="background:#192A3E; width:28px; height:28px; border-radius:6px; border:2px solid #FFF; display:flex; align-items:center; justify-content:center; font-size:14px; box-shadow:0 2px 8px rgba(0,0,0,0.35);">🏛</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const instMarker = L.marker([inst.latitude, inst.longitude], { icon: instIcon });
    instMarker.bindPopup(`
      <div style="min-width:210px; font-family:var(--font-body); padding:4px;">
        <span class="badge" style="background:#E1EDE6; color:#275647; font-size:10px; margin-bottom:4px;">${inst.type}</span>
        <h4 style="font-size:13px; font-weight:700; margin:4px 0;">${inst.name}</h4>
        <p style="font-size:11px; color:#566573;">📍 ${inst.address}</p>
        <p style="font-size:11px; color:#26717C; margin-top:4px;">Contact: ${inst.contact_person}</p>
      </div>
    `);
    gisInstitutionLayer.addLayer(instMarker);
  });

  // Render Hotspots Layer
  hotspots.forEach(hs => {
    const circle = L.circle([hs.latitude, hs.longitude], {
      radius: hs.radius_meters || 600,
      color: '#DF6347',
      fillColor: '#E05D44',
      fillOpacity: Math.min(0.28, 0.08 + (hs.severity_index * 0.015)),
      weight: 1.5
    });

    circle.bindTooltip(`
      <strong>${hs.ward} Hotspot</strong><br>
      ${hs.issue_count} total issues (${hs.critical_count} critical)
    `);
    gisHotspotLayer.addLayer(circle);
  });

  // Update GIS Stats Sidebar
  document.getElementById('gis-count-total').innerText = markers.length;
  document.getElementById('gis-count-critical').innerText = criticalCount;
  document.getElementById('gis-count-progress').innerText = inProgressCount;
  document.getElementById('gis-count-resolved').innerText = resolvedCount;

  // Render Hotspots List
  const hotspotsList = document.getElementById('gis-hotspots-list');
  if (hotspotsList) {
    hotspotsList.innerHTML = '';
    hotspots.slice(0, 4).forEach(hs => {
      const item = document.createElement('div');
      item.className = 'card';
      item.style.padding = '0.85rem';
      item.style.marginBottom = '0.65rem';
      item.style.cursor = 'pointer';
      item.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="font-size:0.9rem; color:var(--navy-900);">${hs.ward}</strong>
          <span class="badge badge-critical" style="font-size:0.75rem;">Risk ${hs.severity_index}</span>
        </div>
        <p style="font-size:0.8rem; margin-top:0.3rem;">${hs.issue_count} reports • ${hs.critical_count} critical</p>
      `;
      item.onclick = () => {
        gisMap.setView([hs.latitude, hs.longitude], 14, { animate: true });
      };
      hotspotsList.appendChild(item);
    });
  }
}

function viewTrackTicket(ticketId) {
  switchTab('track');
  setTimeout(() => {
    const input = document.getElementById('track-search-input');
    if (input) {
      input.value = ticketId;
      if (typeof searchComplaintById === 'function') {
        searchComplaintById(ticketId);
      }
    }
  }, 150);
}
