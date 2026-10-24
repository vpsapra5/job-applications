// app.js - Simplified Daily 10 Applications Controller (5 India & 5 US)

let dailyJobs = [];
let activeFilter = 'all';
let pollTimer = null;

// Elements
const elHeroDate = document.getElementById('hero-date');
const elJobsContainer = document.getElementById('jobs-container');
const elEmptyState = document.getElementById('empty-state');
const elBtnRefresh = document.getElementById('btn-refresh-daily');
const elBtnTestNotify = document.getElementById('btn-test-notification');
const elProgressContainer = document.getElementById('progress-container');
const elProgressFill = document.getElementById('progress-fill');
const elProgressStatusText = document.getElementById('progress-status-text');
const elProgressPct = document.getElementById('progress-percentage');
const elProgressLog = document.getElementById('progress-log');

// Stats Elements
const elStatTotal = document.getElementById('stat-total');
const elStatIndia = document.getElementById('stat-india');
const elStatUs = document.getElementById('stat-us');
const elStatApplied = document.getElementById('stat-applied');
const elStatAvgMatch = document.getElementById('stat-avg-match');

// Tab Counts
const elTabCountAll = document.getElementById('tab-count-all');
const elTabCountIndia = document.getElementById('tab-count-india');
const elTabCountUs = document.getElementById('tab-count-us');
const elTabCountApplied = document.getElementById('tab-count-applied');

// Modal Elements
const elJdModal = document.getElementById('jd-modal');
const elModalRegion = document.getElementById('modal-region');
const elModalCompany = document.getElementById('modal-company');
const elModalTitle = document.getElementById('modal-title');
const elModalDesc = document.getElementById('modal-description');
const elModalSourceLink = document.getElementById('modal-source-link');
const elBtnCloseModal = document.getElementById('btn-close-modal');
const elBtnModalDismiss = document.getElementById('btn-modal-dismiss');

// Archive
const elArchiveBody = document.getElementById('archive-body');

// Initialize
window.addEventListener('DOMContentLoaded', () => {
  formatDateHeader();
  checkStatus();
  loadDailyJobs();
  loadArchiveHistory();
  setupTabs();
  requestBrowserNotificationPermission();
});

function formatDateHeader() {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const today = new Date().toLocaleDateString('en-US', options);
  elHeroDate.textContent = `Daily Drop: ${today}`;
}

async function requestBrowserNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    try {
      await Notification.requestPermission();
    } catch (e) {}
  }
}

async function checkStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    const elBase = document.getElementById('baseline-text');
    if (data.baselineExists) {
      elBase.textContent = `Master Resume Active (${data.baselineName})`;
    } else {
      elBase.textContent = 'Master Resume Missing';
    }
  } catch (e) {}
}

async function loadDailyJobs() {
  try {
    const res = await fetch('/api/daily');
    const data = await res.json();
    dailyJobs = data.jobs || [];

    // If no jobs exist for today, automatically trigger initial scan
    if (dailyJobs.length === 0) {
      elJobsContainer.innerHTML = '';
      elEmptyState.style.display = 'block';
      updateStats();
      return;
    }

    elEmptyState.style.display = 'none';
    updateStats();
    renderJobsGrid();
  } catch (err) {
    console.error('Error loading daily jobs:', err);
  }
}

function updateStats() {
  const total = dailyJobs.length;
  const india = dailyJobs.filter(j => j.region === 'India').length;
  const us = dailyJobs.filter(j => j.region === 'USA').length;
  const applied = dailyJobs.filter(j => j.isApplied).length;

  elStatTotal.textContent = total;
  elStatIndia.textContent = india;
  elStatUs.textContent = us;
  elStatApplied.textContent = applied;

  elTabCountAll.textContent = total;
  elTabCountIndia.textContent = india;
  elTabCountUs.textContent = us;
  elTabCountApplied.textContent = applied;

  if (total > 0) {
    const sumMatch = dailyJobs.reduce((acc, cur) => acc + (cur.matchScore || 98), 0);
    elStatAvgMatch.textContent = `${Math.round(sumMatch / total)}%`;
  }
}

function setupTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeFilter = tab.dataset.filter;
      renderJobsGrid();
    });
  });
}

