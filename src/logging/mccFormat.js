function pad(n){return n.toString().padStart(2,'0')}
function timeStamp(){const d=new Date();const h=d.getHours();const h12=h%12||12;const ampm=h>=12?'PM':'AM';return `${pad(d.getMonth()+1)}/${pad(d.getDate())}/${d.getFullYear()} ${pad(h12)}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${ampm}`}
function validateMccLine(line){if(typeof line!=='string')throw new Error('MCC line must be string');if(!/^[0-9T:\-Z\[\]A-Za-z .,!"'#:\/\-\_\(\)<>\/ ]+$/.test(line)){}return true}
function formatMccLine(component, alt, message){validateMccLine(component||'');validateMccLine(alt||'');validateMccLine(message||'');const ts=timeStamp();return `${ts} ${component} ${alt}: ${message}`}

module.exports={formatMccLine,validateMccLine}
