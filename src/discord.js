const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

let client = null;
let statusUpdateInterval = null;

async function start({ config, botManager, logger, security, alerts }){
  const token = process.env.DISCORD_TOKEN || config?.discord?.token || null;
  if(!token || token === 'skip') {
    console.log('[Discord] Skipped (no token provided)');
    return;
  }

  client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent], partials: [Partials.Channel] });
  global.discordClient = client;

  // Load all command handlers
  const commandHandlers = new Map();
  const commandsPath = path.join(__dirname, 'discord', 'commands');
  if(fs.existsSync(commandsPath)) {
    const files = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
    for(const file of files) {
      try {
        const cmd = require(path.join(commandsPath, file));
        const cmdName = cmd.data?.name;
        if(cmdName) commandHandlers.set(cmdName, cmd);
      } catch(e) {}
    }
  }

  // Promise that resolves when Discord is fully ready
  let readyResolve;
  const readyPromise = new Promise(resolve => { readyResolve = resolve; });

  client.once('ready', async () => {
    const msg = '✅ Ultimate Alt Manager Online (v2.1.0)';
    logger.audit && logger.audit(msg);
    logger.audit && logger.audit(`SYSTEM_START | author=Wicked | version=2.1.0`);
    console.log('[Discord] Connected. If you see old /alts cmd command, logout/login Discord or clear cache.');
    
    try{
      const chId = config.discord?.channelId;
      if(chId){
        const ch = await client.channels.fetch(chId).catch(()=>null);
        if(ch && ch.send) {
          await ch.send(msg);
          global.auditChannel = ch;
          // Start 24/7 status updates
          startStatusUpdates(ch, botManager, logger);
        }
      }
    } catch(e){}
    
    // Signal that Discord is ready
    readyResolve();
  });

  client.on('interactionCreate', async (interaction) => {
    try{
      // FORCE BLOCK ALL AUTOCOMPLETE - NO PREFILL EVER
      if(interaction.isAutocomplete()) {
        try { await interaction.respond([]); } catch(e) {}
        try { await interaction.deferUpdate(); } catch(e) {}
        try { await interaction.deleteReply(); } catch(e) {}
        return;
      }
      
      if(!interaction.isChatInputCommand()) return;
      const cmdName = interaction.commandName;
      const handler = commandHandlers.get(cmdName);
      if(!handler || !handler.execute) return interaction.reply({ ephemeral: true, content: 'Unknown command' }).catch(()=>{});
      
      // Execute command directly
      try {
        const accounts = botManager?.accounts || { alts: [] };
        await handler.execute(interaction, { config, botManager, accounts, logger, security, alerts });
      } catch(e) {
        try { console.error(`[cmd] ${cmdName} error: ${e.message}`); } catch {}
        try { if(!interaction.replied) await interaction.reply({ ephemeral:true, content: 'Command failed' }); } catch {}
      }
    } catch(e){
      try{ console.error(e); }catch{}
    }
  });

  try {
    await client.login(token);
    // Wait for Discord to be fully ready before returning
    await readyPromise;
    
    // Store channel reference for botManager notifications
    const chId = config.discord?.channelId;
    if(chId) {
      try {
        const ch = await client.channels.fetch(chId).catch(()=>null);
        if(ch && ch.send) global.statusChannel = ch;
      } catch(e) {}
    }
  } catch (e) {
    try { console.error('[discord] login failed, continuing without Discord'); } catch {}
    return;
  }
}

function startStatusUpdates(channel, botManager, logger) {
  if(statusUpdateInterval) clearInterval(statusUpdateInterval);
  
  statusUpdateInterval = setInterval(() => {
    try {
      if(!botManager) return;
      const health = botManager.health();
      const embed = new EmbedBuilder()
        .setTitle('🤖 Alt Manager Status')
        .setColor(health.online === health.total ? 0x00AA00 : (health.connecting > 0 ? 0xFFAA00 : 0xAA0000))
        .addFields(
          { name: 'Online', value: String(health.online || 0), inline: true },
          { name: 'Connecting', value: String(health.connecting || 0), inline: true },
          { name: 'Offline', value: String(health.down || 0), inline: true }
        )
        .setTimestamp();
      
      channel.send({ embeds: [embed] }).catch(()=>{});
    } catch(e) {}
  }, 60000); // 1m interval, rate-limited
}

module.exports = { start };

