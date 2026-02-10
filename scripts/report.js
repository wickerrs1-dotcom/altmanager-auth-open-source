const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = process.cwd();
const outDir = path.join(ROOT, 'report_bundle');
if(!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// SUMMARY
fs.writeFileSync(path.join(outDir, 'SUMMARY.txt'), `Wicked Alt Manager report:\nTimestamp: ${new Date().toISOString()}\n`);

// COMMAND_JSON.txt - use existing command module if present
try{
  const cmd = require(path.join(ROOT, 'src','discord','commands','alts.command.js'));
  const json = (cmd && cmd.data && typeof cmd.data.toJSON === 'function') ? JSON.stringify(cmd.data.toJSON(), null, 2) : 'no-command-json';
  fs.writeFileSync(path.join(outDir, 'COMMAND_JSON.txt'), json);
}catch(e){ fs.writeFileSync(path.join(outDir, 'COMMAND_JSON.txt'), 'error reading command: '+String(e)); }

// Run tests and capture output
try{
  const r = spawnSync('npm', ['test','--silent'], { cwd: ROOT, shell: true, encoding: 'utf8', timeout: 120000 });
  fs.writeFileSync(path.join(outDir, 'STRESS_RESULTS.txt'), r.stdout + '\n' + r.stderr);
}catch(e){ fs.writeFileSync(path.join(outDir, 'STRESS_RESULTS.txt'), 'tests failed to run: '+String(e)); }

// LAST_LOGS_REDACTED - include last 200 lines of audit.log if present
try{
  const audit = path.join(ROOT, 'logs','audit.log');
  if(fs.existsSync(audit)){
    const buf = fs.readFileSync(audit,'utf8').split('\n').slice(-200).join('\n');
    // naive redact: mask tokens-looking strings
    const red = buf.replace(/([A-Za-z0-9-_]{20,})/g, '<REDACTED>');
    fs.writeFileSync(path.join(outDir, 'LAST_LOGS_REDACTED.txt'), red);
  } else fs.writeFileSync(path.join(outDir, 'LAST_LOGS_REDACTED.txt'), '(no audit.log)');
}catch(e){ fs.writeFileSync(path.join(outDir, 'LAST_LOGS_REDACTED.txt'), 'error: '+String(e)); }

// ACCOUNTS_SCHEMA.txt
try{
  const schema = `Accounts schema:\n\n{\n  \"defaults\": { \"auth\": \"microsoft\", \"server\": \"A\", \"enabled\": true, \"join\": [\"/server factions\"] },\n  \"alts\": [ { \"id\": \"alt1\", \"email\": \"\", \"enabled\": true, \"server\": \"A\", \"join\": [] }, ... up to alt20 ]\n}\n`;
  fs.writeFileSync(path.join(outDir, 'ACCOUNTS_SCHEMA.txt'), schema);
}catch(e){ }

console.log('Report bundle created at:', outDir);
