// app.js - Simplified Daily 10 Applications & AI Interview Prep Coach Controller

let dailyJobs = [];
let activeFilter = 'all';
let pollTimer = null;

// Coach State
let coachJobs = [];
let currentCoachJob = null;
let currentDossier = null;
let speechRecognizer = null;
let isListening = false;

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

// Navigation Elements
const elNavBtnApps = document.getElementById('nav-btn-apps');
const elNavBtnCoach = document.getElementById('nav-btn-coach');
const elViewApps = document.getElementById('view-applications');
const elViewCoach = document.getElementById('view-coach');
const elNavBadgeApps = document.getElementById('nav-badge-apps');
const elNavBadgeCoach = document.getElementById('nav-badge-coach');

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

// Coach View Elements
const elCoachJobSelect = document.getElementById('coach-job-select');
const elCoachRolesCount = document.getElementById('coach-roles-count');
const elCoachRolesList = document.getElementById('coach-roles-list');
const elCoachSearchInput = document.getElementById('coach-search-input');

// Coach Active Card
const elCoachCompanyPill = document.getElementById('coach-company-pill');
const elCoachRegionPill = document.getElementById('coach-region-pill');
const elCoachRoleTitle = document.getElementById('coach-role-title');
const elCoachMetaLine = document.getElementById('coach-meta-line');
const elCoachBtnViewJd = document.getElementById('coach-btn-view-jd');
const elCoachBtnViewLinkedIn = document.getElementById('coach-btn-view-linkedin');

// Coach Pillars
const elCoachCultureText = document.getElementById('coach-culture-text');
const elCoachRoundsContainer = document.getElementById('coach-rounds-container');
const elCoachPitchText = document.getElementById('coach-pitch-text');
const elBtnCopyPitch = document.getElementById('btn-copy-pitch');
const elBtnSpeakPitch = document.getElementById('btn-speak-pitch');
const elCoachTechQuestionsList = document.getElementById('coach-tech-questions-list');
const elCoachStarStoriesList = document.getElementById('coach-star-stories-list');
const elCoachReverseQuestionsList = document.getElementById('coach-reverse-questions-list');

// Mock Room Elements
const elMockActiveQuestion = document.getElementById('mock-active-question');
const elMockQuestionDropdown = document.getElementById('mock-question-dropdown');
const elMockUserAnswer = document.getElementById('mock-user-answer');
const elBtnMockVoice = document.getElementById('btn-mock-voice');
const elVoiceStatusText = document.getElementById('voice-status-text');
const elBtnSubmitCritique = document.getElementById('btn-submit-critique');
const elMockFeedbackBox = document.getElementById('mock-feedback-box');
const elFeedbackScoreNum = document.getElementById('feedback-score-num');
const elFeedbackVerdict = document.getElementById('feedback-verdict');
const elFeedbackTip = document.getElementById('feedback-tip');
const elFeedbackStrengthsList = document.getElementById('feedback-strengths-list');
const elFeedbackGapsList = document.getElementById('feedback-gaps-list');
const elFeedbackElevatedAnswer = document.getElementById('feedback-elevated-answer');

// ==================== INITIALIZATION ====================
window.addEventListener('DOMContentLoaded', () => {
  formatDateHeader();
  setupNavigation();
  checkStatus();
  loadDailyJobs();
  loadArchiveHistory();
  setupTabs();
  setupCoachPillars();
  setupVoiceRecognition();
  requestBrowserNotificationPermission();
});

function formatDateHeader() {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const today = new Date().toLocaleDateString('en-US', options);
  elHeroDate.textContent = `Daily Drop: ${today}`;
}

// Navigation between Daily Applications and Coach View
function setupNavigation() {
  elNavBtnApps.addEventListener('click', () => switchView('applications'));
  elNavBtnCoach.addEventListener('click', () => switchView('coach'));
}

