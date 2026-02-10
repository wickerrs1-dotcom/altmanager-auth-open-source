const fs=require('fs')
const path=require('path')
const mineflayer=require('mineflayer')
const logStore=require('../logging/logStore')
const {formatMccLine}=require('../logging/mccFormat')
const discordLogger=require('../logging/discordLogger')
const reconnect=require('./reconnect')
const botEvents=require('./botEvents')
const { spawn } = require('child_process')
const state=require('../../core/state')||{}
const config=require('../../config.json')
const CONNECT_SPACING_MS = 25000
let connectingCount=0
let lastConnectAt=0
let botsByAlt={}

function listAlts(){return Object.keys(botsByAlt).map(k=>({alt:k, state:botsByAlt[k].state}))}

async function startAlt(altKey, opts){
  opts = opts || {};
  if(botsByAlt[altKey] && (botsByAlt[altKey].state==='connecting' || botsByAlt[altKey].state==='online')) return; // singleton

  // in-process path: create mineflayer bot directly
  if (opts.inProcess && opts.account && opts.config) {
    try {
      botsByAlt[altKey] = { state: 'connecting', reconnects: botsByAlt[altKey] ? botsByAlt[altKey].reconnects || 0 : 0 };
      const server = opts.config.servers?.[opts.account.server] || {};
      const profilesFolder = opts.config.auth?.profilesFolder || 'state/auth-cache';
      const createOpts = {
        host: server.host,
        port: server.port || 25565,
        username: opts.account._session?.username || opts.account.username,
        auth: (opts.account._session ? 'microsoft' : (opts.account.auth || 'offline')),
        version: server.version || false,
        viewDistance: server.viewDistance ?? 6,
        profilesFolder
      };
      if (opts.account._session && opts.account._session.accessToken) {
        createOpts.accessToken = opts.account._session.accessToken;
      }

      const bot = mineflayer.createBot(createOpts);
      botsByAlt[altKey].bot = bot;
      bot.server = server.host || String(opts.account.server || '-');
      botEvents.attach(bot, altKey);

      bot.once('spawn', ()=>{
        botsByAlt[altKey].state = 'online';
        const line = formatMccLine('[MGR]',altKey,'started(inproc)'); logStore.append(altKey,line); discordLogger.logToDiscord('[MGR]',altKey,'started(inproc)');
        try { const cleanup = playerAlerts.attachPlayerAlertSystem(bot, { altKey, config, serverHost: bot.server, client: global.discordClient }); botsByAlt[altKey].alertCleanup = cleanup; } catch (e) {}
      });

      bot.on('end', (reason)=>{
        const reasonStr = String(reason || '');
        botsByAlt[altKey].state = 'down';
        botsByAlt[altKey].lastReason = reasonStr;
        botsByAlt[altKey].reconnects = (botsByAlt[altKey].reconnects || 0) + 1;
        const retryCount = botsByAlt[altKey].reconnects;
        const delayMs = computeBackoffMs(reasonStr, retryCount);
        const line = formatMccLine('[MGR]',altKey,`ended ${reasonStr}`);
        logStore.append(altKey,line); discordLogger.logToDiscord('[MGR]',altKey,`ended ${reasonStr}`);
        try { if (botsByAlt[altKey]?.alertCleanup) botsByAlt[altKey].alertCleanup(); } catch (e) {}
        const humanDelaySec = Math.round(delayMs/1000);
        const hh = timeNow();
        console.log(`[${hh}] [${altKey}] Disconnected: ${reasonStr} | retryIn=${humanDelaySec}s | retryCount=${retryCount}`);
        reconnect.scheduleReconnect(altKey, reasonStr, ()=>startAlt(altKey, opts), { delayMs });
      });

      bot.on('error', (err)=>{
        const reasonStr = String(err?.message || err || '');
        botsByAlt[altKey].lastReason = reasonStr;
        botsByAlt[altKey].reconnects = (botsByAlt[altKey].reconnects || 0) + 1;
        const retryCount = botsByAlt[altKey].reconnects;
        const delayMs = computeBackoffMs(reasonStr, retryCount);
        const line = formatMccLine('[MGR]',altKey,`error ${reasonStr}`);
        logStore.append(altKey,line); discordLogger.logToDiscord('[MGR]',altKey,`error ${reasonStr}`);
        const humanDelaySec = Math.round(delayMs/1000);
        const hh = timeNow();
        console.log(`[${hh}] [${altKey}] Disconnected: ${reasonStr} | retryIn=${humanDelaySec}s | retryCount=${retryCount}`);
        reconnect.scheduleReconnect(altKey, reasonStr, ()=>startAlt(altKey, opts), { delayMs });
      });

      return;
    } catch (e) {
      const line = formatMccLine('[MGR]',altKey,`inproc_start_err ${String(e)}`); logStore.append(altKey,line); discordLogger.logToDiscord('[MGR]',altKey,`inproc_start_err ${String(e)}`);
      reconnect.scheduleReconnect(altKey, 'inproc_start_err', ()=>startAlt(altKey, opts));
      return;
    }
  }

  // fallback: spawn child worker
  function doStart(){
    connectingCount++;
    lastConnectAt = Date.now();
    botsByAlt[altKey] = { state:'connecting', reconnects: botsByAlt[altKey] ? botsByAlt[altKey].reconnects || 0 : 0 };
    // spawn child worker to run alt process (existing altWorker)
    const child=spawn(process.execPath,[path.join(process.cwd(),'worker','altWorker.js'),altKey],{stdio:['ignore','pipe','pipe']})
    botsByAlt[altKey].proc=child
    child.stdout.on('data',d=>{const line=d.toString().trim(); const m=formatMccLine('[CHILD]',altKey,line); logStore.append(altKey,m); discordLogger.logToDiscord('[CHILD]',altKey,line)})
    child.stderr.on('data',d=>{const line=d.toString().trim(); const m=formatMccLine('[CHILD_ERR]',altKey,line); logStore.append(altKey,m); discordLogger.logToDiscord('[CHILD_ERR]',altKey,line)})
    child.on('exit',(code,signal)=>{botsByAlt[altKey].state='down'; botsByAlt[altKey].lastExit={code,signal}; connectingCount=Math.max(0,connectingCount-1); const line=formatMccLine('[MGR]',altKey,`exit code=${code} signal=${signal}`); logStore.append(altKey,line); discordLogger.logToDiscord('[MGR]',altKey,`exit code=${code} signal=${signal}`); // schedule reconnect
      reconnect.scheduleReconnect(altKey,'exit',()=>startAlt(altKey))
    })
    botsByAlt[altKey].state='online'
    const line=formatMccLine('[MGR]',altKey,'started'); logStore.append(altKey,line); discordLogger.logToDiscord('[MGR]',altKey,'started')
  }
  const maxConcurrent = (opts.config && opts.config.limits && opts.config.limits.maxConcurrentConnecting) || config.limits && config.limits.maxConcurrentConnecting || 2
  const now = Date.now();
  const sinceLast = now - (lastConnectAt || 0);
  if(connectingCount>=maxConcurrent || sinceLast < CONNECT_SPACING_MS){ // queue until both conditions met
    const wait = Math.max(1000, CONNECT_SPACING_MS - sinceLast) + Math.floor(Math.random()*2000);
    setTimeout(()=>startAlt(altKey, opts), wait); return
  }
  doStart()
}

