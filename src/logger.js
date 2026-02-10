const fs = require('fs');
const path = require('path');

function ensureDir(p){ try{ fs.mkdirSync(p, { recursive: true }); }catch(e){} }

function safeAppend(fp, line){ try{ fs.appendFileSync(fp, line + '\n', 'utf8'); }catch(e){ try{ console.error('log write failed', e); }catch{} } }

function format12HourTime(date) {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  const h = d.getHours();
  const hour12 = h % 12 || 12;
  const min = String(d.getMinutes()).padStart(2, '0');
  const sec = String(d.getSeconds()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${month}/${day}/${year}, ${String(hour12).padStart(2, '0')}:${min}:${sec} ${ampm}`;
}

function format12HourTimeOnly(date) {
  const d = new Date(date);
  const h = d.getHours();
  const hour12 = h % 12 || 12;
  const min = String(d.getMinutes()).padStart(2, '0');
  const sec = String(d.getSeconds()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${String(hour12).padStart(2, '0')}:${min}:${sec} ${ampm}`;
}

function init(root, opts = {}){
  const logsDir = path.join(root, 'logs');
  ensureDir(path.join(logsDir, 'alts'));

  const audit = (line) => {
    const ts = format12HourTime(new Date());
    const out = `[${ts}] ${String(line || '')}`;
    safeAppend(path.join(logsDir, 'audit.log'), out);
    // do not throw on console
    try{ console.log(out); }catch{};
  };

  const perAlt = (altKey, line) => {
    const ts = format12HourTimeOnly(new Date());
    const out = `[${ts}] ${String(line || '')}`;
    safeAppend(path.join(logsDir, 'alts', `${altKey}.log`), out);
    try{ console.log(out); }catch{};
  };

  const mk = (altKey, line) => { perAlt(altKey, line); };

  return { audit, perAlt: mk };
}

module.exports = { init };
