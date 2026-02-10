"use strict";
const mc = require('minecraft-protocol');
const path = require('path');

let globalBotsByAlt = {};
let globalConnectingCount = 0;
let globalLastConnectTime = 0;
let globalTimersById = {};

function classifyDisconnect(reason) {
  if (!reason) return 'UNKNOWN';
  const r = String(reason).toLowerCase();
  if (r.includes('auth') || r.includes('invalid_grant') || r.includes('handshake')) return 'AUTH_HANDSHAKE_FAILURE';
  if (r.includes('already logged in')) return 'ALREADY_LOGGED_IN';
  if (r.includes('socket')) return 'POST_LOGIN_SOCKETCLOSED';
  return 'OTHER';
}

function computeBackoffMs(phase, retryCount) {
  if (phase === 'AUTH_HANDSHAKE_FAILURE') return 30 * 1000; // 30 seconds
  if (phase === 'ALREADY_LOGGED_IN') return 30 * 1000; // 30 seconds
  if (phase === 'POST_LOGIN_SOCKETCLOSED') {
    const backoffs = [30 * 1000, 60 * 1000, 120 * 1000, 240 * 1000]; // 30s, 60s, 2m, 4m
    return backoffs[Math.min(retryCount - 1, 3)];
  }
  return 30 * 1000; // 30 seconds default
}

class BotManager {
  constructor({ config, accounts, logger }) {
    this.config = config;
    this.accounts = accounts;
    this.logger = logger;
    
    // Cap at 13 alts max (can be increased later if needed)
    const maxAlts = 13;
    const enabledAlts = accounts.alts.filter(a => a.enabled).length;
    if (enabledAlts > maxAlts) {
      console.warn(`[WARNING] Only ${maxAlts} alts supported. Found ${enabledAlts} enabled. Disabling extras.`);
      let count = 0;
      for (const alt of accounts.alts) {
        if (alt.enabled && count >= maxAlts) alt.enabled = false;
        if (alt.enabled) count++;
      }
    }
    
    for (const alt of (accounts.alts || [])) {
      globalBotsByAlt[alt.id] = {
        id: alt.id,
        ign: alt.id,
        state: 'down',
        server: alt.server || 'unknown',
        lastReason: null,
        reconnects: 0,
        bot: null,
        chatDisabledUntil: null,
        afkTimers: {},
        postLoginIdleStart: null,
        lastOnlineTime: 0
      };
    }
    
    (async () => {
      await new Promise(r => setTimeout(r, 1000));
      let startDelay = 0;
      for (const alt of this.accounts.alts) {
        if (alt.enabled) {
          ((currentAlt, delayMs) => {
            setTimeout(() => {
              const ts = new Date().toLocaleTimeString('en-US', { hour12: true });
              console.log(`[${ts}] [MGR] Starting enabled alt: ${currentAlt.id}`);
              this.startAltReal(currentAlt.id, currentAlt).catch(err => {
                console.error(`[${ts}] [MGR] Error starting ${currentAlt.id}:`, err.message);
              });
            }, delayMs);
          })(alt, startDelay);
          startDelay += 20000; // 20 seconds between each alt startup
        }
      }
    })();
  }

  health() {
    const alts = Object.values(globalBotsByAlt);
    return {
      total: alts.length,
      online: alts.filter(a => a.state === 'online').length,
      connecting: alts.filter(a => a.state === 'connecting').length,
      down: alts.filter(a => a.state === 'down').length
    };
  }

  list() {
    return Object.keys(globalBotsByAlt).map(k => {
      const rec = globalBotsByAlt[k];
      const ign = rec.ign || k;
      const server = rec.server || 'unknown';
      return `${k}/${ign}=${rec.state || 'down'}@${server}`;
    });
  }

  async start(altId) {
    if (!altId) return 'Alt ID required';
    const altAcc = this.accounts.alts.find(a => a.id === altId);
    if (!altAcc) return `Alt ${altId} not found`;
    return await this.startAltReal(altId, altAcc);
  }

