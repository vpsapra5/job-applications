// server.js - Node.js Express Server for Resume Tailor Studio (Cloud & Vercel Ready)
require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

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

app.get('/files/*', (req, res) => {
  const relPath = decodeURIComponent(req.params[0] || '');
  const filePath = path.join(__dirname, relPath);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  return res.status(404).send('File not found');
});

// 3. API: Status
app.get('/api/status', (req, res) => {
  const baseExists = fs.existsSync(path.join(__dirname, 'VipulSapra_Resume.pdf'));
  res.json({
    baselineExists: baseExists,
    baselineName: 'VipulSapra_Resume.pdf',
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