function renderJobsGrid() {
  elJobsContainer.innerHTML = '';

  let filtered = dailyJobs;
  if (activeFilter === 'India') {
    filtered = dailyJobs.filter(j => j.region === 'India');
  } else if (activeFilter === 'USA') {
    filtered = dailyJobs.filter(j => j.region === 'USA');
  } else if (activeFilter === 'applied') {
    filtered = dailyJobs.filter(j => j.isApplied);
  }

  if (filtered.length === 0) {
    elEmptyState.style.display = 'block';
    return;
  }
  elEmptyState.style.display = 'none';

  filtered.forEach(job => {
    const card = document.createElement('div');
    card.className = `job-card ${job.isApplied ? 'applied-card' : ''}`;
    card.dataset.jobId = job.id;

    const flag = job.region === 'India' ? '🇮🇳 India' : '🇺🇸 USA';
    const flagClass = job.region === 'India' ? 'badge-india' : 'badge-us';

    let techChips = '';
    if (job.techTags && job.techTags.length > 0) {
      techChips = job.techTags.map(t => `<span class="tech-chip">${escapeHtml(t)}</span>`).join('');
    }

    let bridgedTags = '';
    if (job.synthesizedPoints && job.synthesizedPoints.length > 0) {
      bridgedTags = job.synthesizedPoints.map(p => `<span class="gap-tag">✦ ${escapeHtml(p)}</span>`).join('');
    }

    const appliedBtnHtml = job.isApplied
      ? `<button class="btn-applied applied" disabled>✅ Applied</button>`
      : `<button class="btn-mark-apply" onclick="markAsApplied('${job.id}')">Mark as Applied</button>`;

    card.innerHTML = `
      <div class="card-header">
        <div class="card-pills">
          <span class="region-pill ${flagClass}">${flag}</span>
          <span class="company-badge">${escapeHtml(job.company)}</span>
        </div>
        <span class="match-score">🎯 ${job.matchScore || 99}% Match</span>
      </div>

      <h3 class="job-title">${escapeHtml(job.title)}</h3>
      <div class="job-location">📍 ${escapeHtml(job.location || job.region)}</div>

      <div class="tech-tags-wrap">
        ${techChips}
      </div>

      <div class="job-snippet">
        ${escapeHtml(job.snippet || 'Tailored specifically for this opening.')}
      </div>

      ${bridgedTags ? `<div class="bridged-gaps-row">${bridgedTags}</div>` : ''}

      <div class="card-actions">
        <a href="${job.sourceUrl}" target="_blank" class="btn-action btn-apply" title="Open job posting on LinkedIn">
          Apply on LinkedIn ↗
        </a>
        <a href="${job.pdfUrl}" target="_blank" class="btn-action btn-pdf" title="Download tailored 2-page ATS PDF">
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></svg>
          PDF
        </a>
        <a href="${job.docxUrl}" class="btn-action btn-docx" title="Download tailored Word document">
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8"></path></svg>
          DOCX
        </a>
        <button class="btn-action btn-view-jd" onclick="openJdModalById('${job.id}')" title="Read full job description">
          JD
        </button>
        ${appliedBtnHtml}
      </div>
    `;

    elJobsContainer.appendChild(card);
  });
}

// Mark as applied action
window.markAsApplied = async function(jobId) {
  const job = dailyJobs.find(j => j.id === jobId);
  if (!job) return;

  try {
    const res = await fetch('/api/mark-applied', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: job.id,
        company: job.company,
        title: job.title,
        location: job.location,
        sourceUrl: job.sourceUrl,
        pdfPath: job.pdfUrl,
        docxPath: job.docxUrl,
        matchScore: job.matchScore,
        region: job.region
      })
    });

    job.isApplied = true;
    updateStats();
    renderJobsGrid();

    // Show temporary celebratory alert
    showToast(`✓ Marked application submitted for ${job.company}!`);
  } catch (err) {
    alert('Error marking as applied: ' + err.message);
  }
};

// Modal functions
window.openJdModalById = function(jobId) {
  const job = dailyJobs.find(j => j.id === jobId);
  if (!job) return;

  elModalRegion.textContent = job.region === 'India' ? '🇮🇳 India' : '🇺🇸 USA';
  elModalCompany.textContent = job.company;
  elModalTitle.textContent = job.title;
  elModalDesc.textContent = job.description || 'No description available.';
  elModalSourceLink.href = job.sourceUrl || '#';
  elJdModal.style.display = 'flex';
};

function closeJdModal() {
  elJdModal.style.display = 'none';
}

