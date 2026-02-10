const {formatMccLine}=require('./mccFormat')
const fs=require('fs')
const path=require('path')
function logToDiscord(component,alt,message){try{const line=formatMccLine(component,alt,message); const fp=path.join(process.cwd(),'logs','audit.log'); fs.appendFileSync(fp,line+'\n','utf8'); console.log(line);}catch(e){}}
module.exports={logToDiscord}