  async startAltReal(altKey, altAccount) {
    if (!altAccount) return 'Invalid alt';
    
    const record = globalBotsByAlt[altKey];
    if (!record) return 'Alt record not found';

    if (globalConnectingCount >= 2) {
      return `${altKey}: Queued (2 alts connecting)`;
    }

    const timeSinceLastConnect = Date.now() - globalLastConnectTime;
    if (timeSinceLastConnect < 15000) {
      const waitMs = 15000 - timeSinceLastConnect;
      this._scheduleReconnectReal(altKey, () => this.startAltReal(altKey, altAccount), waitMs);
      return `${altKey}: Queued after ${Math.ceil(waitMs / 1000)}s`;
    }

    record.state = 'connecting';
    globalConnectingCount++;
    globalLastConnectTime = Date.now();

    try {
      const serverCfg = (this.config.servers && this.config.servers[altAccount.server]) || {};
      const host = serverCfg.host || altAccount.server || 'localhost';
      const port = serverCfg.port || 25565;
      const profilesFolder = path.join(process.cwd(), 'state', 'auth-cache');
      
      const ts = new Date().toLocaleTimeString('en-US', { hour12: true });
      console.log(`[${ts}] [MGR] ${altKey}: Attempting auth to ${host}:${port}`);

      const bot = await mc.createClient({
        host,
        port,
        username: altAccount.email || altAccount.username || altAccount.id,
        password: altAccount.password || '',
        auth: 'microsoft',
        version: '1.8.9',
        profilesFolder
      });
      
      const ts2 = new Date().toLocaleTimeString('en-US', { hour12: true });
      console.log(`[${ts2}] [MGR] ${altKey}: Client created, waiting for login event...`);

      record.bot = bot;
      let hasLoggedIn = false;

      // Handle incoming keep-alive packets from server
      bot.on('keep_alive', (packet) => {
        try {
          if (bot && bot.write && hasLoggedIn) {
            bot.write('keep_alive', packet);
          }
        } catch (e) {}
      });

      bot.once('login', () => {
        hasLoggedIn = true;
        record.state = 'online';
        record.lastOnlineTime = Date.now();
        record.ign = (bot.client && bot.client.username) || bot.username || altAccount.id;
        record.reconnects = 0;
        record.postLoginIdleStart = Date.now();
        record.chatDisabledUntil = Date.now() + 90000;
        
        const ts = new Date().toLocaleTimeString('en-US', { hour12: true });
        console.log(`[${ts}] [MGR] ${altKey}: online, ign=${record.ign}`);
        
        // Send Discord notification
        try {
          if (global.statusChannel && global.statusChannel.send) {
            const { EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder()
              .setTitle('🟢 Alt Connected')
              .setDescription(`**${record.ign}** (${altKey})`)
              .addFields(
                { name: 'Server', value: record.server, inline: true },
                { name: 'Status', value: 'Online', inline: true }
              )
              .setColor(0x00AA00)
              .setTimestamp();
            global.statusChannel.send({ embeds: [embed] }).catch(() => {});
          }
        } catch (e) {}

        const joinCommands = altAccount.join || [];
        if (joinCommands.length > 0) {
          setTimeout(() => {
            if (record.state !== 'online') return;
            const jitterDelay = 8000 + Math.random() * 4000;
            setTimeout(() => {
              for (let i = 0; i < joinCommands.length; i++) {
                setTimeout(() => {
                  if (record.state === 'online' && bot) {
                    try { bot.write('chat', { message: joinCommands[i] }); } catch (e) {}
                  }
                }, i * (3000 + Math.random() * 2000));
              }
            }, jitterDelay);
          }, 20000 + Math.random() * 5000);
        }

        this._startAfkRealism(altKey, record);
      });

      bot.once('socketClosed', () => {
        if (hasLoggedIn) {
          record.state = 'down';
          record.lastReason = 'POST_LOGIN_SOCKETCLOSED';
          record.reconnects++;
          const delay = computeBackoffMs('POST_LOGIN_SOCKETCLOSED', record.reconnects);
          const ts = new Date().toLocaleTimeString('en-US', { hour12: true });
          console.log(`[${ts}] [MGR] ${altKey}: socket closed post-login, retry in ${Math.ceil(delay / 60000)}m`);
          
          try {
            if (global.statusChannel && global.statusChannel.send) {
              const { EmbedBuilder } = require('discord.js');
              const embed = new EmbedBuilder()
                .setTitle('🔴 Alt Disconnected')
                .setDescription(`**${record.ign}** (${altKey})`)
                .addFields(
                  { name: 'Reason', value: 'Post-login socket error', inline: true },
                  { name: 'Retry In', value: `${Math.ceil(delay / 60000)}m`, inline: true }
                )
                .setColor(0xAA0000)
                .setTimestamp();
              global.statusChannel.send({ embeds: [embed] }).catch(() => {});
            }
          } catch (e) {}
          
          this._scheduleReconnectReal(altKey, () => this.startAltReal(altKey, altAccount), delay);
        } else {
          record.state = 'down';
          record.lastReason = 'AUTH_HANDSHAKE_FAILURE';
          record.reconnects++;
          const delay = computeBackoffMs('AUTH_HANDSHAKE_FAILURE', record.reconnects);
          const ts = new Date().toLocaleTimeString('en-US', { hour12: true });
          console.log(`[${ts}] [MGR] ${altKey}: auth handshake failed, retry in ${Math.ceil(delay / 60000)}m`);
          
          try {
            if (global.statusChannel && global.statusChannel.send) {
              const { EmbedBuilder } = require('discord.js');
              const embed = new EmbedBuilder()
                .setTitle('🟡 Auth Failed')
                .setDescription(`**${altKey}** (auth error)`)
                .addFields(
                  { name: 'Reason', value: 'Authentication handshake failed', inline: true },
                  { name: 'Retry In', value: `${Math.ceil(delay / 60000)}m`, inline: true }
                )
                .setColor(0xFFAA00)
                .setTimestamp();
              global.statusChannel.send({ embeds: [embed] }).catch(() => {});
            }
          } catch (e) {}
          
          this._scheduleReconnectReal(altKey, () => this.startAltReal(altKey, altAccount), delay);
        }
        globalConnectingCount = Math.max(0, globalConnectingCount - 1);
        this._clearTimers(altKey);
      });

      bot.on('error', (err) => {
        record.state = 'down';
        record.lastReason = String(err?.message || 'error');
        const phase = classifyDisconnect(record.lastReason);
        record.reconnects++;
        const delay = computeBackoffMs(phase, record.reconnects);
        const ts = new Date().toLocaleTimeString('en-US', { hour12: true });
        console.log(`[${ts}] [MGR] ${altKey}: ${phase}, retry in ${Math.ceil(delay / 60000)}m`);
        
        try {
          if (global.statusChannel && global.statusChannel.send) {
            const { EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder()
              .setTitle('⚠️ Alt Error')
              .setDescription(`**${record.ign || altKey}** (${phase})`)
              .addFields(
                { name: 'Error', value: record.lastReason.substring(0, 100), inline: false },
                { name: 'Retry In', value: `${Math.ceil(delay / 60000)}m`, inline: true }
              )
              .setColor(0xFF6600)
              .setTimestamp();
            global.statusChannel.send({ embeds: [embed] }).catch(() => {});
          }
        } catch (e) {}
        
        this._scheduleReconnectReal(altKey, () => this.startAltReal(altKey, altAccount), delay);
        globalConnectingCount = Math.max(0, globalConnectingCount - 1);
        this._clearTimers(altKey);
      });

      bot.on('end', (reason) => {
        record.state = 'down';
        record.lastReason = String(reason || 'end');
        const phase = classifyDisconnect(record.lastReason);
        record.reconnects++;
        const delay = computeBackoffMs(phase, record.reconnects);
        const ts = new Date().toLocaleTimeString('en-US', { hour12: true });
        console.log(`[${ts}] [MGR] ${altKey}: ${phase}, retry in ${Math.ceil(delay / 60000)}m`);
        
        try {
          if (global.statusChannel && global.statusChannel.send) {
            const { EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder()
              .setTitle('🔴 Connection Ended')
              .setDescription(`**${record.ign || altKey}** (${phase})`)
              .addFields(
                { name: 'Retry In', value: `${Math.ceil(delay / 60000)}m`, inline: true }
              )
              .setColor(0xAA0000)
              .setTimestamp();
            global.statusChannel.send({ embeds: [embed] }).catch(() => {});
          }
        } catch (e) {}
        
        this._scheduleReconnectReal(altKey, () => this.startAltReal(altKey, altAccount), delay);
        globalConnectingCount = Math.max(0, globalConnectingCount - 1);
        this._clearTimers(altKey);
      });

      return `${altKey}: Connecting...`;
    } catch (e) {
      record.state = 'down';
      record.lastReason = String(e?.message || 'error');
      const phase = classifyDisconnect(record.lastReason);
      record.reconnects++;
      const delay = computeBackoffMs(phase, record.reconnects);
      const ts = new Date().toLocaleTimeString('en-US', { hour12: true });
      console.log(`[${ts}] [MGR] ${altKey}: ${phase}, retry in ${Math.ceil(delay / 60000)}m`);
      this._scheduleReconnectReal(altKey, () => this.startAltReal(altKey, altAccount), delay);
      globalConnectingCount = Math.max(0, globalConnectingCount - 1);
      return `${altKey}: Connection failed (${record.lastReason})`;
    }
  }

  async stop(altId) {
    const record = globalBotsByAlt[altId];
    if (!record) return `${altId} not found`;
    
    if (record.bot) {
      try { record.bot.end('Stopped by user'); } catch (e) {}
    }
    
    record.state = 'down';
    record.bot = null;
    this._clearTimers(altId);
    
    if (globalTimersById[altId]) {
      clearTimeout(globalTimersById[altId]);
      delete globalTimersById[altId];
    }
    
    return `${altId}: Stopped`;
  }

  async restart(altId) {
    await this.stop(altId);
    const altAcc = this.accounts.alts.find(a => a.id === altId);
    if (!altAcc) return `${altId} not found`;
    return await this.startAltReal(altId, altAcc);
  }

  async move(altId, server) {
    const altAcc = this.accounts.alts.find(a => a.id === altId);
    if (!altAcc) return `${altId} not found`;
    altAcc.server = server;
    await this.restart(altId);
    return `${altId}: Moved to server ${server}`;
  }

  async chat(altId, message) {
    const record = globalBotsByAlt[altId];
    if (!record || !record.bot) return `${altId} not online`;
    
    if (record.chatDisabledUntil && Date.now() < record.chatDisabledUntil) {
      const minutesLeft = Math.ceil((record.chatDisabledUntil - Date.now()) / 60000);
      return `${altId}: Chat disabled for ${minutesLeft}m`;
    }
    
    try {
      record.bot.write('chat', { message });
      return `${altId}: Message sent`;
    } catch (e) {
      return `${altId}: Chat failed - ${e.message}`;
    }
  }

  async join(altId, server) {
    const record = globalBotsByAlt[altId];
    if (!record || !record.bot) return `${altId} not online`;
    if (record.state !== 'online') return `${altId} not fully online`;
    
    // Find server config for join commands
    const altAcc = this.accounts.alts.find(a => a.id === altId);
    if (!altAcc) return `${altId} not found`;
    
    const serverMap = { 'A': 'A', 'B': 'B' };
    const normalizedServer = serverMap[server?.toUpperCase()] || server;
    
    // Get join commands from account config or default
    const joinCmds = altAcc.join && Array.isArray(altAcc.join) && altAcc.join.length > 0 ? altAcc.join : [];
    if (joinCmds.length === 0) {
      return `${altId}: No join commands configured for server ${server}`;
    }
    
    try {
      for (let i = 0; i < joinCmds.length; i++) {
        const cmd = joinCmds[i];
        const delay = i === 0 ? 500 : (1000 + Math.random() * 1000);
        await new Promise(r => setTimeout(r, delay));
        if (record.state === 'online' && record.bot) {
          record.bot.write('chat', { message: cmd });
        }
      }
      return `${altId}: Joined server ${server}`;
    } catch (e) {
      return `${altId}: Join failed - ${e.message}`;
    }
  }

  logs(altId, lines = 50) {
    try {
      const fs = require('fs');
      const path = require('path');
      const logsDir = path.join(process.cwd(), 'logs', 'alts');
      const logFile = path.join(logsDir, `${altId}.log`);
      
      if (!fs.existsSync(logFile)) {
        return `${altId}: No logs found`;
      }
      
      const content = fs.readFileSync(logFile, 'utf8');
      const allLines = content.split('\n').filter(l => l.trim());
      const recent = allLines.slice(-Math.max(1, lines));
      
      return recent.join('\n') || `${altId}: No log entries`;
    } catch (e) {
      return `${altId}: Cannot read logs - ${e.message}`;
    }
  }

  reason(altId) {
    const record = globalBotsByAlt[altId];
    if (!record) return `${altId} not found`;
    return `${altId}: ${record.lastReason || 'No disconnect recorded'}`;
  }

  enable(altId) {
    const altAcc = this.accounts.alts.find(a => a.id === altId);
    if (!altAcc) return `${altId} not found`;
    altAcc.enabled = true;
    return `${altId}: Enabled`;
  }

  disable(altId) {
    const altAcc = this.accounts.alts.find(a => a.id === altId);
    if (!altAcc) return `${altId} not found`;
    altAcc.enabled = false;
    return `${altId}: Disabled`;
  }

  _startAfkRealism(altId, record) {
    if (!record.bot) return;
    const bot = record.bot;
    
    const lookTimer = setInterval(() => {
      if (record.state !== 'online' || !bot) {
        clearInterval(lookTimer);
        return;
      }
      try {
        const pitch = -1 + Math.random() * 2;
        const yaw = Math.random() * 360;
        bot.look(yaw, pitch);
      } catch (e) {}
    }, 60000 + Math.random() * 60000);
    
    record.afkTimers.look = lookTimer;
    
    const hotbarTimer = setInterval(() => {
      if (record.state !== 'online' || !bot) {
        clearInterval(hotbarTimer);
        return;
      }
      try {
        const slot = Math.floor(Math.random() * 9);
        if (bot.setQuickBarSlot) bot.setQuickBarSlot(slot);
      } catch (e) {}
    }, 120000 + Math.random() * 120000);
    
    record.afkTimers.hotbar = hotbarTimer;
  }

  _clearTimers(altId) {
    const record = globalBotsByAlt[altId];
    if (!record || !record.afkTimers) return;
    Object.values(record.afkTimers).forEach(timer => {
      try { clearInterval(timer); } catch (e) {}
    });
    record.afkTimers = {};
  }

  _scheduleReconnectReal(altKey, fn, delayMs) {
    if (globalTimersById[altKey]) clearTimeout(globalTimersById[altKey]);
    globalTimersById[altKey] = setTimeout(fn, delayMs);
  }

  getAltDetails(altId) {
    const record = globalBotsByAlt[altId];
    if (!record) return null;
    
    const isChatDisabled = record.chatDisabledUntil && Date.now() < record.chatDisabledUntil;
    const chatMinutesLeft = isChatDisabled ? Math.ceil((record.chatDisabledUntil - Date.now()) / 60000) : 0;
    
    return {
      id: record.id,
      ign: record.ign || record.id,
      state: record.state || 'down',
      server: record.server || 'unknown',
      chat: {
        disabled: isChatDisabled,
        minutesLeft: chatMinutesLeft
      },
      reconnects: record.reconnects || 0,
      lastReason: record.lastReason || 'none',
      isOnline: record.state === 'online',
      isConnecting: record.state === 'connecting'
    };
  }

  getAllDetails() {
    return Object.keys(globalBotsByAlt).map(key => this.getAltDetails(key));
  }

  getDetailsByAltIds(altIds = []) {
    return altIds.map(id => this.getAltDetails(id)).filter(d => d !== null);
  }
}

module.exports = BotManager;
