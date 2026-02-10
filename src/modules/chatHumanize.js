const lastSent = new Map();

function randInt(min, max){ return Math.floor(min + Math.random()*(max-min+1)); }

async function sendHumanChat(alt, msg, cfg, logger){
  if(!cfg || !cfg.enabled){
    try{ logger && logger(alt, `Chat ${msg}`); }catch{};
    return 'sent';
  }
  const now = Date.now();
  const cooldown = (cfg.cooldownSeconds||20)*1000;
  const prev = lastSent.get(alt) || 0;
  if((now - prev) < cooldown) return 'cooldown';
  lastSent.set(alt, now);
  const typing = randInt(cfg.typingDelayMs?.min||600, cfg.typingDelayMs?.max||1800);
  await new Promise(r => setTimeout(r, typing));
  try{ logger && logger(alt, `Chat ${msg}`); }catch{};
  return 'sent';
}

module.exports = { sendHumanChat };
