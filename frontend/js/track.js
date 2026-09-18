// CivicAI - Complaint Tracking & Visual Progressive Timeline

async function searchComplaintById(ticketId) {
  const queryId = (ticketId || document.getElementById('track-search-input')?.value || '').trim();
  if (!queryId) {
    showToast('Please enter a valid Reference ID (e.g., CIVIC-2026-1001)', 'error');
    return;
  }

  const container = document.getElementById('track-result-container');
  const emptyState = document.getElementById('track-empty-state');
  const loadingState = document.getElementById('track-loading-state');

  if (loadingState) loadingState.style.display = 'block';
  if (container) container.style.display = 'none';
  if (emptyState) emptyState.style.display = 'none';

  try {
    const res = await fetch(`/api/complaints/track/${encodeURIComponent(queryId)}`);
    if (!res.ok) {
      throw new Error(`Ticket '${queryId}' not found. Please verify the Reference ID.`);
    }

    const data = await res.json();
    renderTrackingDocket(data);
  } catch (err) {
    showToast(err.message, 'error');
    if (emptyState) {
      emptyState.style.display = 'block';
      emptyState.querySelector('p').innerText = err.message;
    }
  } finally {
    if (loadingState) loadingState.style.display = 'none';
  }
}

function renderTrackingDocket(data) {
  const container = document.getElementById('track-result-container');
  if (!container) return;

  const { complaint, assigned_team, stages, audit_logs } = data;

  // Header Details
  document.getElementById('track-ticket-id').innerText = complaint.id;
  document.getElementById('track-created-date').innerText = `Reported: ${new Date(complaint.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  
  const statusBadge = document.getElementById('track-status-badge');
  if (statusBadge) {
    statusBadge.innerText = complaint.status;
    statusBadge.className = `badge badge-status-${complaint.status.toLowerCase().replace(/\s+/g, '')}`;
  }

  const priBadge = document.getElementById('track-priority-badge');
  if (priBadge) {
    priBadge.innerText = complaint.priority;
    priBadge.className = `badge badge-${complaint.priority.toLowerCase()}`;
  }

  document.getElementById('track-category-pill').innerText = complaint.category;
  document.getElementById('track-issue-title').innerText = complaint.title;
  document.getElementById('track-issue-desc').innerText = complaint.description;
  document.getElementById('track-location-desc').innerText = `${complaint.address} (${complaint.ward})`;
  
  const instTag = document.getElementById('track-institution-tag');
  if (instTag) {
    if (complaint.institution_name) {
      instTag.style.display = 'inline-flex';
      instTag.innerText = `🏛 ${complaint.institution_name}`;
    } else {
      instTag.style.display = 'none';
    }
  }

  // Assigned Field Squad Card
  const squadBox = document.getElementById('track-assigned-squad-box');
  if (squadBox) {
    if (assigned_team) {
      squadBox.style.display = 'block';
      document.getElementById('track-squad-name').innerText = assigned_team.name;
      document.getElementById('track-squad-lead').innerText = `Squad Lead: ${assigned_team.lead}`;
      document.getElementById('track-squad-dept').innerText = `Dept: ${assigned_team.department}`;
      document.getElementById('track-squad-phone').innerText = `Contact: ${assigned_team.contact}`;
    } else {
      squadBox.style.display = 'none';
    }
  }

  // Step Milestones Timeline
  const timelineContainer = document.getElementById('track-milestones-list');
  if (timelineContainer && stages) {
    timelineContainer.innerHTML = '';
    stages.forEach((stage, idx) => {
      const stepDiv = document.createElement('div');
      stepDiv.className = `timeline-step ${stage.completed ? 'completed' : ''} ${stage.current ? 'current' : ''}`;
      
      const icon = stage.completed ? '✓' : (idx + 1);
      stepDiv.innerHTML = `
        <div class="timeline-marker">${icon}</div>
        <div style="padding-left: 0.5rem;">
          <h4 style="font-size:1.05rem; color: ${stage.completed ? 'var(--navy-900)' : 'var(--text-light)'};">${stage.label}</h4>
          <p style="font-size:0.88rem; margin-top:0.25rem;">${stage.description}</p>
        </div>
      `;
      timelineContainer.appendChild(stepDiv);
    });
  }

  // Evidence Photos Comparison
  const photoSection = document.getElementById('track-photos-section');
  const origPhoto = document.getElementById('track-original-photo');
  const resPhoto = document.getElementById('track-resolution-photo');
  const resNotes = document.getElementById('track-resolution-notes');

  if (photoSection) {
    if (complaint.photo_url || complaint.resolution_photo_url) {
      photoSection.style.display = 'block';
      if (origPhoto) {
        origPhoto.src = complaint.photo_url || '/static/uploads/sample_civic.jpg';
      }
      if (resPhoto) {
        if (complaint.resolution_photo_url) {
          resPhoto.src = complaint.resolution_photo_url;
          resPhoto.parentElement.style.display = 'block';
        } else {
          resPhoto.parentElement.style.display = 'none';
        }
      }
      if (resNotes && complaint.resolution_notes) {
        resNotes.innerText = `Field Action Notes: "${complaint.resolution_notes}"`;
      }
    } else {
      photoSection.style.display = 'none';
    }
  }

  // Audit Logs Trail
  const auditList = document.getElementById('track-audit-list');
  if (auditList && audit_logs) {
    auditList.innerHTML = '';
    audit_logs.forEach(log => {
      const tr = document.createElement('tr');
      const timeStr = new Date(log.timestamp).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      tr.innerHTML = `
        <td style="padding:0.75rem; font-size:0.85rem; color:var(--text-muted);">${timeStr}</td>
        <td style="padding:0.75rem; font-weight:600; font-size:0.88rem;">${log.action}</td>
        <td style="padding:0.75rem; font-size:0.85rem; color:var(--teal-600);">${log.actor}</td>
        <td style="padding:0.75rem; font-size:0.85rem;">${log.notes || '—'}</td>
      `;
      auditList.appendChild(tr);
    });
  }

  container.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
  const trackForm = document.getElementById('track-search-form');
  if (trackForm) {
    trackForm.addEventListener('submit', (e) => {
      e.preventDefault();
      searchComplaintById();
    });
  }

  // Quick Demo Buttons
  document.querySelectorAll('[data-demo-ticket]').forEach(btn => {
    btn.addEventListener('click', () => {
      const ticketId = btn.dataset.demoTicket;
      const input = document.getElementById('track-search-input');
      if (input) input.value = ticketId;
      searchComplaintById(ticketId);
    });
  });
});
