function tokenize(input){
  const out=[]; let cur=''; let inQuote=false; let escape=false; for(let i=0;i<input.length;i++){const ch=input[i]; if(escape){cur+=ch; escape=false; continue} if(ch==='\\'){escape=true; continue} if(ch==='"'){inQuote=!inQuote; if(!inQuote){ out.push(cur); cur=''; } continue} if(!inQuote && /\s/.test(ch)){ if(cur!==''){ out.push(cur); cur=''; } continue } cur+=ch }
  if(cur!=='') out.push(cur);
  return out;
}

function parseManual(input){
  if(!input || !String(input).trim()) return { error: 'empty' };
  const toks = tokenize(String(input).trim());
  if(!toks.length) return { error: 'empty' };
  const name = toks[0].toLowerCase();
  const args = toks.slice(1);

  const allowed = new Set(['list','status','start','stop','restart','pause','resume','reconnect','join','chat','exec','logs','reason','backoff','auth','health','config','alert','tail']);
  if(!allowed.has(name)) return { error: `unknown command ${name}` };
  return { name, args };
}

module.exports = { tokenize, parseManual };
