const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

// Final allowed structure (must remain). This list keeps `scripts` and `tests` for safety/tools.
const keep = new Set([
  'src','tools','state','logs','run.bat','package.json','package-lock.json','accounts.json','config.json','scripts','tests','.git','.gitignore','VERSION','LTS.md','CHANGELOG.md','README.md','report_bundle'
]);

function listRoot(){ return fs.readdirSync(ROOT); }

function removeRec(p){
  if(!fs.existsSync(p)) return;
  const stat = fs.lstatSync(p);
  if(stat.isDirectory()){
    const items = fs.readdirSync(p);
    for(const item of items) removeRec(path.join(p,item));
    try{ fs.rmdirSync(p); console.log('Deleted dir', p); }catch(e){}
  } else {
    try{ fs.unlinkSync(p); console.log('Deleted file', p); }catch(e){}
  }
}

function main(){
  const rootItems = listRoot();
  for(const it of rootItems){
    if(keep.has(it)) continue;
    // never delete node_modules
    if(it === 'node_modules') continue;
    const full = path.join(ROOT, it);
    console.log('Deleting:', full);
    try{ removeRec(full); }catch(e){ console.error('Failed to delete', full, e); }
  }
  console.log('\nCleanup complete. Removed items not in the allowed list.');
}

if(require.main === module) main();
