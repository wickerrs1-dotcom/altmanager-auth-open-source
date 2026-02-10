const { formatAlert } = require('../format/alertTemplate');
const sendAlerts = require('../discord/sendAlerts');

function attachPlayerAlertSystem(bot, ctx){
  if (!bot) return () => {};
  const alt = ctx.altKey;
  const cfg = ctx.config || {};
  const radius = cfg.alerts?.radiusBlocks || 32;
  const cooldown = cfg.alerts?.cooldownSeconds || 60;
  const ignore = new Set((cfg.alerts?.ignoreList||[]).map(x=>String(x).toLowerCase()));
  let lastNotified = {};
  let iv = null;
  iv = setInterval(()=>{
    try {
      const me = bot.entity?.position; if(!me) return;
      for(const id in bot.players){ const p = bot.players[id]; if(!p || !p.entity) continue; const ign = p.username || id; if(!ign) continue; if(ign.toLowerCase()===bot.username?.toLowerCase()) continue; if(ignore.has(ign.toLowerCase())) continue; const pos = p.entity.position; const dx = pos.x - me.x; const dz = pos.z - me.z; if(Math.sqrt(dx*dx+dz*dz) <= radius){ const key = `${alt}:${ign}`; const now = Date.now(); if((now - (lastNotified[key]||0)) < (cooldown*1000)) continue; lastNotified[key]=now; const txt = formatAlert({ ign, pos, serverHost: ctx.serverHost || '-', date:new Date() }); // send
          try { if (cfg.alerts?.enabled && cfg.alerts.alertsChannelId) sendAlerts.sendNearbyAlert(ctx.client, cfg.alerts.alertsChannelId, txt); } catch (e) {}
        }
      }
    } catch (e) {}
  }, 750);
  return () => { try { clearInterval(iv); } catch (e) {} };
}

module.exports = { attachPlayerAlertSystem };
