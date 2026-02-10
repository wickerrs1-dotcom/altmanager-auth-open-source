const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const accPath = path.join(ROOT, 'accounts.json');
const args = process.argv.slice(2);
const force = args.includes('--force');

const template = {
  defaults: {
    auth: 'microsoft',
    server: 'A',
    enabled: false,
    join: []
  },
  alts: []
};

// Generate alt1..alt20: first 10 on server A, last 10 on server B; alt1 enabled, rest disabled
for(let i = 1; i <= 20; i++){
  template.alts.push({
    id: `alt${i}`,
    email: '',
    enabled: i === 1,
    server: i <= 10 ? 'A' : 'B',
    join: []
  });
}

// Write accounts.json
if(fs.existsSync(accPath) && !force){
  console.log('ℹ accounts.json exists; not overwriting (use --force to overwrite)');
} else {
  fs.writeFileSync(accPath, JSON.stringify(template, null, 2), 'utf8');
  if(force){
    console.log('✓ Overwrote accounts.json (20 alts: alt1..alt20) with --force');
  } else {
    console.log('✓ Created accounts.json (20 alts: alt1..alt20)');
  }
}


