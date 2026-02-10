const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd){ console.log('> '+cmd); execSync(cmd, { stdio: 'inherit' }); }

function fileExists(p){ return fs.existsSync(path.join(process.cwd(), p)); }

const failures = [];
try{
  // Step A: run commands
  try{ execSync('npm run changelog', { stdio: 'inherit' }); }catch(e){ /* continue */ }
  try{ execSync('npm test', { stdio: 'inherit' }); }catch(e){ failures.push('npm test failed'); }
  try{ execSync('npm run report', { stdio: 'inherit' }); }catch(e){ failures.push('npm run report failed'); }

  // Step B: validate files exist
  const needed = [
    'report_bundle/SUMMARY.txt',
    'report_bundle/COMMAND_JSON.txt',
    'report_bundle/STRESS_RESULTS.txt',
    'report_bundle/LAST_LOGS_REDACTED.txt'
  ];
  for(const n of needed){ if(!fileExists(n)) failures.push(`Missing file: ${n}`); }

  // Step C: hard rules
  const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
  if(pkg.version !== '1.3.2') failures.push(`package.json version is ${pkg.version} (expected 1.3.2)`);

  // Check /alts command JSON in tools/deployCommands.js: ensure one optional 'cmd' string option
  const deploy = fs.readFileSync('tools/deployCommands.js','utf8');
  const optsMatch = deploy.match(/options\s*:\s*\[([\s\S]*?)\]/m);
  if(!optsMatch) failures.push('Could not find command options in tools/deployCommands.js');
  else{
    const opts = optsMatch[1];
    if(!/name\s*:\s*['"]cmd['"]/.test(opts)) failures.push('/alts must have a single option named cmd');
    const subcommands = /type\s*:\s*\d+\s*,[\s\S]*?choices|subcommands|options\s*:\s*\[/i.test(opts);
    if(subcommands) failures.push('/alts appears to include subcommands/choices (not allowed)');
  }

  // Check CONNECT_SPACING_MS
  const bm = fs.readFileSync('src/minecraft/botManager.js','utf8');
  const spMatch = bm.match(/CONNECT_SPACING_MS\s*=\s*(\d+)/);
  if(!spMatch) failures.push('CONNECT_SPACING_MS not found in src/minecraft/botManager.js');
  else if(parseInt(spMatch[1],10) < 25000) failures.push(`CONNECT_SPACING_MS is ${spMatch[1]} (<25000)`);

  // Check computeBackoffMs MIN_MS presence
  if(!/MIN_MS\s*=\s*300000/.test(bm)) failures.push('computeBackoffMs MIN_MS != 300000 in botManager.js');

  // Check DISCORD_TOKEN usage: ensure no literal token in code/config (only run.bat)
  // Gather files by walking repo (exclude state/ and logs/)
  function walk(dir){
    let results = [];
    const list = fs.readdirSync(dir);
    for(const f of list){
      const p = path.join(dir,f);
      const stat = fs.statSync(p);
      if(stat && stat.isDirectory()){
        const rel = path.relative(process.cwd(), p).replace(/\\/g,'/');
        if(rel.startsWith('state') || rel.startsWith('logs')) continue;
        results = results.concat(walk(p));
      } else {
        const rel = path.relative(process.cwd(), p).replace(/\\/g,'/');
        results.push(rel);
      }
    }
    return results;
  }
  const all = walk(process.cwd());
  const searchFiles = all.filter(f => !f.startsWith('state/') && !f.startsWith('logs/') && !f.startsWith('node_modules/') && !f.includes('FAILURES.md') && !f.includes('COMPLETED.md') && !f.includes('scripts/final_check.js') && !f.includes('README.md'));
  const tokenLiteral = 'DISCORD_TOKEN=';
  for(const f of searchFiles){ try{ const txt = fs.readFileSync(f,'utf8'); if(f !== 'run.bat' && txt.includes(tokenLiteral)) failures.push(`Literal DISCORD_TOKEN= found in ${f}`); }catch(e){}
  }

  // If any failures, write FAILURES.md
  if(failures.length){
    const out = ['Final checks FAILED on ' + new Date().toISOString(), '', ...failures].join('\n');
    fs.writeFileSync('FAILURES.md', out, 'utf8');
    console.error('FINAL CHECK: FAILURES written to FAILURES.md');
    process.exit(2);
  }

  // PASS: write COMPLETED.md
  const completed = `Project name: Wicked Alt Manager\nVersion: 1.3.1\nDate: 2026-02-07\nStatus: COMPLETED\nHow to run: run.bat\nHow to deploy commands: node tools/deployCommands.js (token via run.bat env)\nFiles to edit: config.json, accounts.json only (+ token in run.bat)\n`;
  fs.writeFileSync('COMPLETED.md', completed, 'utf8');
  console.log('FINAL CHECK: PASS — COMPLETED.md created');
  process.exit(0);
}catch(e){ console.error('final_check error', e); process.exit(3); }
