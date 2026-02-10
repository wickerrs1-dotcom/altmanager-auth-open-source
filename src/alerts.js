const recentAlerts = new Map(); // key -> timestamp

function formatAlert({ alt, player, x, y, z, world, ts = new Date() }){
  // exact formatting for tests
  const d = ts;
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  const yyyy = d.getFullYear();
  let hours = d.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const hh = String(hours).padStart(2,'0');
  const min = String(d.getMinutes()).padStart(2,'0');
  const coords = `${Math.round(x)}, ${Math.round(y)}, ${Math.round(z)}`;
  return `${mm}/${dd}/${yyyy} ${hh}:${min} ${ampm} - Alert: ${player} near ${alt} at ${coords} (${world})`;
}

function shouldAlert(key, cooldownSeconds){
  const now = Date.now();
  const prev = recentAlerts.get(key) || 0;
  if((now - prev) < (cooldownSeconds*1000)) return false;
  recentAlerts.set(key, now);
  return true;
}

module.exports = { formatAlert, shouldAlert };
const cooldowns = new Map();

function formatAlert({ ign, pos, serverHost, date }){
  try{
    const when = new Date(date || Date.now()).toLocaleString('en-US', { timeZone: 'America/Toronto', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    return `Alerts\nIGN: ${ign}\nCoords: X: ${pos.x} Y: ${pos.y} Z: ${pos.z}\n\n${serverHost} | ${when}`;
  }catch(e){ return `Alerts\nIGN: ${ign}`; }
}

function shouldAlert(altKey, player, cooldownMs){
  const key = `${altKey}:${player}`;
  const at = Date.now();
  const prev = cooldowns.get(key) || 0;
  if(at - prev < (cooldownMs||60000)) return false;
  cooldowns.set(key, at);
  return true;
}

module.exports = { formatAlert, shouldAlert };
