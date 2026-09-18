// CivicAI - Core Application Controller

const API_BASE = '';

// Global App State
const AppState = {
  currentTab: 'home',
  cachedInsights: null,
  cachedInstitutions: [],
  cachedTeams: [],
  activeComplaint: null
};

// Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  
  const icon = type === 'success' ? '✓' : type === 'error' ? '⚠' : 'ℹ';
  toast.innerHTML = `<span style="font-weight:700;">${icon}</span> <span>${message}</span>`;
  
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Navigation Tab Switcher
function switchTab(tabId) {
  AppState.currentTab = tabId;

  // Update Nav Buttons
  document.querySelectorAll('.nav-item-btn').forEach(btn => {
    if (btn.dataset.tab === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update Section Visibility
  document.querySelectorAll('.tab-content').forEach(sec => {
    if (sec.id === `tab-${tabId}`) {
      sec.classList.add('active');
      sec.classList.add('fade-in');
    } else {
      sec.classList.remove('active');
      sec.classList.remove('fade-in');
    }
  });

  // Mobile menu close
  const navLinks = document.querySelector('.nav-links');
  if (navLinks) navLinks.classList.remove('mobile-open');

  // Trigger section-specific initializations
  if (tabId === 'gis' && typeof initGISMap === 'function') {
    setTimeout(initGISMap, 150);
  } else if (tabId === 'report' && typeof initReportMap === 'function') {
    setTimeout(initReportMap, 150);
  } else if (tabId === 'institutions' && typeof loadInstitutions === 'function') {
    loadInstitutions();
  } else if (tabId === 'field-ops' && typeof loadFieldOps === 'function') {
    loadFieldOps();
  } else if (tabId === 'inventory' && typeof loadInventory === 'function') {
    loadInventory();
  } else if (tabId === 'dashboard' && typeof loadDashboard === 'function') {
    loadDashboard();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Live Civic Wave Canvas Background
function initWaveCanvas() {
  const canvas = document.getElementById('hero-wave-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let animationId;
  let width, height;
  let step = 0;

  function resize() {
    if (!canvas.parentElement) return;
    width = canvas.width = canvas.parentElement.offsetWidth;
    height = canvas.height = canvas.parentElement.offsetHeight;
  }

  window.addEventListener('resize', resize);
  resize();

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Wave 1: Soft Mint / Sage
    ctx.beginPath();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(68, 137, 116, 0.28)';
    for (let x = 0; x < width; x += 10) {
      const y = Math.sin((x * 0.004) + step) * 35 + Math.cos((x * 0.002) + step * 0.5) * 20 + (height * 0.55);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Wave 2: Muted Teal
    ctx.beginPath();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = 'rgba(38, 113, 124, 0.22)';
    for (let x = 0; x < width; x += 10) {
      const y = Math.cos((x * 0.005) - (step * 0.8)) * 30 + Math.sin((x * 0.003) + step) * 25 + (height * 0.58);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Wave 3: Subtle Sky Blue
    ctx.beginPath();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(80, 140, 215, 0.20)';
    for (let x = 0; x < width; x += 10) {
      const y = Math.sin((x * 0.003) + (step * 1.2)) * 25 + (height * 0.62);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    step += 0.015;
    animationId = requestAnimationFrame(draw);
  }

  draw();
}

// Fetch and Update Platform Statistics
async function loadHeroStats() {
  try {
    const res = await fetch(`${API_BASE}/api/ai/insights`);
    if (!res.ok) return;
    const data = await res.json();
    AppState.cachedInsights = data;

    const elTotal = document.getElementById('stat-total-reports');
    const elResolved = document.getElementById('stat-resolved-rate');
    const elSLA = document.getElementById('stat-avg-sla');
    const elActive = document.getElementById('stat-active-resolving');

    if (elTotal) elTotal.innerText = data.total || 24;
    if (elResolved) elResolved.innerText = `${data.resolution_rate || 58}%`;
    if (elSLA) elSLA.innerText = `${data.avg_resolution_hours || 18}h`;
    if (elActive) elActive.innerText = (data.open + data.in_progress) || 10;
  } catch (err) {
    console.error('Failed to load hero stats:', err);
  }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initWaveCanvas();
  loadHeroStats();

  // Mobile Menu Toggle
  const toggleBtn = document.querySelector('.mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-open');
    });
  }

  // Navigation Click Handlers
  document.querySelectorAll('.nav-item-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });

  // Global CTA Quick Buttons
  document.querySelectorAll('[data-action="report-issue"]').forEach(btn => {
    btn.addEventListener('click', () => switchTab('report'));
  });

  document.querySelectorAll('[data-action="explore-platform"]').forEach(btn => {
    btn.addEventListener('click', () => switchTab('gis'));
  });

  // Track Form on Hero
  const heroTrackForm = document.getElementById('hero-quick-track-form');
  if (heroTrackForm) {
    heroTrackForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('hero-track-id-input');
      if (input && input.value.trim()) {
        switchTab('track');
        setTimeout(() => {
          const trackInput = document.getElementById('track-search-input');
          if (trackInput) {
            trackInput.value = input.value.trim();
            if (typeof searchComplaintById === 'function') {
              searchComplaintById(input.value.trim());
            }
          }
        }, 150);
      }
    });
  }
});
