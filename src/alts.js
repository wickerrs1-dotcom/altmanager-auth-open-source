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
    .setTitle('🤖 Alt Manager')
    .setDescription('Use `/alts cmd:"<command>"` to execute. All alts are listed below.')
    .setColor(0x7289DA)
    .addFields(
      { name: '/alts', value: 'Show this help embed (default)', inline: false },
      { name: '/alts cmd:"ping"', value: '✅ /alts is working', inline: false },
      { name: '/alts cmd:"list"', value: 'List all alts and states', inline: false },
      { name: '/alts cmd:"status alt1"', value: 'Get status of alt1', inline: false },
      { name: '/alts cmd:"start alt1"', value: 'Start alt1', inline: false },
      { name: '/alts cmd:"stop alt1"', value: 'Stop alt1', inline: false },
      { name: '/alts cmd:"restart alt1"', value: 'Restart alt1', inline: false },
      { name: '/alts cmd:"join alt1 A"', value: 'Join alt1 to server A', inline: false },
      { name: '/alts cmd:"join alt1 B"', value: 'Join alt1 to server B', inline: false },
      { name: '/alts cmd:"chat alt1 \\"hello\\""', value: 'Send message as alt1', inline: false },
      { name: '/alts cmd:"logs alt1 50"', value: 'Get last 50 logs for alt1', inline: false },
      { name: '/alts cmd:"reason alt1"', value: 'Get reason alt1 is offline', inline: false },
      { name: '/alts cmd:"health"', value: 'Get overall health status', inline: false }
    );
  return { embeds: [e] };
}

async function handleAlts(interaction, ctx = {}){
  try{
    // Accept command as direct argument, not requiring 'cmd:' prefix
    const txt = interaction.options?.getString?.('command') || interaction.options?.getString?.('cmd') || '';
    if(!txt) return interaction.reply({ ephemeral: true, ...helpEmbed() });
    const toks = tokenize(txt);
    if(toks.length === 0) return interaction.reply({ ephemeral: true, ...helpEmbed() });
    const cmd = toks[0].toLowerCase();
    const args = toks.slice(1);
    const bm = ctx.botManager || require('./botManager')({});

    // map commands to unified API names
    switch(cmd){
      case 'ping': return interaction.reply({ ephemeral:true, content: '✅ /alts is working' });
      case 'list': {
        const l = bm.list();
        // Format for sync and clarity
        return interaction.reply({ ephemeral:true, content: l.length ? l.map(x=>`- ${x}`).join('\n') : 'no alts' });
      }
      case 'status': {
        const s = bm.status(args[0]);
        if(typeof s === 'string') return interaction.reply({ ephemeral:true, content: s });
        return interaction.reply({ ephemeral:true, content: s ? Object.entries(s).map(([k,v])=>`${k}: ${v}`).join('\n') : 'not found' });
      }
      case 'start': { const out = await bm.start(args[0]); return interaction.reply({ ephemeral:true, content: String(out) }); }
      case 'stop': { const out = await bm.stop(args[0]); return interaction.reply({ ephemeral:true, content: String(out) }); }
      case 'restart': { const out = await bm.restart(args[0]); return interaction.reply({ ephemeral:true, content: String(out) }); }
      case 'join': { const out = await bm.join(args[0], args[1]); return interaction.reply({ ephemeral:true, content: String(out) }); }
      case 'chat': { const target = args[0]; const msg = args.slice(1).join(' '); const out = await bm.chat(target, msg); return interaction.reply({ ephemeral:true, content: String(out) }); }
      case 'logs': { const n = parseInt(args[1]||args[0]||'100',10) || 100; const out = await bm.logs(args[0]||args[1], n); return interaction.reply({ ephemeral:true, content: String(out) }); }
      case 'reason': { const out = bm.reason(args[0]); return interaction.reply({ ephemeral:true, content: String(out) }); }
      case 'health': { const out = bm.health(); return interaction.reply({ ephemeral:true, content: JSON.stringify(out) }); }
      case 'startall': {
        // Start all enabled alts
        const enabledAlts = ctx.accounts?.alts?.filter(a=>a.enabled).map(a=>a.id) || [];
        const results = await Promise.all(enabledAlts.map(id=>bm.start(id)));
        return interaction.reply({ ephemeral:true, content: `Started: ${enabledAlts.join(', ')}` });
      }
      case 'startallserver': {
        // Start all enabled alts for a specific server
        const serverId = args[0];
        const enabledAlts = ctx.accounts?.alts?.filter(a=>a.enabled && a.server===serverId).map(a=>a.id) || [];
        const results = await Promise.all(enabledAlts.map(id=>bm.start(id)));
        return interaction.reply({ ephemeral:true, content: `Started for server ${serverId}: ${enabledAlts.join(', ')}` });
      }
      default: return interaction.reply({ ephemeral:true, ...helpEmbed() });
    }
  }catch(e){
    try{ console.error(e); }catch{};
    try{ if(!interaction.replied) await interaction.reply({ ephemeral:true, content: 'Command failed' }); }catch{};
  }
}

module.exports = { handleAlts };
