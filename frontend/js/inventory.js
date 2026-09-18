// CivicAI - Asset & Resource Inventory Management

async function loadInventory() {
  await Promise.all([loadInventoryItems(), loadConsumptionHistory()]);
}

async function loadInventoryItems() {
  const container = document.getElementById('inventory-grid');
  if (!container) return;

  container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:2rem; color:var(--text-muted);">Loading asset inventory...</div>';

  const category = document.getElementById('inv-filter-category')?.value || 'All';
  const status = document.getElementById('inv-filter-status')?.value || 'All';

  try {
    const params = new URLSearchParams({ category, status });
    const res = await fetch(`/api/inventory?${params.toString()}`);
    if (!res.ok) return;

    const items = await res.json();
    container.innerHTML = '';

    if (items.length === 0) {
      container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:2rem;">No inventory items match filter.</div>';
      return;
    }

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'card hover-lift';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.justifyContent = 'space-between';

      const statusBadgeClass = item.status === 'In Stock' ? 'badge-status-resolved' :
                               item.status === 'Low Stock' ? 'badge-high' : 'badge-critical';

      const healthPercent = Math.min(100, Math.round((item.quantity_in_stock / Math.max(item.minimum_threshold * 2, 1)) * 100));
      const barColor = item.status === 'Critical Reorder' ? 'var(--coral-500)' :
                       item.status === 'Low Stock' ? 'var(--amber-500)' : 'var(--sage-500)';

      card.innerHTML = `
        <div>
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem;">
            <span style="font-size:0.75rem; font-weight:700; color:var(--text-light);">${item.id}</span>
            <span class="badge ${statusBadgeClass}">${item.status}</span>
          </div>
          <h4 style="font-size:1.05rem; font-weight:700; color:var(--navy-900); margin-bottom:0.25rem;">${item.name}</h4>
          <p style="font-size:0.8rem; color:var(--teal-600); margin-bottom:1rem;">Category: ${item.category}</p>

          <div style="background:var(--bg-secondary); padding:0.75rem; border-radius:var(--radius-md); margin-bottom:1rem;">
            <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:0.35rem;">
              <span style="color:var(--text-muted);">Stock Available:</span>
              <strong style="color:var(--navy-900);">${item.quantity_in_stock} ${item.unit}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--text-light); margin-bottom:0.5rem;">
              <span>Min. Safety Buffer:</span>
              <span>${item.minimum_threshold} ${item.unit}</span>
            </div>
            <div style="background:#E2E8F0; height:6px; border-radius:3px; overflow:hidden;">
              <div style="width:${healthPercent}%; height:100%; background:${barColor};"></div>
            </div>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-light); padding-top:0.75rem;">
          <span style="font-size:0.85rem; color:var(--text-muted);">Est. Unit: <strong>₹${item.unit_cost.toLocaleString()}</strong></span>
          <button class="btn btn-secondary btn-sm" onclick="openRestockModal('${item.id}', '${item.name}')">+ Restock</button>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error('Failed to load inventory items:', err);
  }
}

async function loadConsumptionHistory() {
  const tableBody = document.getElementById('consumption-history-tbody');
  if (!tableBody) return;

  try {
    const res = await fetch('/api/inventory/consumption-history');
    if (!res.ok) return;

    const logs = await res.json();
    tableBody.innerHTML = '';

    if (logs.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No material consumption records yet.</td></tr>';
      return;
    }

    logs.forEach(log => {
      const tr = document.createElement('tr');
      const timeStr = new Date(log.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      tr.innerHTML = `
        <td style="padding:0.75rem; font-size:0.85rem; color:var(--text-muted);">${timeStr}</td>
        <td style="padding:0.75rem; font-weight:600; font-size:0.85rem; color:var(--teal-600); cursor:pointer;" onclick="viewTrackTicket('${log.complaint_id}')">${log.complaint_id}</td>
        <td style="padding:0.75rem; font-weight:600; font-size:0.88rem;">${log.item_name}</td>
        <td style="padding:0.75rem; font-size:0.88rem;">${log.quantity_used} ${log.unit}</td>
        <td style="padding:0.75rem; font-size:0.85rem; color:var(--text-muted);">${log.notes || 'Field repair'}</td>
      `;
      tableBody.appendChild(tr);
    });
  } catch (err) {
    console.error('Failed to load consumption history:', err);
  }
}

let restockTargetItemId = null;

function openRestockModal(itemId, itemName) {
  restockTargetItemId = itemId;
  const modal = document.getElementById('inventory-restock-modal');
  if (!modal) return;

  document.getElementById('restock-item-name').innerText = itemName;
  document.getElementById('restock-item-id').innerText = itemId;
  modal.classList.add('active');
}

function closeRestockModal() {
  const modal = document.getElementById('inventory-restock-modal');
  if (modal) modal.classList.remove('active');
}

async function handleRestockSubmit(e) {
  e.preventDefault();
  if (!restockTargetItemId) return;

  const qty = parseInt(document.getElementById('restock-qty-input')?.value) || 10;
  try {
    const res = await fetch(`/api/inventory/${restockTargetItemId}/restock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity_to_add: qty })
    });

    if (res.ok) {
      showToast(`Restocked ${qty} units successfully!`, 'success');
      closeRestockModal();
      loadInventoryItems();
    } else {
      showToast('Restock update failed.', 'error');
    }
  } catch (err) {
    console.error('Restock error:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const catFilter = document.getElementById('inv-filter-category');
  const statusFilter = document.getElementById('inv-filter-status');
  if (catFilter) catFilter.addEventListener('change', loadInventoryItems);
  if (statusFilter) statusFilter.addEventListener('change', loadInventoryItems);

  const restockForm = document.getElementById('inventory-restock-form');
  if (restockForm) restockForm.addEventListener('submit', handleRestockSubmit);
});
