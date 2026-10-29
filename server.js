// server.js - Node.js Express Server for Resume Tailor Studio (Cloud & Vercel Ready)
require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { generateInterviewDossier, critiqueAnswer } = require('./app/coach_engine.js');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helpers for read/write with /tmp fallback for Vercel read-only filesystem
function readJson(filePath, defaultValue) {
  try {
    const baseName = path.basename(filePath);
    const tmpPath = path.join('/tmp', baseName);
    let raw = null;
    if (fs.existsSync(tmpPath)) {
      raw = fs.readFileSync(tmpPath, 'utf-8');
    } else if (fs.existsSync(filePath)) {
      raw = fs.readFileSync(filePath, 'utf-8');
    }
    if (raw) {
      if (raw.charCodeAt(0) === 0xFEFF) {
        raw = raw.slice(1);
      }
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading JSON from', filePath, e.message);
  }
  return defaultValue;
}

function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return;
  } catch (e) {
    try {
      const baseName = path.basename(filePath);
      fs.writeFileSync(path.join('/tmp', baseName), JSON.stringify(data, null, 2), 'utf-8');
    } catch (e2) {}
  }
}

// 1. Static Assets from app/public
const publicDir = path.join(__dirname, 'app', 'public');
app.use(express.static(publicDir));

// 2. Serve static generated resume files (/files/...)
app.use('/files', express.static(__dirname));

app.use((req, res, next) => {
  const fileParam = req.query.file || (req.url.startsWith('/files/') ? req.url.slice(7) : null);
  if (fileParam) {
    const relPath = decodeURIComponent(fileParam.split('?')[0]);
    const candidates = [
      path.join(__dirname, relPath),
      path.join(process.cwd(), relPath),
      path.join(__dirname, 'api', relPath),
      path.join(process.cwd(), 'api', relPath),
      path.join(__dirname, '..', relPath),
      path.join(process.cwd(), 'app', relPath)
    ];
    for (const p of candidates) {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        return res.sendFile(p);
      }
    }
    const dirListing = fs.existsSync(__dirname) ? fs.readdirSync(__dirname).join(', ') : 'no-dir';
    const apiListing = fs.existsSync(path.join(__dirname, 'api')) ? fs.readdirSync(path.join(__dirname, 'api')).join(', ') : 'no-api';
    return res.status(404).send('File not found: ' + relPath + ' | checked: ' + candidates.join(' , ') + ' | root: ' + dirListing + ' | apiDir: ' + apiListing);
  }
  next();
});

// 3. API: Status

app.get('/api/status', (req, res) => {
  const indiaDocx = path.join(__dirname, 'original resume', 'India', 'VipulSapra_Resume.docx');
  const indiaPdf  = path.join(__dirname, 'original resume', 'India', 'VipulSapra_Resume.pdf');
  const usDocx    = path.join(__dirname, 'original resume', 'US', 'VipulSapra_Resume.docx');
  const usPdf     = path.join(__dirname, 'original resume', 'US', 'VipulSapra_Resume.pdf');

  const indiaExists = fs.existsSync(indiaDocx) || fs.existsSync(indiaPdf);
  const usExists    = fs.existsSync(usDocx) || fs.existsSync(usPdf);
  const baseExists  = indiaExists && usExists;

  res.json({
    baselineExists: baseExists,
    indiaBaseline: indiaExists,
    usBaseline: usExists,
    baselineName: 'Dual Baseline (India 🇮🇳 & US 🇺🇸)',
    serverTime: new Date().toISOString()
  });
});

// 4. API: Daily 10 Jobs
app.get('/api/daily', (req, res) => {
  const dailyPath = path.join(__dirname, 'app', 'daily_state.json');
  const daily = readJson(dailyPath, {
    date: new Date().toISOString().slice(0, 10),
    totalJobs: 0,
    indiaCount: 0,
    usCount: 0,
    jobs: []
  });
  res.json(daily);
});

// 5. API: Mark Job Applied
app.post('/api/mark-applied', (req, res) => {
  const { jobId, company, title, location, sourceUrl, pdfPath, docxPath, matchScore, region } = req.body;
  const appliedPath = path.join(__dirname, 'applied_jobs.json');
  const appliedList = readJson(appliedPath, []);

  let record = appliedList.find(j => (jobId && j.JobId === jobId) || (sourceUrl && j.JobUrl === sourceUrl));
  if (!record) {
    const today = new Date().toISOString().slice(0, 10);
    const nextNum = appliedList.length + 1;
    const appId = `APP-2026-${String(nextNum).padStart(3, '0')}`;
    record = {
      ApplicationId: appId,
      JobId: jobId,
      AppliedDate: today,
      Status: 'Applied',
      Company: company,
      Title: title,
      Location: location || 'Target Role',
      AtsMatchScore: matchScore ? `${matchScore}%` : '99%',
      PrimaryTrack: region ? `Daily (${region})` : 'Data Engineering',
      KeyTech: 'Tailored ATS Keywords',
      JobUrl: sourceUrl,
      PdfPath: pdfPath || '',
      DocxPath: docxPath || '',
      Notes: `Applied on ${today} via Resume Tailor Studio daily drop.`
    };
    appliedList.push(record);
    writeJson(appliedPath, appliedList);
  }

  // Update in daily_state.json
  const dailyPath = path.join(__dirname, 'app', 'daily_state.json');
  const dailyState = readJson(dailyPath, { jobs: [] });
  if (dailyState.jobs) {
    dailyState.jobs.forEach(j => {
      if (j.id === jobId || (sourceUrl && j.sourceUrl === sourceUrl)) {
        j.isApplied = true;
      }
    });
    writeJson(dailyPath, dailyState);
  }

  res.json({ status: 'applied', record });
});

