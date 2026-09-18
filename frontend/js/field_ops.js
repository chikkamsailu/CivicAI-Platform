// CivicAI - Field Operations Console

let currentResolvingTicketId = null;

async function loadFieldOps() {
  await Promise.all([loadFieldTeamsBar(), loadWorkOrders()]);
}

async function loadFieldTeamsBar() {
  const container = document.getElementById('field-teams-summary-bar');
  if (!container) return;

  try {
    const res = await fetch('/api/field-ops/teams');
    if (!res.ok) return;
    const teams = await res.json();
    AppState.cachedTeams = teams;

    container.innerHTML = '';
    teams.forEach(t => {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.padding = '0.9rem';
      
      const loadPercent = Math.min(100, Math.round((t.active_workload / t.max_capacity) * 100));
      const barColor = loadPercent > 80 ? 'var(--coral-500)' : loadPercent > 50 ? 'var(--amber-500)' : 'var(--sage-500)';

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
          <strong style="font-size:0.92rem; color:var(--navy-900);">${t.name}</strong>
          <span style="font-size:0.75rem; font-weight:700; color:var(--text-muted);">${t.active_workload}/${t.max_capacity} Active</span>
        </div>
        <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:0.5rem;">Lead: ${t.lead_name} (${t.contact_phone})</div>
        <div style="background:var(--bg-secondary); height:6px; border-radius:3px; overflow:hidden;">
          <div style="width:${loadPercent}%; height:100%; background:${barColor}; transition:width 0.3s ease;"></div>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error('Failed to load field squads:', err);
  }
}

async function loadWorkOrders() {
  const grid = document.getElementById('work-orders-grid');
  if (!grid) return;

  grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:2rem; color:var(--text-muted);">Loading active work orders...</div>';

  const status = document.getElementById('field-filter-status')?.value || 'All';
  const priority = document.getElementById('field-filter-priority')?.value || 'All';

  try {
    const params = new URLSearchParams({ status, priority });
    const res = await fetch(`/api/field-ops/work-orders?${params.toString()}`);
    if (!res.ok) return;

    const orders = await res.json();
    grid.innerHTML = '';

    if (orders.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:2rem; color:var(--text-muted);">No work orders matching filters.</div>';
      return;
    }

    orders.forEach(wo => {
      const c = wo.complaint;
      const team = wo.team;

      const card = document.createElement('div');
      card.className = 'card hover-lift';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.justifyContent = 'space-between';

      let actionBtnHtml = '';
      if (c.status === 'Assigned') {
        actionBtnHtml = `<button class="btn btn-sage btn-sm" style="width:100%;" onclick="startWorkOrder('${c.id}')">🚜 Dispatch Crew to Site</button>`;
      } else if (c.status === 'In Progress') {
        actionBtnHtml = `<button class="btn btn-primary btn-sm" style="width:100%;" onclick="openResolveModal('${c.id}', '${c.title}')">✓ Complete Repair & Submit Proof</button>`;
      } else if (c.status === 'Resolved') {
        actionBtnHtml = `<button class="btn btn-secondary btn-sm" style="width:100%;" onclick="verifyWorkOrder('${c.id}')">🛡 Verify Quality Sign-off</button>`;
      } else if (c.status === 'Verified') {
        actionBtnHtml = `<div style="text-align:center; font-size:0.82rem; color:var(--green-500); font-weight:600;">✓ Verified & Closed</div>`;
      }

      card.innerHTML = `
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
            <span style="font-weight:700; font-size:0.85rem; color:var(--navy-900);">${c.id}</span>
            <span class="badge badge-${c.priority.toLowerCase()}">${c.priority}</span>
          </div>
          <h4 style="font-size:1.05rem; font-weight:700; margin-bottom:0.35rem; color:var(--navy-900);">${c.title}</h4>
          <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.75rem;">${c.description}</p>
          <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.4rem;">📍 <strong>${c.address}</strong> (${c.ward})</div>
          <div style="font-size:0.8rem; color:var(--teal-600); margin-bottom:1rem;">🏢 ${team ? team.name : 'Unassigned'}</div>
        </div>
        <div style="border-top:1px solid var(--border-light); padding-top:0.75rem; margin-top:0.5rem;">
          ${actionBtnHtml}
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    console.error('Failed to load work orders:', err);
  }
}

async function startWorkOrder(complaintId) {
  try {
    const res = await fetch(`/api/field-ops/start-work/${complaintId}`, { method: 'POST' });
    if (res.ok) {
      showToast(`Work order ${complaintId} is now In Progress!`, 'success');
      loadWorkOrders();
      loadFieldTeamsBar();
    }
  } catch (err) {
    showToast('Failed to start work order', 'error');
  }
}

async function verifyWorkOrder(complaintId) {
  try {
    const res = await fetch(`/api/field-ops/verify/${complaintId}`, { method: 'POST' });
    if (res.ok) {
      showToast(`Work order ${complaintId} verified and closed!`, 'success');
      loadWorkOrders();
    }
  } catch (err) {
    showToast('Verification failed', 'error');
  }
}

function openResolveModal(ticketId, title) {
  currentResolvingTicketId = ticketId;
  const modal = document.getElementById('workorder-resolve-modal');
  if (!modal) return;

  document.getElementById('resolve-modal-ticket-id').innerText = ticketId;
  document.getElementById('resolve-modal-ticket-title').innerText = title;
  
  // Populate inventory dropdown
  populateResolveInventoryOptions();
  modal.classList.add('active');
}

async function populateResolveInventoryOptions() {
  const select = document.getElementById('resolve-material-select');
  if (!select) return;

  select.innerHTML = '<option value="">Select Spare Component / Material Used...</option>';
  try {
    const res = await fetch('/api/inventory');
    if (!res.ok) return;
    const items = await res.json();
    items.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.id;
      opt.innerText = `${item.name} (${item.quantity_in_stock} ${item.unit} in stock)`;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error('Failed to load inventory for resolution:', err);
  }
}

function closeResolveModal() {
  const modal = document.getElementById('workorder-resolve-modal');
  if (modal) modal.classList.remove('active');
}

async function submitWorkOrderResolution(e) {
  e.preventDefault();
  if (!currentResolvingTicketId) return;

  const notes = document.getElementById('resolve-notes-input')?.value.trim();
  const photoUrl = document.getElementById('resolve-photo-input')?.value.trim() || '/static/uploads/sample_resolved.jpg';
  const matId = document.getElementById('resolve-material-select')?.value;
  const matQty = parseInt(document.getElementById('resolve-material-qty')?.value) || 1;

  if (!notes) {
    showToast('Please enter field repair notes.', 'error');
    return;
  }

  const materials_used = [];
  if (matId) {
    materials_used.push({
      complaint_id: currentResolvingTicketId,
      item_id: matId,
      quantity_used: matQty,
      notes: 'Applied during field repair resolution'
    });
  }

  try {
    const res = await fetch(`/api/complaints/${currentResolvingTicketId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resolution_notes: notes,
        resolution_photo_url: photoUrl,
        actor: 'Field Operations Crew',
        materials_used
      })
    });

    if (res.ok) {
      showToast(`Work order ${currentResolvingTicketId} resolved successfully!`, 'success');
      closeResolveModal();
      loadWorkOrders();
      loadFieldTeamsBar();
    } else {
      showToast('Resolution submission failed.', 'error');
    }
  } catch (err) {
    console.error('Resolve submit error:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const filterStatus = document.getElementById('field-filter-status');
  const filterPriority = document.getElementById('field-filter-priority');
  if (filterStatus) filterStatus.addEventListener('change', loadWorkOrders);
  if (filterPriority) filterPriority.addEventListener('change', loadWorkOrders);

  const resolveForm = document.getElementById('workorder-resolve-form');
  if (resolveForm) resolveForm.addEventListener('submit', submitWorkOrderResolution);
});
