function buildAltsHelpEmbed(){
  return {
    embeds: [{
      title: '⚔️ ALTS CONTROL PANEL',
      description: 'Use /alts with optional cmd textbox. Examples below.',
      fields: [
        { name: 'CORE', value: '/alts\n/alts cmd:"list"\n/alts cmd:"start alt1"\n/alts cmd:"stop alt1"\n/alts cmd:"restart alt1"\n/alts cmd:"join alt1 play.pika-network.net"' },
        { name: 'CHAT/EXEC', value: '/alts cmd:"chat alt1 \"hello world\""\n/alts cmd:"exec alt1 follow Wickeds"\n/alts cmd:"logs alt1"\n/alts cmd:"stats"' },
        { name: 'TAIL (24/7 chat stream)', value: '/alts cmd:"tail alt1 on"\n/alts cmd:"tail alt1 off"\n/alts cmd:"tail alt1 channel <id>" (optional)' },
        { name: 'DISCONNECT REASONS', value: '[HH:MM:SS] [alt] Kicked: ...\n[HH:MM:SS] [alt] Error: ...\n[HH:MM:SS] [alt] Disconnected: ...' }
      ]
    }]
  };
}

module.exports = { buildAltsHelpEmbed };
