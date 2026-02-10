const { EmbedBuilder } = require('discord.js');

function tokenize(s){
  if(!s || !s.trim()) return [];
  const parts = [];
  let cur = '';
  let inQ = false;
  for(let i=0;i<s.length;i++){
    const ch = s[i];
    if(ch === '"') { inQ = !inQ; if(!inQ){ parts.push(cur); cur=''; } continue; }
    if(!inQ && /\s/.test(ch)) { if(cur!=='') { parts.push(cur); cur=''; } continue; }
    cur += ch;
  }
  if(cur!=='') parts.push(cur);
  return parts;
}

function helpEmbed(){
  const e = new EmbedBuilder()
    .setTitle('⚔️ Alt Manager - Command Help')
    .setDescription('Type `/alts <command>` with manual text input')
    .setColor(0x00AAFF)
    .addFields(
      { name: '📋 **Info Commands**', value: '`help` - Show this help\n`list [all]` - Connected alts\n`status <alt>` - Alt details\n`stats` - Statistics\n`health` - System health', inline: true },
      { name: '🎮 **Control Commands**', value: '`start <alt|ALL>` - Connect\n`stop <alt|ALL>` - Disconnect\n`restart <alt|ALL>` - Reconnect', inline: true },
      { name: '🌐 **Server Commands**', value: '`move <alt> <A|B>` - Change server\n`join <alt> <A|B>` - Execute join commands', inline: false },
      { name: '💬 **Chat & Info**', value: '`chat <alt> <msg>` - Send message\n`reason <alt>` - Disconnect reason\n`logs <alt> [#]` - View logs', inline: true },
      { name: '⚙️ **Configuration**', value: '`enable <alt>` - Enable alt\n`disable <alt>` - Disable alt', inline: true }
    )
    .setFooter({ text: '13 alts max | Startup: 20s spacing | Retry: 30s-240s backoff' });
  return { embeds: [e] };
}

