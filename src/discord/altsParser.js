function tokenize(s){const out=[];let cur='';let q=false;for(let i=0;i<s.length;i++){const c=s[i];if(c==='"'){q=!q;continue}if(!q && c===' '){if(cur!==''){out.push(cur);cur=''};continue}cur+=c}if(cur!=='')out.push(cur);return out}
function parseManualCmd(input){if(!input||!input.trim())return {error:'empty'};const tokens=tokenize(input.trim());const name=tokens[0].toLowerCase();const args=tokens.slice(1);const allowed=['start','stop','restart','list','join','chat','exec','logs','stats'];if(!allowed.includes(name))return {error:`unknown command: ${name}`};
// basic validation
if(name==='start'||name==='stop'||name==='restart'||name==='logs'){if(args.length<1) return {error:`${name} requires <alt>`}}
if(name==='join'){if(args.length<2) return {error:'join requires <alt> <server[:port>]'}}
if(name==='chat'){if(args.length<2) return {error:'chat requires <alt|all> <message>'}}
if(name==='exec'){if(args.length<2) return {error:'exec requires <alt|all> <action...>'}}
return {name,args}
}
module.exports={parseManualCmd}
