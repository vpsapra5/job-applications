# 🚀 Resume Tailor Studio & Daily Job Applications

Automated, profile-matched daily job curation and ATS resume tailoring studio for Data Engineering, ETL, Data Science, and BI Analytics roles across **India 🇮🇳** and the **USA 🇺🇸**.

---

## 🌟 Key Features

- **Daily Curated Applications**: Automatically curates and tailors **5 top jobs for India** and **5 top jobs for USA** daily matching Vipul Sapra's profile.
- **AI-Powered ATS Tailoring**: Generates tailored resumes in PDF and DOCX format using Google Gemini (`gemini-3.5-flash-lite`).
- **Clean Hero Dashboard**: Modern glassmorphic dark interface with live stats, region filter tabs (`All`, `India`, `USA`, `Applied`), and one-click application tracking.
- **6:00 AM EST Daily Reminder**: Automated daily schedule at 6:00 AM EST to review and apply to curated positions.
- **Direct Application Tracking**: Tracks applications in real time with auto-generated IDs, logging to `applied_jobs.json`, `APPLIED_JOBS.md`, and `Job_Applications_Tracker.csv`.
- **Zero Configuration Exposure**: Private corporate search filters and API parameters are kept secure and separate from the public interface.

---

## ☁️ Cloud & Vercel Architecture

- **Platform**: Serverless Node.js Express architecture designed for [Vercel](https://vercel.com/).
- **Serverless API**: Handled through `api/index.js` with `rewrites` configured in `vercel.json`.
- **Read-Only Filesystem Resilience**: Uses `/tmp` fallback for application state persistence on serverless lambdas.
- **Cron Automation**: Configured with Vercel Cron (`0 11 * * *`) firing at 6:00 AM EST daily.

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start the local development server
npm start
```

Server runs locally at `http://localhost:8000/`.
