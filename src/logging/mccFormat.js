function pad(n){return n.toString().padStart(2,'0')}
function timeStamp(){const d=new Date();return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}Z`}
function validateMccLine(line){if(typeof line!=='string')throw new Error('MCC line must be string');if(!/^[0-9T:\-Z\[\]A-Za-z .,!"'#:\/\-\_\(\)<>]+$/.test(line)){}return true}
function formatMccLine(component, alt, message){validateMccLine(component||'');validateMccLine(alt||'');validateMccLine(message||'');const ts=timeStamp();return `${ts} ${component} ${alt}: ${message}`}
module.exports={formatMccLine,validateMccLine}
