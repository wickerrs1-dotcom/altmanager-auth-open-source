const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT,'package.json'),'utf8'));
const ver = pkg.version || 'unversioned';
const changelogPath = path.join(ROOT,'CHANGELOG.md');
const today = new Date().toISOString().slice(0,10);
const entry = `## v${ver} — ${today}
- MCC-accurate auto-join commands
- Command-only anti-AFK
- Human chat typing + cooldown
- Stable queue/backoff (20 alts / 2 servers)
- Security: token in run.bat only
- Tests + report bundle
\n`;

let existing = '';
if(fs.existsSync(changelogPath)) existing = fs.readFileSync(changelogPath,'utf8');
if(existing.includes(`## v${ver}`)){
  console.log('CHANGELOG already contains entry for', ver);
  process.exit(0);
}
const out = entry + existing;
fs.writeFileSync(changelogPath, out, 'utf8');
console.log('Appended changelog entry for', ver);