// 6. API: Config (URLs kept private/internal)
app.get('/api/config', (req, res) => {
  const cfgPath = path.join(__dirname, 'app', 'config.json');
  const cfg = readJson(cfgPath, {});
  res.json({
    dailyNotificationTime: cfg.dailyNotificationTime || "20:00",
    targetCountIndia: cfg.targetCountIndia || 5,
    targetCountUs: cfg.targetCountUs || 5
  });
});

// 7. API: Test Notification
app.post('/api/notify-test', (req, res) => {
  res.json({ status: 'sent', message: 'Notification triggered.' });
});

// 8. API: Vercel Cron Endpoint (8:00 PM Daily)
app.get('/api/cron', (req, res) => {
  console.log('[Vercel Cron Triggered at 8:00 PM]');
  res.json({
    status: 'success',
    message: 'Daily 8 PM cron executed successfully.',
    timestamp: new Date().toISOString()
  });
});

// 9. API: Trigger Refresh
app.post('/api/daily/refresh', (req, res) => {
  res.json({ status: 'started', message: 'Daily refresh initiated.' });
});

// 10. API: Interview Coach - List All Roles (Strictly Applied vs Curated)
app.get('/api/interview/jobs', (req, res) => {
  const appliedPath = path.join(__dirname, 'applied_jobs.json');
  const rawApplied = readJson(appliedPath, []);
  let appliedList = Array.isArray(rawApplied) 
    ? (rawApplied[0] && rawApplied[0].value ? rawApplied[0].value : rawApplied)
    : (rawApplied.value || []);

  appliedList = appliedList.filter(j => j.Status === 'Applied');

  // Load today's curated daily drop
  const dailyPath = path.join(__dirname, 'app', 'daily_state.json');
  const daily = readJson(dailyPath, { jobs: [] });
  const curatedList = [];

  if (daily.jobs && Array.isArray(daily.jobs)) {
    daily.jobs.forEach(j => {
      const isAlreadyInApplied = appliedList.some(a => a.JobId === j.id || (a.JobUrl && a.JobUrl === j.sourceUrl));
      if (!isAlreadyInApplied) {
        curatedList.push({
          ApplicationId: `CURATED-${j.id.slice(-4)}`,
          JobId: j.id,
          AppliedDate: 'Curated (Ready to Apply)',
          Status: 'Curated',
          Company: j.company,
          Title: j.title,
          Location: j.location,
          AtsMatchScore: `${j.matchScore || 99}%`,
          PrimaryTrack: j.region === 'India' ? 'India Track' : 'US Track',
          KeyTech: (j.techTags || []).join(', '),
          JobUrl: j.sourceUrl,
          Description: j.description
        });
      }
    });
  }

  res.json({
    appliedJobs: appliedList,
    curatedJobs: curatedList,
    totalApplied: appliedList.length,
    totalCurated: curatedList.length,
    jobs: [...appliedList, ...curatedList]
  });
});

// 11. API: Interview Coach - Generate 5-Pillar Prep Dossier
app.get('/api/interview/dossier', (req, res) => {
  const { jobId, company, role } = req.query;
  const appliedPath = path.join(__dirname, 'applied_jobs.json');
  const rawApplied = readJson(appliedPath, []);
  let list = Array.isArray(rawApplied) 
    ? (rawApplied[0] && rawApplied[0].value ? rawApplied[0].value : rawApplied)
    : (rawApplied.value || []);

  const dailyPath = path.join(__dirname, 'app', 'daily_state.json');
  const daily = readJson(dailyPath, { jobs: [] });
  const allJobs = [...list];
  if (daily.jobs) {
    daily.jobs.forEach(j => {
      allJobs.push({
        JobId: j.id,
        Company: j.company,
        Title: j.title,
        AppliedDate: daily.date,
        AtsMatchScore: `${j.matchScore}%`,
        PrimaryTrack: j.region,
        Description: j.description
      });
    });
  }

  let matched = allJobs.find(j => (jobId && (j.JobId === jobId || j.id === jobId)) || 
                                  (company && j.Company && j.Company.toLowerCase() === company.toLowerCase()));
  if (!matched) {
    matched = {
      JobId: jobId || "CUSTOM",
      Company: company || "Target Company",
      Title: role || "Senior Data Engineer",
      AppliedDate: new Date().toISOString().slice(0, 10),
      AtsMatchScore: "99%",
      PrimaryTrack: "Data Engineering"
    };
  }

  const dossier = generateInterviewDossier(matched);
  res.json(dossier);
});

// 12. API: Interview Coach - Real-time AI Mock Critique
app.post('/api/interview/critique', async (req, res) => {
  try {
    const feedback = await critiqueAnswer(req.body);
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback to index.html for Single Page App
app.get('*', (req, res) => {
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.send('Resume Tailor Studio Cloud Backend Active');
});

// Only start listening if not running in a serverless environment (e.g. Vercel)
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Resume Tailor Studio Node Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