function switchView(viewName) {
  if (viewName === 'applications') {
    elNavBtnApps.classList.add('active');
    elNavBtnCoach.classList.remove('active');
    elViewApps.style.display = 'block';
    elViewCoach.style.display = 'none';
  } else if (viewName === 'coach') {
    elNavBtnCoach.classList.add('active');
    elNavBtnApps.classList.remove('active');
    elViewApps.style.display = 'none';
    elViewCoach.style.display = 'block';
    initCoachView();
  }
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

// ==================== DAILY APPLICATIONS FEED ====================
async function loadDailyJobs() {
  try {
    const res = await fetch('/api/daily');
    const data = await res.json();
    dailyJobs = data.jobs || [];

    if (dailyJobs.length === 0) {
      elJobsContainer.innerHTML = '';
      elEmptyState.style.display = 'block';
      updateStats();
      return;
    }

    elEmptyState.style.display = 'none';
    updateStats();
    renderJobsGrid();
    updateNavBadges();
  } catch (err) {
    console.error('Error loading daily jobs:', err);
  }
}

function updateNavBadges() {
  if (elNavBadgeApps) elNavBadgeApps.textContent = dailyJobs.length;
  // Count applied
  const appliedCount = dailyJobs.filter(j => j.isApplied).length;
  if (elNavBadgeCoach) {
    elNavBadgeCoach.textContent = appliedCount > 0 ? `${appliedCount} Applied` : 'Prep Active';
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
        <button class="btn-action btn-prep-coach" onclick="jumpToCoachForJob('${job.id}')" title="Prepare for this interview with AI Coach">
          🎯 Prep Interview
        </button>
        <a href="${job.sourceUrl}" target="_blank" class="btn-action btn-apply" title="Open job posting on LinkedIn">
          Apply ↗
        </a>
        <a href="${job.pdfUrl}" target="_blank" class="btn-action btn-pdf" title="Download tailored 2-page ATS PDF">
          PDF
        </a>
        <a href="${job.docxUrl}" class="btn-action btn-docx" title="Download tailored Word document">
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

// Jump straight to Coach for a specific role
window.jumpToCoachForJob = function(jobId) {
  const job = dailyJobs.find(j => j.id === jobId);
  switchView('coach');
  if (job) {
    const formatted = {
      JobId: job.id,
      Company: job.company,
      Title: job.title,
      Location: job.location,
      AtsMatchScore: `${job.matchScore || 99}%`,
      PrimaryTrack: job.region === 'India' ? 'India Track' : 'US Track',
      JobUrl: job.sourceUrl,
      Description: job.description
    };
    selectCoachRole(formatted);
  }
};

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
    updateNavBadges();

    showToast(`✓ Marked application submitted for ${job.company}!`);
  } catch (err) {
    alert('Error marking as applied: ' + err.message);
  }
};

// Refresh Today's 10 Jobs
elBtnRefresh.addEventListener('click', async () => {
  if (!confirm("Refresh today's 10 LinkedIn applications? This will run a fresh scan for India & US feeds.")) return;

  elProgressContainer.style.display = 'block';
  elProgressFill.style.width = '10%';
  elProgressStatusText.textContent = 'Contacting LinkedIn feeds for fresh roles...';
  elProgressPct.textContent = '10%';
  elProgressLog.textContent = 'Querying guest endpoints with f_TPR=r86400 & company filters...';

  try {
    await fetch('/api/daily/refresh', { method: 'POST' });
    pollRefreshProgress();
  } catch (err) {
    alert('Error starting refresh: ' + err.message);
    elProgressContainer.style.display = 'none';
  }
});

function pollRefreshProgress() {
  if (pollTimer) clearInterval(pollTimer);
  let pollAttempts = 0;

  pollTimer = setInterval(async () => {
    pollAttempts++;
    try {
      const res = await fetch('/api/progress');
      const data = await res.json();

      elProgressFill.style.width = `${data.percentage}%`;
      elProgressPct.textContent = `${data.percentage}%`;
      elProgressStatusText.textContent = data.statusMessage || 'Processing...';
      elProgressLog.textContent = data.latestLog || 'Working...';

      if (data.isComplete || pollAttempts > 60) {
        clearInterval(pollTimer);
        setTimeout(() => {
          elProgressContainer.style.display = 'none';
          loadDailyJobs();
          showToast("🎉 Daily 10 jobs refreshed and tailored!");
        }, 1200);
      }
    } catch (e) {}
  }, 2500);
}

// Test Notification button
elBtnTestNotify.addEventListener('click', async () => {
  try {
    const res = await fetch('/api/notify-test', { method: 'POST' });
    const data = await res.json();
    showToast("🔔 8:00 PM alert test triggered! (Check Windows notifications)");

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification("Resume Tailor Studio", {
        body: "🎯 Daily 10 Applications Ready (5 India & 5 US)! Apply with tailored resumes.",
        icon: "/files/favicon.ico"
      });
    }
  } catch (e) {
    alert("Notification test failed: " + e.message);
  }
});

