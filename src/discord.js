const { Client, GatewayIntentBits, Partials } = require('discord.js');
const alts = require('./alts');

let client = null;

async function start({ config, botManager, logger, security, alerts }){
  const token = process.env.DISCORD_TOKEN || null;
  if(!token) throw new Error('DISCORD_TOKEN missing (set in run.bat)');

  client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent], partials: [Partials.Channel] });
  // Make client globally accessible for msAuth.js
  global.discordClient = client;

  // Command registry map for introspection
  const commands = new Map();
  commands.set('alts', { handler: alts.handleAlts });

  client.once('ready', async () => {
    const msg = '✅ Wicked Alt Manager has started (v1.3.2)';
    logger.audit && logger.audit(msg);
    // Emit SYSTEM_START audit line with version + author
    // Emit SYSTEM_START audit line with version + author
    logger.audit && logger.audit(`SYSTEM_START | author=Wicked | version=1.3.2`);
    // send to configured channel if available
    try{
      const chId = config.discord?.channelId;
      if(chId){
        const ch = await client.channels.fetch(chId).catch(()=>null);
        if(ch && ch.send) await ch.send(msg);
      }
    } catch (e){}
  });

  client.on('interactionCreate', async (interaction) => {
    try{
      if(!interaction.isChatInputCommand()) return;
      const cmd = interaction.commandName;
      if(!commands.has(cmd)) return interaction.reply({ ephemeral: true, content: 'Unknown command' }).catch(()=>{});
      const h = commands.get(cmd).handler;
      // Always ensure handler is invoked and returns a reply
      await h(interaction, { config, botManager, logger, security, alerts });
    }catch(e){
      try{ console.error(e); }catch{}
      try{ if(!interaction.replied) await interaction.reply({ ephemeral:true, content: 'Command failed' }); }catch{}
    }
  });

  await client.login(token);
}

module.exports = { start };
