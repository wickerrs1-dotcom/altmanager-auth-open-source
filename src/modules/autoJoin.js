const ran = new Set();

function randInt(min, max){ return Math.floor(min + Math.random()*(max-min+1)); }

async function runAutoJoin(alt, account, cfg, logger){
  if(!cfg || !cfg.enabled) return;
  if(ran.has(alt)) return; // run once
  ran.add(alt);
  const delay = (cfg.delaySeconds || 5) * 1000;
  setTimeout(async ()=>{
    for(const cmd of (cfg.commands||[])){
      const typing = randInt((cfg.typingDelayMs?.min)||600, (cfg.typingDelayMs?.max)||1600);
      await new Promise(r=>setTimeout(r, typing));
      try{ logger && logger(alt, `AutoJoin ${cmd}`); }catch(e){}
    }
  }, delay);
}

module.exports = { runAutoJoin };
