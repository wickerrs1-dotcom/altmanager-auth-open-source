function buildHelp(){
  return {embeds:[{
    title:'⚔️ ALTS CONTROL PANEL',
    description:'Type /alts <command> — examples below',
    fields:[
      {name:'Commands', value:'start <alt>\nstop <alt>\nrestart <alt>\nlist\njoin <alt> <server[:port]>\nchat <alt|all> <message>\nexec <alt|all> <action...>\nlogs <alt>\nstats'},
      {name:'Examples', value:'/alts\n/alts list\n/alts start alt1\n/alts stop alt1\n/alts restart alt1\n/alts join alt1 play.pika-network.net\n/alts chat alt1 "hello world"\n/alts chat all "we are online"\n/alts exec alt1 follow Wickeds\n/alts exec alt1 goto 10 64 -20\n/alts logs alt1\n/alts stats'},
      {name:'Disconnect reasons', value:'[HH:MM:SS] [alt] Kicked: <reason>\n[HH:MM:SS] [alt] Error: <message>\n[HH:MM:SS] [alt] Disconnected: <detail>'}
    ]
  }]}
}

module.exports = buildHelp;
