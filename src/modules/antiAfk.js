const timers = new Map();

function randInt(min, max){ return Math.floor(min + Math.random()*(max-min+1)); }

function startAntiAfk(alt, account, cfg, logger){
  if(!cfg || !cfg.enabled) return null;
  // clear existing
  if(timers.has(alt)) clearTimeout(timers.get(alt));
  function schedule(){
    const interval = randInt(cfg.intervalMinSeconds||120, cfg.intervalMaxSeconds||240) * 1000;
    const t = setTimeout(()=>{
      const cmds = cfg.commands || [];
      if(cmds.length>0){
        const cmd = cmds[Math.floor(Math.random()*cmds.length)];
        try{ logger && logger(alt, `AntiAFK ${cmd}`); }catch(e){}
      }
      schedule();
    }, interval);
    timers.set(alt, t);
  }
  schedule();
  return {
    stop: ()=>{ if(timers.has(alt)) { clearTimeout(timers.get(alt)); timers.delete(alt); } }
  };
}

module.exports = { startAntiAfk };