elBtnCloseModal.addEventListener('click', closeJdModal);
elBtnModalDismiss.addEventListener('click', closeJdModal);
elJdModal.addEventListener('click', (e) => {
  if (e.target === elJdModal) closeJdModal();
});

// Refresh Today's 10 Jobs
elBtnRefresh.addEventListener('click', async () => {
  elBtnRefresh.disabled = true;
  elProgressContainer.style.display = 'block';
  elProgressFill.style.width = '10%';
  elProgressPct.textContent = '10%';
  elProgressStatusText.textContent = 'Scanning fresh corporate postings for India & USA...';
  elProgressLog.textContent = 'Searching past 24 hours on LinkedIn guest feed...';

  try {
    const res = await fetch('/api/daily/refresh', { method: 'POST' });
    startProgressPolling();
  } catch (err) {
    alert('Could not start refresh: ' + err.message);
    elBtnRefresh.disabled = false;
  }
});

function startProgressPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(async () => {
    try {
      const res = await fetch('/api/progress');
      const data = await res.json();

      elProgressFill.style.width = `${data.percentage}%`;
      elProgressPct.textContent = `${data.percentage}%`;
      elProgressStatusText.textContent = data.statusMessage || 'Processing...';
      elProgressLog.textContent = data.latestLog || 'Synthesizing tailored resumes...';

      if (data.isComplete) {
        clearInterval(pollTimer);
        elBtnRefresh.disabled = false;
        elProgressContainer.style.display = 'none';
        showToast('🎯 10 Daily Applications Refreshed & Tailored!');
        await loadDailyJobs();
        loadArchiveHistory();
        elJobsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (e) {}
  }, 1000);
}

// Test Notification Button
elBtnTestNotify.addEventListener('click', async () => {
  try {
    elBtnTestNotify.textContent = 'Sending...';
    await fetch('/api/notify-test', { method: 'POST' });
    elBtnTestNotify.textContent = '🔔 Notification Sent!';
    setTimeout(() => { elBtnTestNotify.textContent = '🔔 Test 8 PM Notification'; }, 3000);

    // Browser Notification fallback
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Resume Tailor Studio', {
        body: '🎯 10 Daily Curated Jobs Ready (5 India & 5 US)! Click to apply.',
        icon: 'favicon.ico'
      });
    }
    showToast('Windows Action Center alert triggered!');
  } catch (err) {
    alert('Could not trigger notification: ' + err.message);
  }
});

// Archive History
async function loadArchiveHistory() {
  try {
    const res = await fetch('/api/results');
    const data = await res.json();
    const batches = data.batches || [];

    if (batches.length === 0) {
      elArchiveBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">No archived batches yet.</td></tr>';
      return;
    }

    elArchiveBody.innerHTML = '';
    batches.slice(0, 15).forEach(item => {
      const tr = document.createElement('tr');
      const gaps = item.synthesizedPoints && item.synthesizedPoints.length > 0
        ? item.synthesizedPoints.map(p => `<span class="gap-tag">✦ ${escapeHtml(p)}</span>`).join(' ')
        : '<span class="gap-tag">Tailored ATS Match</span>';

      const statusBadge = item.isArchived
        ? `<span class="badge-status badge-archived">Archived (Applied)</span>`
        : `<span class="badge-status badge-active">Active Batch</span>`;

      tr.innerHTML = `
        <td>
          <div style="font-weight:600; color:#fff;">${escapeHtml(item.company)}</div>
          <div style="font-size:0.8rem; color:var(--text-muted);">${escapeHtml(item.role)}</div>
        </td>
        <td><div style="display:flex; flex-wrap:wrap; gap:4px;">${gaps}</div></td>
        <td>${statusBadge}</td>
        <td>
          <div style="display:flex; gap:6px;">
            <a href="${item.pdfUrl}" target="_blank" class="btn-action btn-pdf" style="padding:4px 10px; font-size:0.75rem;">PDF</a>
            <a href="${item.docxUrl}" class="btn-action btn-docx" style="padding:4px 10px; font-size:0.75rem;">DOCX</a>
          </div>
        </td>
      `;
      elArchiveBody.appendChild(tr);
    });
  } catch (e) {}
}

// Simple toast notification popup
function showToast(msg) {
  let toast = document.getElementById('studio-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'studio-toast';
    toast.className = 'studio-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => { toast.classList.remove('show'); }, 3500);
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}