async function handleAlts(interaction, ctx = {}){
  try{
    const bm = ctx.botManager || new (require('./botManager'))({ config: ctx.config, accounts: ctx.accounts, logger: ctx.logger });
    const { EmbedBuilder } = require('discord.js');

    // Parse manual text input from cmd option
    const cmdInput = (interaction.options?.getString?.('cmd') || '').trim();
    if(!cmdInput) return interaction.reply({ ephemeral:true, ...helpEmbed() });

    const parts = tokenize(cmdInput);
    if(!parts.length) return interaction.reply({ ephemeral:true, ...helpEmbed() });

    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Execute command
    switch(cmd){
      case 'help': return interaction.reply({ ephemeral:true, ...helpEmbed() });
      
      case 'list': {
        const scope = args[0]?.toLowerCase() === 'all' ? 'all' : 'online';
        const altsArr = (bm.accounts && bm.accounts.alts) || [];
        const lines = [];
        for(const a of altsArr){
          const details = bm.getAltDetails(a.id);
          if(!details) {
            lines.push(`🔴 **${a.id}** — unknown — offline`);
            continue;
          }
          if(scope !== 'all' && !details.isOnline) continue;
          const emoji = details.isOnline ? '🟢' : (details.isConnecting ? '🟡' : '🔴');
          lines.push(`${emoji} **${a.id}** — ${details.ign} — ${details.state}`);
        }
        const e = new EmbedBuilder()
          .setTitle('🛡️ Alt List')
          .setDescription(lines.length ? lines.join('\n') : 'No matching alts')
          .setColor(0x2f3136)
          .setFooter({ text: 'Green=online • Yellow=connecting • Red=offline' });
        return interaction.reply({ ephemeral:true, embeds: [e] });
      }

      case 'stats': {
        const health = bm.health();
        const e = new EmbedBuilder()
          .setTitle('📊 Statistics')
          .setColor(0x00AA00)
          .addFields(
            { name: 'Total', value: String(health.total), inline: true },
            { name: 'Online', value: String(health.online || 0), inline: true },
            { name: 'Connecting', value: String(health.connecting || 0), inline: true },
            { name: 'Offline', value: String(health.down || 0), inline: true }
          );
        return interaction.reply({ ephemeral:true, embeds: [e] });
      }

      case 'status': {
        if(!args[0]) return interaction.reply({ ephemeral:true, content: 'Usage: /alts status <alt>' });
        const alt = args[0];
        const details = bm.getAltDetails(alt);
        if(!details) return interaction.reply({ ephemeral:true, content: `Alt ${alt} not found` });
        const stateColor = details.isOnline ? 0x00AA00 : (details.isConnecting ? 0xFFAA00 : 0xAA0000);
        const e = new EmbedBuilder()
          .setTitle(`Status: ${alt}`)
          .setColor(stateColor)
          .addFields(
            { name: 'State', value: String(details.state), inline: true },
            { name: 'IGN', value: String(details.ign), inline: true },
            { name: 'Server', value: String(details.server), inline: true },
            { name: 'Reason', value: String(details.lastReason), inline: false }
          );
        return interaction.reply({ ephemeral:true, embeds: [e] });
      }

      case 'start': {
        if(!args[0]) return interaction.reply({ ephemeral:true, content: 'Usage: /alts start <alt|ALL>' });
        const target = args[0].toUpperCase();
        const altsSource = (bm && bm.accounts && Array.isArray(bm.accounts.alts) && bm.accounts.alts) || (ctx.accounts && Array.isArray(ctx.accounts.alts) && ctx.accounts.alts) || [];
        const alts = target === 'ALL' ? altsSource.map(a=>a.id) : [args[0]];
        const r = [];
        for(const a of alts) {
          const result = await bm.start(a);
          r.push(result);
        }
        return interaction.reply({ ephemeral:true, content: r.join('\n') });
      }

      case 'stop': {
        if(!args[0]) return interaction.reply({ ephemeral:true, content: 'Usage: /alts stop <alt|ALL>' });
        const target = args[0].toUpperCase();
        const altsSourceStop = (bm && bm.accounts && Array.isArray(bm.accounts.alts) && bm.accounts.alts) || (ctx.accounts && Array.isArray(ctx.accounts.alts) && ctx.accounts.alts) || [];
        const altsStop = target === 'ALL' ? altsSourceStop.map(a=>a.id) : [args[0]];
        const r = [];
        for(const a of altsStop) {
          const result = await bm.stop(a);
          r.push(result);
        }
        return interaction.reply({ ephemeral:true, content: r.join('\n') });
      }

      case 'restart': {
        if(!args[0]) return interaction.reply({ ephemeral:true, content: 'Usage: /alts restart <alt|ALL>' });
        const target = args[0].toUpperCase();
        const altsSourceRestart = (bm && bm.accounts && Array.isArray(bm.accounts.alts) && bm.accounts.alts) || (ctx.accounts && Array.isArray(ctx.accounts.alts) && ctx.accounts.alts) || [];
        const altsRestart = target === 'ALL' ? altsSourceRestart.map(a=>a.id) : [args[0]];
        const r = [];
        for(const a of altsRestart) {
          const result = await bm.restart(a);
          r.push(result);
        }
        return interaction.reply({ ephemeral:true, content: r.join('\n') });
      }

      case 'join': {
        if(!args[0] || !args[1]) return interaction.reply({ ephemeral:true, content: 'Usage: /alts join <alt> <server>' });
        const alt = args[0];
        const server = args[1].toUpperCase();
        if(!['A','B'].includes(server)) return interaction.reply({ ephemeral:true, content: 'Server must be A or B' });
        const out = await bm.join(alt, server);
        return interaction.reply({ ephemeral:true, content: String(out) });
      }

      case 'move': {
        if(!args[0] || !args[1]) return interaction.reply({ ephemeral:true, content: 'Usage: /alts move <alt> <server>' });
        const alt = args[0];
        const server = args[1].toUpperCase();
        if(!['A','B'].includes(server)) return interaction.reply({ ephemeral:true, content: 'Server must be A or B' });
        const out = await bm.move(alt, server);
        return interaction.reply({ ephemeral:true, content: String(out) });
      }

      case 'chat': {
        if(!args[0]) return interaction.reply({ ephemeral:true, content: 'Usage: /alts chat <alt> <message>' });
        const alt = args[0];
        const msg = args.slice(1).join(' ');
        if(!msg) return interaction.reply({ ephemeral:true, content: 'Message cannot be empty' });
        const out = await bm.chat(alt, msg);
        return interaction.reply({ ephemeral:true, content: String(out) });
      }

      case 'enable': {
        if(!args[0]) return interaction.reply({ ephemeral:true, content: 'Usage: /alts enable <alt>' });
        const alt = args[0];
        const out = bm.enable(alt);
        return interaction.reply({ ephemeral:true, content: String(out) });
      }

      case 'disable': {
        if(!args[0]) return interaction.reply({ ephemeral:true, content: 'Usage: /alts disable <alt>' });
        const alt = args[0];
        const out = bm.disable(alt);
        return interaction.reply({ ephemeral:true, content: String(out) });
      }

      case 'logs': {
        if(!args[0]) return interaction.reply({ ephemeral:true, content: 'Usage: /alts logs <alt> [lines]' });
        const alt = args[0];
        const lines = parseInt(args[1] || '50', 10) || 50;
        const out = await bm.logs(alt, lines);
        return interaction.reply({ ephemeral:true, content: String(out) });
      }

      case 'reason': {
        if(!args[0]) return interaction.reply({ ephemeral:true, content: 'Usage: /alts reason <alt>' });
        const alt = args[0];
        const out = bm.reason(alt);
        return interaction.reply({ ephemeral:true, content: String(out) });
      }

      case 'health': {
        const health = bm.health();
        const e = new EmbedBuilder()
          .setTitle('🏥 Manager Health')
          .setColor(0x00AA00)
          .addFields(
            { name: 'Total', value: String(health.total), inline: true },
            { name: 'Online', value: String(health.online || 0), inline: true },
            { name: 'Connecting', value: String(health.connecting || 0), inline: true },
            { name: 'Offline', value: String(health.down || 0), inline: true }
          );
        return interaction.reply({ ephemeral:true, embeds: [e] });
      }

      default: 
        return interaction.reply({ ephemeral:true, content: `Unknown command: ${cmd}\nType /alts help for available commands` });
    }
  }catch(e){
    try{ console.error(`[alts] Error: ${e.message}`); }catch{};
    try{ if(!interaction.replied) await interaction.reply({ ephemeral:true, content: 'Command failed: ' + e.message }); }catch{};
  }
}

module.exports = { handleAlts };
