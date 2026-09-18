// CivicAI - Municipal Command Center & AI Analytics Dashboard

let allComplaintsCache = [];

async function loadDashboard() {
  await Promise.all([loadDashboardInsights(), loadComplaintsRegistry()]);
}

async function loadDashboardInsights() {
  try {
    const res = await fetch('/api/ai/insights');
    if (!res.ok) return;

    const data = await res.json();

    // Top Metric KPIs
    document.getElementById('dash-kpi-total').innerText = data.total;
    document.getElementById('dash-kpi-critical').innerText = data.critical;
    document.getElementById('dash-kpi-open').innerText = data.open;
    document.getElementById('dash-kpi-progress').innerText = data.in_progress;
    document.getElementById('dash-kpi-resolved').innerText = data.resolved;
    document.getElementById('dash-kpi-rate').innerText = `${data.resolution_rate}%`;
    document.getElementById('dash-kpi-sla').innerText = `${data.avg_resolution_hours}h`;

    // Render Category Distribution Chart
    renderCategoryChart(data.category_distribution, data.total);

    // Render Priority Breakdown
    renderPriorityBreakdown(data.priority_distribution, data.total);

    // Render Ward Hotspots Ranking
    renderWardHotspotsTable(data.ward_hotspots);

    // Render Actionable AI Insights Cards
    renderActionableInsights(data.actionable_insights);
  } catch (err) {
    console.error('Failed to load dashboard insights:', err);
  }
}

function renderCategoryChart(catDist, total) {
  const container = document.getElementById('dash-category-chart');
  if (!container) return;

  container.innerHTML = '';
  const entries = Object.entries(catDist || {}).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding:2rem; color:var(--text-muted);">No category data available.</div>';
    return;
  }

  entries.slice(0, 6).forEach(([cat, count]) => {
    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
    const row = document.createElement('div');
    row.style.marginBottom = '0.75rem';

    row.innerHTML = `
      <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:0.25rem;">
        <span style="font-weight:600; color:var(--navy-900);">${cat}</span>
        <span style="color:var(--text-muted);">${count} issues (${percent}%)</span>
      </div>
      <div style="background:var(--bg-secondary); height:8px; border-radius:4px; overflow:hidden;">
        <div style="width:${percent}%; height:100%; background:linear-gradient(90deg, #35705E, #26717C); border-radius:4px; transition:width 0.6s ease;"></div>
      </div>
    `;
    container.appendChild(row);
  });
}

function renderPriorityBreakdown(priDist, total) {
  const container = document.getElementById('dash-priority-breakdown');
  if (!container) return;

  const priorities = [
    { key: 'Critical', label: 'Critical', color: 'var(--coral-500)', bg: 'var(--coral-100)' },
    { key: 'High', label: 'High', color: 'var(--amber-500)', bg: 'var(--amber-100)' },
    { key: 'Medium', label: 'Medium', color: 'var(--blue-500)', bg: 'var(--blue-100)' },
    { key: 'Low', label: 'Low', color: 'var(--sage-600)', bg: 'var(--sage-100)' }
  ];

  container.innerHTML = '';
  priorities.forEach(p => {
    const count = (priDist && priDist[p.key]) || 0;
    const percent = total > 0 ? Math.round((count / total) * 100) : 0;

    const div = document.createElement('div');
    div.style.background = 'var(--bg-secondary)';
    div.style.padding = '0.75rem';
    div.style.borderRadius = 'var(--radius-md)';
    div.style.textAlign = 'center';

    div.innerHTML = `
      <div style="font-size:1.3rem; font-weight:700; color:${p.color};">${count}</div>
      <div style="font-size:0.75rem; font-weight:600; text-transform:uppercase; color:var(--text-muted); margin-top:0.15rem;">${p.label}</div>
      <div style="font-size:0.72rem; color:var(--text-light); margin-top:0.1rem;">${percent}% of total</div>
    `;
    container.appendChild(div);
  });
}