async function stopAlt(altKey){const rec=botsByAlt[altKey]; if(!rec) return; try{
  if(rec.proc){try{rec.proc.kill('SIGTERM')}catch(e){} }
  if(rec.bot){ try{ rec.bot.quit('stop'); }catch(e){} }
}catch(e){}
 rec.state='stopping'; reconnect.cancel(altKey); const line=formatMccLine('[MGR]',altKey,'stopping'); logStore.append(altKey,line); discordLogger.logToDiscord('[MGR]',altKey,'stopping')}

async function joinServer(altKey,server){ // instruct worker via IPC file or other; simplified: log
  const line=formatMccLine('[MGR]',altKey,`join ${server}`); logStore.append(altKey,line); discordLogger.logToDiscord('[MGR]',altKey,`join ${server}`)
}

async function chat(target,msg){if(target==='all'){for(const k of Object.keys(botsByAlt)){await chat(k,msg)};return} const line=formatMccLine('[CHAT]',target,msg); logStore.append(target,line); discordLogger.logToDiscord('[CHAT]',target,msg)}
async function exec(target,action){const line=formatMccLine('[EXEC]',target,action); logStore.append(target,line); discordLogger.logToDiscord('[EXEC]',target,action)}
function stats(){return {uptime:process.uptime(),memory:process.memoryUsage(),online:Object.keys(botsByAlt).filter(k=>botsByAlt[k].state==='online').length,connecting:connectingCount}}
function getStatus(altKey){
  const rec = botsByAlt[altKey];
  if(!rec) return { alt: altKey, state: 'offline' };
  return { alt: altKey, state: rec.state, lastExit: rec.lastExit, paused: !!rec.paused, lastReason: rec.lastReason, lastBackoffMs: rec.lastBackoffMs };
}

async function stopAll(){
  for(const k of Object.keys(botsByAlt)){
    try{ await stopAlt(k); }catch(e){}
  }
}

async function restartAlt(alt){ await stopAlt(alt); setTimeout(()=>startAlt(alt), 1200); }

async function restartAllRolling(){
  const keys = Object.keys(botsByAlt);
  for(const k of keys){ await restartAlt(k); await new Promise(r=>setTimeout(r, 2500)); }
}

