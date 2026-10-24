// coach_runner.js - CLI runner for PowerShell server integration
const fs = require('fs');
const path = require('path');
const { generateInterviewDossier, critiqueAnswer } = require('./coach_engine.js');

async function main() {
  const mode = process.argv[2]; // 'dossier' or 'critique'
  const inputFile = process.argv[3];
  
  if (!inputFile || !fs.existsSync(inputFile)) {
    console.error('Input file missing');
    process.exit(1);
  }

  let raw = fs.readFileSync(inputFile, 'utf8');
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
  const payload = JSON.parse(raw);

  if (mode === 'dossier') {
    const dossier = generateInterviewDossier(payload);
    console.log(JSON.stringify(dossier));
  } else if (mode === 'critique') {
    const feedback = await critiqueAnswer(payload);
    console.log(JSON.stringify(feedback));
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
