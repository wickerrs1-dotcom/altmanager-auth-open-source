const fs = require('fs');
const path = require('path');

function ensureDir(p){ try{ fs.mkdirSync(p, { recursive: true }); }catch(e){} }

function safeAppend(fp, line){ try{ fs.appendFileSync(fp, line + '\n', 'utf8'); }catch(e){ try{ console.error('log write failed', e); }catch{} } }

function init(root, opts = {}){
  const logsDir = path.join(root, 'logs');
  ensureDir(path.join(logsDir, 'alts'));

  const audit = (line) => {
    const ts = new Date().toLocaleString();
    const out = `[${ts}] ${String(line || '')}`;
    safeAppend(path.join(logsDir, 'audit.log'), out);
    // do not throw on console
    try{ console.log(out); }catch{};
  };

  const perAlt = (altKey, line) => {
    const ts = new Date().toLocaleTimeString();
    const out = `[${ts}] ${String(line || '')}`;
    safeAppend(path.join(logsDir, 'alts', `${altKey}.log`), out);
    try{ console.log(out); }catch{};
  };

  const mk = (altKey, line) => { perAlt(altKey, line); };

  return { audit, perAlt: mk };
}

module.exports = { init };
