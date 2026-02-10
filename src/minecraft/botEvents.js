const {mapEvent}=require('./stateMapper')
const discordLogger=require('../logging/discordLogger')
const logStore=require('../logging/logStore')
const {formatMccLine}=require('../logging/mccFormat')
function attach(bot,altKey){if(bot.__events_attached) return; bot.__events_attached=true
  bot.on('kicked', (reason)=>{const ev=mapEvent('kicked',reason); const line=formatMccLine('[MC:'+ (bot.server||'server') +']',altKey,`${ev.action}: ${ev.detail}`); logStore.append(altKey,line); discordLogger.logToDiscord('[MC]','['+altKey+']',`${ev.action}: ${ev.detail}`)})
  bot.on('error', (err)=>{const ev=mapEvent('error',err); const line=formatMccLine('[MC:'+ (bot.server||'server') +']',altKey,`${ev.action}: ${ev.detail}`); logStore.append(altKey,line); discordLogger.logToDiscord('[MC]','['+altKey+']',`${ev.action}: ${ev.detail}`)})
  bot.on('end', (reason)=>{const ev=mapEvent('end',reason); const line=formatMccLine('[MC:'+ (bot.server||'server') +']',altKey,`${ev.action}: ${ev.detail}`); logStore.append(altKey,line); discordLogger.logToDiscord('[MC]','['+altKey+']',`${ev.action}: ${ev.detail}`)})
}
module.exports={attach}
