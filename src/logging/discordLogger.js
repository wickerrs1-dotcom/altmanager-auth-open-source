const {formatMccLine}=require('./mccFormat')
const fs=require('fs')
const path=require('path')

function logToDiscord(component,alt,message){
	try{
		const line=formatMccLine(component,alt,message);
		const fp=path.join(process.cwd(),'logs','audit.log');
		fs.appendFileSync(fp,line+'\n','utf8');
		console.log(line);
		// If a Discord audit channel is available, send a short message there (fire-and-forget)
		try{
			const ch = global.auditChannel;
			if(ch && ch.send){
				ch.send({ content: `**${component}** ${alt}: ${message}` }).catch(()=>{});
			}
		}catch(e){}
	}catch(e){}
}

module.exports={logToDiscord}