function pauseAlt(alt, minutes){ const rec=botsByAlt[alt]||{}; rec.paused=true; rec.pauseUntil = minutes? (Date.now()+minutes*60000): Infinity; botsByAlt[alt]=rec; return true }
function resumeAlt(alt){ const rec=botsByAlt[alt]; if(!rec) return false; rec.paused=false; rec.pauseUntil=null; return true }

function reconnectAlt(alt){ // schedule immediate reconnect
  const rec = botsByAlt[alt]; if(rec && rec.proc){ try{ rec.proc.kill('SIGKILL') }catch(e){} }
  const retryCount = (botsByAlt[alt]?.reconnects||0) + 1;
  const delayMs = computeBackoffMs('manual_reconnect', retryCount);
  reconnect.scheduleReconnect(alt, 'manual_reconnect', ()=>startAlt(alt), { delayMs });
  return true;
}

function getBackoff(alt){ const r=botsByAlt[alt]; return { lastBackoffMs: r?.lastBackoffMs||null } }
function getLastReason(alt){ return botsByAlt[alt]?.lastReason || null }
function getHealth(){ return stats(); }
function getConfigSummary(){ return { maxConcurrent: MAX_CONCURRENT, inProcessEnabled: !!(config.pool && config.pool.useInProcessBots) } }

const { getSession } = require('../auth/msAuth');
async function getAuthStatus(alt){ try{ const s = await getSession(alt, { refreshToken: null }, config); if(!s) return { type: 'unknown', cache: false }; return { type: s.accessToken? 'microsoft':'offline', cache: true, expiresIn: Math.max(0, s.expiresAt - Math.floor(Date.now()/1000)) }; }catch(e){ return { error: String(e) } } }

const playerAlerts = require('./playerAlerts');

async function handleAlertCommand(sub, args){
  try{
    const k = (args && args[0]) || null;
    if(sub === 'on'){ config.alerts = config.alerts || {}; config.alerts.enabled = true; return 'alerts enabled'; }
    if(sub === 'off'){ config.alerts = config.alerts || {}; config.alerts.enabled = false; return 'alerts disabled'; }
    if(sub === 'radius'){ const r = parseInt(args[0],10)||32; config.alerts = config.alerts || {}; config.alerts.radiusBlocks = r; return `radius ${r}` }
    if(sub === 'cooldown'){ const c = parseInt(args[0],10)||60; config.alerts = config.alerts || {}; config.alerts.cooldownSeconds = c; return `cooldown ${c}` }
    if(sub === 'ignore'){
      const act = args[0]; const name = args[1]; config.alerts = config.alerts || {}; config.alerts.ignoreList = config.alerts.ignoreList || [];
      if(act === 'add'){ if(name && !config.alerts.ignoreList.includes(name)) config.alerts.ignoreList.push(name); return `ignore add ${name}` }
      if(act === 'del'){ config.alerts.ignoreList = config.alerts.ignoreList.filter(x=>x!==name); return `ignore del ${name}` }
      if(act === 'list'){ return `ignore list: ${config.alerts.ignoreList.join(', ')}` }
    }
    if(sub === 'test'){ const name = args[0]; return `test ${name}` }
    return 'unknown alert subcommand';
  }catch(e){ return `err ${String(e)}` }
}

async function handleTailCommand(alt, action, id){
  const { handleTailCommand: tailCmd } = require('./chatTail');
  return await tailCmd(alt, action, id);
}

module.exports={startAlt,stopAlt,listAlts,joinServer,chat,exec,stats,botsByAlt, getStatus, restartAlt, stopAll, restartAllRolling, pauseAlt, resumeAlt, reconnectAlt, getBackoff, getLastReason, getHealth, getConfigSummary, getAuthStatus, handleAlertCommand, handleTailCommand}

// Helper: compute backoff with throttle floor and jitter
function computeBackoffMs(reasonText, retryCount){
  const r = String(reasonText || "").toLowerCase();
  const isThrottle =
    r.includes("logging in too fast") ||
    r.includes("duplicate_login") ||
    r.includes("duplicate login") ||
    r.includes("multiplayer.disconnect.duplicate_login");

  const MIN_MS = 300000;
  const MAX_MS = 900000;

  const base = Math.min(MAX_MS, 30000 * Math.pow(2, Math.max(0, retryCount - 1)));
  const jitter = Math.floor(Math.random() * 15000);
  const normal = Math.min(MAX_MS, base + jitter);
  return isThrottle ? Math.max(MIN_MS, normal) : normal;
}

function timeNow(){ const d=new Date(); return [d.getHours().toString().padStart(2,'0'),d.getMinutes().toString().padStart(2,'0'),d.getSeconds().toString().padStart(2,'0')].join(':') }
