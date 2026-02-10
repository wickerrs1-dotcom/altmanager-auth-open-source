const timers={}
function jitter(base){return base+Math.floor(Math.random()*base)}
function scheduleReconnect(alt, reason, fn, opts={base:30000, max:300000, delayMs: null}){
  const now = Date.now(); const prev = timers[alt] || { count: 0, last: 0 };
  prev.count++;
  let delay;
  if (typeof opts.delayMs === 'number' && !Number.isNaN(opts.delayMs)) {
    delay = Math.max(0, Math.floor(opts.delayMs));
  } else {
    const backoff = Math.min(opts.base * Math.pow(2, prev.count - 1), opts.max);
    delay = jitter(backoff);
  }
  prev.last = now; timers[alt] = prev;
  if (timers[alt].timer) clearTimeout(timers[alt].timer);
  timers[alt].timer = setTimeout(() => { prev.count = 0; timers[alt].timer = null; fn(); }, delay);
  return delay;
}
function cancel(alt){if(timers[alt]&&timers[alt].timer){clearTimeout(timers[alt].timer);timers[alt].timer=null}}
module.exports={scheduleReconnect,cancel}
