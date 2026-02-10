"use strict";
const path = require('path');
const { loadConfig } = require('./config');
const security = require('./security');
const logger = require('./logger');
const BotManager = require('./botManager');
const discord = require('./discord');
const alerts = require('./alerts');

async function start() {
  const ROOT = process.cwd();
  security.init();
  const { config, accounts } = loadConfig(ROOT);
  const log = logger.init(ROOT, config);

  // Startup sanity prints
  console.log('====================================');
  console.log('Wicked Alts v1.3.2');
  console.log('====================================');

  const enabledAlts = accounts.alts.filter(a => a.enabled).length;
  const totalAlts = accounts.alts.length;
  console.log(`[CONFIG] Loaded ${totalAlts} alts, ${enabledAlts} enabled`);

  const serverKeys = Object.keys(config.servers || {});
  if(serverKeys.length > 0){
    console.log(`[CONFIG] Servers: ${serverKeys.join(', ')}`);
  }

  if(enabledAlts === 0){
    console.log('[WARNING] No enabled alts. Enable at least alt1 in accounts.json and fill email.');
  }

  console.log('[STARTUP] Discord connecting...');
  // Use production BotManager for real mineflayer bots
  const RealBotManager = require('./botManager');
  const bm = new RealBotManager({ config, accounts, logger: log });

  // Emit system start audit line with version
  log.audit && log.audit('SYSTEM_START | author=Wicked | version=1.3.2');
  console.log('Wicked Alts v1.3.2 | Booting...');

  // Start discord and wire commands to bot manager
  await discord.start({ config, botManager: bm, logger: log, security, alerts });

  console.log('[STARTUP] BotManager ready');
  console.log('Alt manager started v1.3.2 | Ready for commands');
}


start().catch(err => {
  console.error('Fatal startup error', err);
  process.exit(1);
});