function renderWardHotspotsTable(hotspots) {
  const tbody = document.getElementById('dash-hotspots-tbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (!hotspots || hotspots.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1rem;">No hotspot clusters detected.</td></tr>';
    return;
  }

  hotspots.slice(0, 5).forEach((hs, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="padding:0.75rem; font-weight:700; color:var(--navy-900);">#${idx + 1} ${hs.ward}</td>
      <td style="padding:0.75rem;">${hs.total_issues}</td>
      <td style="padding:0.75rem; font-weight:700; color:var(--coral-500);">${hs.critical_issues}</td>
      <td style="padding:0.75rem;"><span class="badge badge-critical">Risk ${hs.risk_score}</span></td>
      <td style="padding:0.75rem; font-size:0.85rem; color:var(--text-muted);">${hs.top_category}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderActionableInsights(insights) {
  const container = document.getElementById('dash-actionable-insights');
  if (!container) return;

  container.innerHTML = '';
  if (!insights || insights.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted); padding:1rem;">AI Intelligence Engine analyzing live signals...</div>';
    return;
  }

  insights.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.padding = '1rem';
    card.style.borderLeft = '4px solid var(--teal-500)';

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
        <span class="badge" style="background:var(--teal-50); color:var(--teal-600); font-size:0.75rem;">${item.badge}</span>
        <span style="font-size:0.75rem; color:var(--text-light);">AI Advisory</span>
      </div>
      <h4 style="font-size:0.95rem; font-weight:700; margin-bottom:0.25rem; color:var(--navy-900);">${item.title}</h4>
      <p style="font-size:0.85rem; color:var(--text-muted); line-height:1.4;">${item.detail}</p>
    `;
    container.appendChild(card);
  });
}

async function loadComplaintsRegistry() {
  const tbody = document.getElementById('dash-registry-tbody');
  if (!tbody) return;

  try {
    const res = await fetch('/api/complaints?limit=100');
    if (!res.ok) return;

    allComplaintsCache = await res.json();
    filterAndRenderRegistry();
  } catch (err) {
    console.error('Failed to load complaints registry:', err);
  }
}

function filterAndRenderRegistry() {
  const tbody = document.getElementById('dash-registry-tbody');
  if (!tbody) return;

  const search = document.getElementById('dash-registry-search')?.value.toLowerCase() || '';
  const status = document.getElementById('dash-registry-status')?.value || 'All';

  const filtered = allComplaintsCache.filter(c => {
    const matchesSearch = !search ||
      c.id.toLowerCase().includes(search) ||
      c.title.toLowerCase().includes(search) ||
      c.ward.toLowerCase().includes(search) ||
      c.category.toLowerCase().includes(search);

    const matchesStatus = status === 'All' || c.status === status;
    return matchesSearch && matchesStatus;
  });

  tbody.innerHTML = '';
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No matching complaints found.</td></tr>';
    return;
  }

  filtered.forEach(c => {
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid var(--border-light)';
    
    tr.innerHTML = `
      <td style="padding:0.75rem; font-weight:700; color:var(--teal-600); cursor:pointer;" onclick="viewTrackTicket('${c.id}')">${c.id}</td>
      <td style="padding:0.75rem; font-weight:600; font-size:0.9rem; color:var(--navy-900); max-width:260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${c.title}</td>
      <td style="padding:0.75rem; font-size:0.85rem;">${c.category}</td>
      <td style="padding:0.75rem;"><span class="badge badge-${c.priority.toLowerCase()}">${c.priority}</span></td>
      <td style="padding:0.75rem;"><span class="badge badge-status-${c.status.toLowerCase().replace(/\s+/g, '')}">${c.status}</span></td>
      <td style="padding:0.75rem; font-size:0.85rem; color:var(--text-muted);">${c.ward}</td>
      <td style="padding:0.75rem; text-align:right;">
        <button class="btn btn-secondary btn-sm" onclick="viewTrackTicket('${c.id}')">Track</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function exportRegistryCSV() {
  if (!allComplaintsCache || allComplaintsCache.length === 0) {
    showToast('No data available to export.', 'error');
    return;
  }

  const headers = ['ID', 'Title', 'Category', 'Priority', 'Status', 'Ward', 'Address', 'Location Type', 'Institution', 'Created At'];
  const rows = allComplaintsCache.map(c => [
    `"${c.id}"`,
    `"${c.title.replace(/"/g, '""')}"`,
    `"${c.category}"`,
    `"${c.priority}"`,
    `"${c.status}"`,
    `"${c.ward}"`,
    `"${c.address.replace(/"/g, '""')}"`,
    `"${c.location_type}"`,
    `"${c.institution_name || ''}"`,
    `"${c.created_at}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `CivicAI_Complaints_Export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast('Exported CSV successfully!', 'success');
}

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('dash-registry-search');
  const statusSelect = document.getElementById('dash-registry-status');
  const exportBtn = document.getElementById('dash-export-csv-btn');

  if (searchInput) searchInput.addEventListener('input', filterAndRenderRegistry);
  if (statusSelect) statusSelect.addEventListener('change', filterAndRenderRegistry);
  if (exportBtn) exportBtn.addEventListener('click', exportRegistryCSV);
});