// Modal functions
window.openJdModalById = function(jobId) {
  const job = dailyJobs.find(j => j.id === jobId) || coachJobs.find(j => (j.JobId || j.id) === jobId);
  if (!job) return;

  elModalRegion.textContent = job.region === 'India' || job.PrimaryTrack === 'India Track' ? '🇮🇳 India' : '🇺🇸 USA';
  elModalCompany.textContent = job.company || job.Company;
  elModalTitle.textContent = job.title || job.Title;
  elModalDesc.textContent = job.description || job.Description || 'No description available.';
  elModalSourceLink.href = job.sourceUrl || job.JobUrl || '#';
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


// ==================== INTERVIEW PREP COACH CONTROLLER ====================

let coachInitialized = false;

async function initCoachView() {
  if (coachInitialized && coachJobs.length > 0) return;
  await loadCoachJobs();
  coachInitialized = true;
}

async function loadCoachJobs() {
  try {
    const res = await fetch('/api/interview/jobs');
    const data = await res.json();
    coachJobs = data.jobs || [];

    elCoachRolesCount.textContent = coachJobs.length;
    renderCoachRolesList(coachJobs);
    populateCoachDropdown(coachJobs);

    // Auto-select first role
    if (coachJobs.length > 0 && !currentCoachJob) {
      selectCoachRole(coachJobs[0]);
    }
  } catch (err) {
    console.error('Error loading coach jobs:', err);
  }
}

function populateCoachDropdown(jobs) {
  elCoachJobSelect.innerHTML = '<option value="">-- Choose Applied Role --</option>';
  jobs.forEach((job, idx) => {
    const opt = document.createElement('option');
    opt.value = job.JobId || job.id || idx;
    opt.textContent = `${job.Company} - ${job.Title} (${job.Status || 'Applied'})`;
    elCoachJobSelect.appendChild(opt);
  });

  elCoachJobSelect.addEventListener('change', (e) => {
    const selectedId = e.target.value;
    const found = coachJobs.find(j => (j.JobId || j.id) == selectedId);
    if (found) selectCoachRole(found);
  });
}

function renderCoachRolesList(jobs) {
  elCoachRolesList.innerHTML = '';
  if (jobs.length === 0) {
    elCoachRolesList.innerHTML = '<div style="padding:12px; color:var(--text-muted); font-size:0.85rem;">No applied roles found.</div>';
    return;
  }

  jobs.forEach(job => {
    const item = document.createElement('div');
    item.className = 'coach-role-item';
    if (currentCoachJob && (currentCoachJob.JobId === job.JobId || currentCoachJob.JobId === job.id)) {
      item.classList.add('active');
    }

    const appliedLabel = job.Status === 'Applied' ? '✅ Applied' : '🎯 Curated';

    item.innerHTML = `
      <div class="role-item-comp">${escapeHtml(job.Company)}</div>
      <div class="role-item-title">${escapeHtml(job.Title)}</div>
      <div class="role-item-meta">
        <span>${escapeHtml(job.PrimaryTrack || 'Data Track')}</span>
        <span>${appliedLabel}</span>
      </div>
    `;

    item.addEventListener('click', () => selectCoachRole(job));
    elCoachRolesList.appendChild(item);
  });
}

// Role search filter in coach sidebar
elCoachSearchInput.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase().trim();
  const filtered = coachJobs.filter(j => 
    (j.Company || '').toLowerCase().includes(query) || 
    (j.Title || '').toLowerCase().includes(query) ||
    (j.PrimaryTrack || '').toLowerCase().includes(query)
  );
  renderCoachRolesList(filtered);
});

