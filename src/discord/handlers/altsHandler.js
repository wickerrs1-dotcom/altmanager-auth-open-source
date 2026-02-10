const { parseManual } = require('./altsParser');
const { buildAltsHelpEmbed } = require('./altsHelpEmbed');
const botManager = require('../../minecraft/botManager');

async function safeReply(interaction, payload){
  try {
    if (interaction.replied || interaction.deferred) return interaction.editReply(payload);
    return interaction.reply(payload);
  } catch (e) {
    try { if (!interaction.replied) return interaction.reply({ ephemeral: true, content: 'Reply failed' }); } catch (e) {}
  }
}

async function handleAlts(interaction){
  const raw = interaction.options?.getString?.('cmd');
  const cmd = (raw || '').trim();
  if(!cmd){
    return safeReply(interaction, { ephemeral: true, ...buildAltsHelpEmbed() });
  }

  const parsed = parseManual(cmd);
  if(parsed.error) {
    return safeReply(interaction, { ephemeral: true, content: `Invalid command: ${parsed.error}`, ...buildAltsHelpEmbed() });
  }

  const name = parsed.name; const args = parsed.args || [];
  try {
    switch(name){
      case 'list':{
        const list = botManager.listAlts();
        return safeReply(interaction, { ephemeral: true, content: JSON.stringify(list) });
      }
      case 'status':{
        const alt = args[0]; const s = botManager.getStatus(alt); return safeReply(interaction, { ephemeral: true, content: JSON.stringify(s) });
      }
      case 'start':{
        await botManager.startAlt(args[0]); return safeReply(interaction, { ephemeral: true, content: `Starting ${args[0]}` });
      }
      case 'stop':{
        if(args[0]==='all'){ await botManager.stopAll(); return safeReply(interaction, { ephemeral: true, content: 'Stopping all' }); }
        await botManager.stopAlt(args[0]); return safeReply(interaction, { ephemeral: true, content: `Stopping ${args[0]}` });
      }
      case 'restart':{
        if(args[0]==='all'){ await botManager.restartAllRolling(); return safeReply(interaction, { ephemeral: true, content: 'Restarting all (rolling)' }); }
        await botManager.restartAlt(args[0]); return safeReply(interaction, { ephemeral: true, content: `Restarting ${args[0]}` });
      }
      case 'pause':{ await botManager.pauseAlt(args[0], parseInt(args[1],10)||0); return safeReply(interaction,{ephemeral:true,content:`Paused ${args[0]}`}); }
      case 'resume':{ await botManager.resumeAlt(args[0]); return safeReply(interaction,{ephemeral:true,content:`Resumed ${args[0]}`}); }
      case 'reconnect':{ await botManager.reconnectAlt(args[0]); return safeReply(interaction,{ephemeral:true,content:`Reconnect scheduled ${args[0]}`}); }
      case 'join':{ await botManager.join(args[0], args[1]); return safeReply(interaction,{ephemeral:true,content:`Joining ${args[0]} -> ${args[1]}`}); }
      case 'chat':{ const target = args[0]; const msg = args.slice(1).join(' '); await botManager.chat(target, msg); return safeReply(interaction,{ephemeral:true,content:'Sent'}); }
      case 'exec':{ const target = args[0]; const action = args.slice(1).join(' '); await botManager.exec(target, action); return safeReply(interaction,{ephemeral:true,content:'Exec queued'}); }
      case 'logs':{ const alt = args[0]; const n = parseInt(args[1],10)||50; const lines = require('../../logging/logStore').getTail(alt==='all'?undefined:alt,n).join('\n'); return safeReply(interaction,{ephemeral:true,content:lines||'(no logs)'}); }
      case 'reason':{ const alt = args[0]; const r = botManager.getLastReason(alt); return safeReply(interaction,{ephemeral:true,content:r||'(no reason)'}); }
      case 'backoff':{ const alt=args[0]; const b = botManager.getBackoff(alt); return safeReply(interaction,{ephemeral:true,content:JSON.stringify(b)}); }
      case 'auth':{ const alt=args[0]; const s = await botManager.getAuthStatus(alt); return safeReply(interaction,{ephemeral:true,content:JSON.stringify(s)}); }
      case 'health':{ const h = botManager.getHealth(); return safeReply(interaction,{ephemeral:true,content:JSON.stringify(h)}); }
      case 'config':{ const c = botManager.getConfigSummary(); return safeReply(interaction,{ephemeral:true,content:JSON.stringify(c)}); }
      case 'alert':{ const sub = args[0]; const rest = args.slice(1); const out = await botManager.handleAlertCommand(sub, rest); return safeReply(interaction,{ephemeral:true,content:out||'ok'}); }
      case 'tail':{ const alt = args[0]; const action = args[1]; const id = args[2]; const out = await botManager.handleTailCommand(alt, action, id); return safeReply(interaction,{ephemeral:true,content:out||'ok'}); }
      default: return safeReply(interaction,{ephemeral:true,content:`Unsupported ${name}`});
    }
  } catch (e) {
    return safeReply(interaction, { ephemeral: true, content: `Error: ${String(e)}` });
  }
}

module.exports = { handleAlts };
