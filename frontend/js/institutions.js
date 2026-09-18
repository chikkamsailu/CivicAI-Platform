// CivicAI - Institutional Management Hub

async function loadInstitutions() {
  const container = document.getElementById('institutions-grid');
  if (!container) return;

  container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:3rem; color:var(--text-muted);">Loading institutional campuses...</div>';

  try {
    const typeFilter = document.getElementById('inst-filter-type')?.value || 'All';
    const params = new URLSearchParams({ type: typeFilter });

    const res = await fetch(`/api/institutions?${params.toString()}`);
    if (!res.ok) return;

    const institutions = await res.json();
    AppState.cachedInstitutions = institutions;
    renderInstitutionsGrid(institutions);
  } catch (err) {
    console.error('Failed to load institutions:', err);
    container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color:var(--coral-500);">Failed to load institutions.</div>';
  }
}

function renderInstitutionsGrid(institutions) {
  const container = document.getElementById('institutions-grid');
  if (!container) return;

  if (institutions.length === 0) {
    container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:3rem;">No institutions match current filter.</div>';
    return;
  }

  container.innerHTML = '';
  institutions.forEach(inst => {
    const card = document.createElement('div');
    card.className = 'card hover-lift';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.justifyContent = 'space-between';

    const typeIcons = {
      'College / University': '🎓',
      'School': '🏫',
      'Hospital': '🏥',
      'Office / Workplace': '🏢',
      'Municipal Facility': '🏛'
    };

    const icon = typeIcons[inst.type] || '📍';

    card.innerHTML = `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
          <span style="font-size:1.75rem;">${icon}</span>
          <span class="badge" style="background:var(--sage-100); color:var(--sage-700);">${inst.type}</span>
        </div>
        <h3 style="font-size:1.15rem; font-weight:700; margin-bottom:0.35rem; color:var(--navy-900);">${inst.name}</h3>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.25rem;">📍 ${inst.address}</p>
        <p style="font-size:0.82rem; color:var(--teal-600); margin-bottom:1.25rem;">Ward: ${inst.ward}</p>

        <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:0.4rem; background:var(--bg-secondary); padding:0.75rem; border-radius:var(--radius-md); text-align:center; margin-bottom:1.25rem;">
          <div>
            <div style="font-size:1.1rem; font-weight:700; color:var(--navy-900);">${inst.total_issues}</div>
            <div style="font-size:0.7rem; text-transform:uppercase; color:var(--text-muted);">Total</div>
          </div>
          <div>
            <div style="font-size:1.1rem; font-weight:700; color:var(--coral-500);">${inst.critical_issues}</div>
            <div style="font-size:0.7rem; text-transform:uppercase; color:var(--text-muted);">Critical</div>
          </div>
          <div>
            <div style="font-size:1.1rem; font-weight:700; color:var(--amber-500);">${inst.in_progress_issues}</div>
            <div style="font-size:0.7rem; text-transform:uppercase; color:var(--text-muted);">Active</div>
          </div>
          <div>
            <div style="font-size:1.1rem; font-weight:700; color:var(--green-500);">${inst.resolved_issues}</div>
            <div style="font-size:0.7rem; text-transform:uppercase; color:var(--text-muted);">Resolved</div>
          </div>
        </div>
      </div>

      <div style="display:flex; gap:0.5rem; margin-top:0.5rem;">
        <button class="btn btn-secondary btn-sm" style="flex:1;" onclick="openInstitutionDocket('${inst.id}')">View Docket</button>
        <button class="btn btn-primary btn-sm" style="flex:1;" onclick="reportForInstitution('${inst.id}', '${inst.name}', '${inst.type}')">+ Report Issue</button>
      </div>
    `;

    container.appendChild(card);
  });
}

async function openInstitutionDocket(instId) {
  const modal = document.getElementById('institution-docket-modal');
  if (!modal) return;

  try {
    const res = await fetch(`/api/institutions/${instId}`);
    if (!res.ok) return;

    const data = await res.json();
    const { institution, complaints } = data;

    document.getElementById('inst-docket-title').innerText = institution.name;
    document.getElementById('inst-docket-meta').innerText = `${institution.type} • ${institution.ward} • Contact: ${institution.contact_person} (${institution.contact_phone || 'N/A'})`;
    
    const list = document.getElementById('inst-docket-list');
    list.innerHTML = '';

    if (complaints.length === 0) {
      list.innerHTML = '<div style="text-align:center; padding:2rem; color:var(--text-muted);">No open or past issues on record for this institution.</div>';
    } else {
      complaints.forEach(c => {
        const item = document.createElement('div');
        item.style.borderBottom = '1px solid var(--border-light)';
        item.style.padding = '0.85rem 0';
        item.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
            <strong style="font-size:0.92rem; color:var(--navy-900);">${c.id}: ${c.title}</strong>
            <div>
              <span class="badge badge-${c.priority.toLowerCase()}">${c.priority}</span>
              <span class="badge badge-status-${c.status.toLowerCase().replace(/\s+/g, '')}">${c.status}</span>
            </div>
          </div>
          <p style="font-size:0.84rem; color:var(--text-muted);">${c.description}</p>
          <div style="display:flex; justify-content:space-between; font-size:0.78rem; color:var(--text-light); margin-top:0.35rem;">
            <span>Category: ${c.category}</span>
            <span>Reported by: ${c.reporter_name}</span>
          </div>
        `;
        list.appendChild(item);
      });
    }

    modal.classList.add('active');
  } catch (err) {
    console.error('Error loading docket:', err);
  }
}

function closeInstitutionDocket() {
  const modal = document.getElementById('institution-docket-modal');
  if (modal) modal.classList.remove('active');
}

function reportForInstitution(instId, instName, instType) {
  switchTab('report');
  setTimeout(() => {
    // Select matching location type
    const radio = document.querySelector(`input[name="location_type"][value="${instType}"]`);
    if (radio) {
      radio.checked = true;
      if (typeof populateInstitutionDropdown === 'function') {
        populateInstitutionDropdown(instType).then(() => {
          const select = document.getElementById('report-institution-select');
          if (select) {
            select.value = instId;
            select.dispatchEvent(new Event('change'));
          }
        });
      }
    }
  }, 150);
}

document.addEventListener('DOMContentLoaded', () => {
  const filter = document.getElementById('inst-filter-type');
  if (filter) {
    filter.addEventListener('change', loadInstitutions);
  }
});