async function selectCoachRole(job) {
  currentCoachJob = job;

  // Highlight in sidebar
  document.querySelectorAll('.coach-role-item').forEach(el => el.classList.remove('active'));
  const foundEl = Array.from(document.querySelectorAll('.coach-role-item')).find(el => 
    el.textContent.includes(job.Company) && el.textContent.includes(job.Title.slice(0, 15))
  );
  if (foundEl) foundEl.classList.add('active');

  // Update Header Card
  elCoachCompanyPill.textContent = job.Company;
  elCoachRoleTitle.textContent = job.Title;
  elCoachRegionPill.textContent = job.PrimaryTrack || (job.region ? `${job.region} Track` : 'Engineering');
  elCoachMetaLine.innerHTML = `Applied: <strong>${job.AppliedDate || 'Recent'}</strong> &bull; Match Score: <strong class="text-success">${job.AtsMatchScore || '99%'}</strong>`;

  elCoachBtnViewLinkedIn.href = job.JobUrl || job.sourceUrl || '#';
  elCoachBtnViewJd.onclick = () => openJdModalById(job.JobId || job.id);

  // Fetch complete 5-pillar dossier
  try {
    const q = new URLSearchParams({
      jobId: job.JobId || job.id || '',
      company: job.Company || '',
      role: job.Title || ''
    });
    const res = await fetch(`/api/interview/dossier?${q.toString()}`);
    currentDossier = await res.json();
    renderDossier(currentDossier);
  } catch (err) {
    console.error('Error fetching interview dossier:', err);
  }
}

function renderDossier(dossier) {
  // Pillar 1: Company Intel & Rounds
  elCoachCultureText.textContent = dossier.dna.culture || 'High engineering standards, measurable delivery, cross-functional collaboration.';
  elCoachRoundsContainer.innerHTML = '';
  (dossier.dna.interviewLoop || []).forEach(r => {
    const card = document.createElement('div');
    card.className = 'round-card';
    card.innerHTML = `
      <div class="round-title">${escapeHtml(r.round)}</div>
      <div class="round-focus">${escapeHtml(r.focus)}</div>
    `;
    elCoachRoundsContainer.appendChild(card);
  });

  // Pillar 2: 90-second Elevator Pitch
  elCoachPitchText.textContent = dossier.elevatorPitch || 'Elevator pitch loading...';

  // Pillar 3: Technical Questions
  elCoachTechQuestionsList.innerHTML = '';
  (dossier.technicalQuestions || []).forEach(q => {
    const qCard = document.createElement('div');
    qCard.className = 'q-card';

    const rubricChips = (q.keyRubricTerms || []).map(t => `<span class="rubric-chip">${escapeHtml(t)}</span>`).join('');

    qCard.innerHTML = `
      <div class="q-card-top">
        <span class="q-category-tag">${escapeHtml(q.category)}</span>
        <button class="btn-subtle" style="padding: 4px 10px; font-size: 0.78rem;" onclick="loadQuestionInMockRoom('${q.id}')">
          🎯 Practice Aloud
        </button>
      </div>
      <div class="q-question-text">${escapeHtml(q.question)}</div>
      <div class="q-eval-text"><strong>Interviewer Evaluates:</strong> ${escapeHtml(q.whatTheyEvaluate)}</div>
      <div class="q-answer-box">
        <div style="font-weight:700; color:#10b981; margin-bottom:4px;">💎 Model Architecture &amp; Answer:</div>
        ${escapeHtml(q.modelAnswer)}
      </div>
      <div class="traps-box">
        <strong>⚠️ Traps to Avoid:</strong> ${escapeHtml(q.trapsToAvoid)}
      </div>
      <div class="rubric-chips">
        <span class="rubric-label">Key Terms Rubric:</span>
        ${rubricChips}
      </div>
    `;
    elCoachTechQuestionsList.appendChild(qCard);
  });

  // Pillar 4: STAR Stories
  elCoachStarStoriesList.innerHTML = '';
  (dossier.starStories || []).forEach(s => {
    const sCard = document.createElement('div');
    sCard.className = 'star-card';
    sCard.innerHTML = `
      <h4>🏆 ${escapeHtml(s.title)}</h4>
      <div class="star-row"><span class="star-tag star-tag-s">Situation:</span><span>${escapeHtml(s.situation)}</span></div>
      <div class="star-row"><span class="star-tag star-tag-t">Task:</span><span>${escapeHtml(s.task)}</span></div>
      <div class="star-row"><span class="star-tag star-tag-a">Action:</span><span>${escapeHtml(s.action)}</span></div>
      <div class="star-row"><span class="star-tag star-tag-r">Result:</span><span><strong>${escapeHtml(s.result)}</strong></span></div>
    `;
    elCoachStarStoriesList.appendChild(sCard);
  });

  // Pillar 5: Populate Mock Room Dropdown
  elMockQuestionDropdown.innerHTML = '<option value="">-- Choose a question to practice --</option>';
  (dossier.technicalQuestions || []).forEach(q => {
    const opt = document.createElement('option');
    opt.value = q.id;
    opt.textContent = `[${q.category}] ${q.question.slice(0, 65)}...`;
    elMockQuestionDropdown.appendChild(opt);
  });

  // Pre-load first question
  if (dossier.technicalQuestions && dossier.technicalQuestions.length > 0) {
    loadQuestionInMockRoom(dossier.technicalQuestions[0].id);
  }

  // Pillar 6: Reverse Questions to Ask Them
  elCoachReverseQuestionsList.innerHTML = '';
  (dossier.reverseQuestions || []).forEach(rq => {
    const rCard = document.createElement('div');
    rCard.className = 'reverse-card';
    rCard.textContent = `\"${rq}\"`;
    elCoachReverseQuestionsList.appendChild(rCard);
  });
}

// Pillar Navigation Tabs in Coach View
function setupCoachPillars() {
  const tabs = document.querySelectorAll('.pillar-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const pillar = tab.dataset.pillar;
      document.querySelectorAll('.pillar-section').forEach(sec => sec.style.display = 'none');
      const targetSec = document.getElementById(`pillar-${pillar}`);
      if (targetSec) targetSec.style.display = 'block';
    });
  });

  // Copy Pitch
  elBtnCopyPitch.addEventListener('click', () => {
    if (currentDossier && currentDossier.elevatorPitch) {
      navigator.clipboard.writeText(currentDossier.elevatorPitch);
      showToast("📋 Elevator pitch copied to clipboard!");
    }
  });

  // Read Aloud Pitch using browser SpeechSynthesis
  elBtnSpeakPitch.addEventListener('click', () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis not supported in this browser.');
      return;
    }
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      elBtnSpeakPitch.textContent = '🔊 Read Aloud';
      return;
    }
    const utter = new SpeechSynthesisUtterance(currentDossier.elevatorPitch);
    utter.rate = 0.95;
    utter.onend = () => { elBtnSpeakPitch.textContent = '🔊 Read Aloud'; };
    window.speechSynthesis.speak(utter);
    elBtnSpeakPitch.textContent = '⏹ Stop Audio';
  });

  // Mock Dropdown selection
  elMockQuestionDropdown.addEventListener('change', (e) => {
    const qId = e.target.value;
    if (qId) loadQuestionInMockRoom(qId);
  });

  // Submit Answer for AI Critique
  elBtnSubmitCritique.addEventListener('click', submitMockCritique);
}

// Load Question into Mock Room and switch to Mock tab
window.loadQuestionInMockRoom = function(qId) {
  if (!currentDossier) return;
  const q = (currentDossier.technicalQuestions || []).find(item => item.id === qId);
  if (!q) return;

  elMockActiveQuestion.textContent = q.question;
  elMockQuestionDropdown.value = q.id;

  // Jump to mock tab
  document.querySelectorAll('.pillar-tab').forEach(t => t.classList.remove('active'));
  const mockTab = document.querySelector('.pillar-tab[data-pillar="mock"]');
  if (mockTab) mockTab.classList.add('active');

  document.querySelectorAll('.pillar-section').forEach(sec => sec.style.display = 'none');
  document.getElementById('pillar-mock').style.display = 'block';

  elMockUserAnswer.value = '';
  elMockFeedbackBox.style.display = 'none';
};

// Web Speech Recognition for Voice Dictation in Mock Room
function setupVoiceRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    elBtnMockVoice.style.display = 'none';
    return;
  }

  speechRecognizer = new SpeechRecognition();
  speechRecognizer.continuous = true;
  speechRecognizer.interimResults = true;
  speechRecognizer.lang = 'en-US';

  speechRecognizer.onresult = (event) => {
    let transcript = '';
    for (let i = 0; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript + ' ';
    }
    elMockUserAnswer.value = transcript.trim();
  };

  speechRecognizer.onerror = (e) => {
    console.warn('Speech recognition error:', e.error);
    stopListening();
  };

  speechRecognizer.onend = () => {
    stopListening();
  };

  elBtnMockVoice.addEventListener('click', () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  });
}

function startListening() {
  if (!speechRecognizer) return;
  try {
    speechRecognizer.start();
    isListening = true;
    elBtnMockVoice.classList.add('listening');
    elVoiceStatusText.textContent = 'Listening... (Speak Now)';
  } catch (err) {
    console.error('Error starting speech:', err);
  }
}

function stopListening() {
  if (speechRecognizer && isListening) {
    speechRecognizer.stop();
  }
  isListening = false;
  elBtnMockVoice.classList.remove('listening');
  elVoiceStatusText.textContent = 'Dictate Answer';
}

// Submit mock answer to Gemini critique endpoint
async function submitMockCritique() {
  const answer = elMockUserAnswer.value.trim();
  const question = elMockActiveQuestion.textContent.trim();
  if (!answer) {
    alert("Please type or speak your answer before requesting critique.");
    return;
  }

  elBtnSubmitCritique.disabled = true;
  elBtnSubmitCritique.textContent = "⏳ Gemini AI is Evaluating Your Response...";
  stopListening();

  try {
    const payload = {
      company: currentCoachJob ? currentCoachJob.Company : "Target Company",
      role: currentCoachJob ? currentCoachJob.Title : "Senior Data Engineer",
      question: question,
      answer: answer,
      questionType: "Technical & Behavioral"
    };

    const res = await fetch('/api/interview/critique', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const critique = await res.json();
    renderCritique(critique);
  } catch (err) {
    alert("Error getting critique: " + err.message);
  } finally {
    elBtnSubmitCritique.disabled = false;
    elBtnSubmitCritique.textContent = "✨ Get Instant AI Coach Feedback & Score";
  }
}

function renderCritique(c) {
  elMockFeedbackBox.style.display = 'flex';

  elFeedbackScoreNum.textContent = c.score || 80;
  elFeedbackVerdict.textContent = c.verdict || 'Hire';
  elFeedbackTip.textContent = c.coachingTip || 'Ground answers in concrete metrics and STAR format.';

  // Color circle based on score
  const scoreCircle = document.getElementById('feedback-score-circle');
  if (c.score >= 85) {
    scoreCircle.style.borderColor = '#10b981';
    elFeedbackVerdict.style.color = '#10b981';
  } else if (c.score >= 70) {
    scoreCircle.style.borderColor = '#38bdf8';
    elFeedbackVerdict.style.color = '#38bdf8';
  } else {
    scoreCircle.style.borderColor = '#f59e0b';
    elFeedbackVerdict.style.color = '#f59e0b';
  }

  // Strengths
  elFeedbackStrengthsList.innerHTML = '';
  (c.strengths || []).forEach(st => {
    const li = document.createElement('li');
    li.textContent = st;
    elFeedbackStrengthsList.appendChild(li);
  });

  // Gaps
  elFeedbackGapsList.innerHTML = '';
  (c.gaps || []).forEach(gap => {
    const li = document.createElement('li');
    li.textContent = gap;
    elFeedbackGapsList.appendChild(li);
  });

  // Elevated Model Answer
  elFeedbackElevatedAnswer.textContent = c.elevatedAnswer || 'Elevated model answer loading...';

  // Smooth scroll down to feedback
  elMockFeedbackBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// In-App Toast
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
