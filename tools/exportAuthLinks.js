// Script to export Microsoft auth links for all enabled alts missing refreshToken
const fs = require('fs');
const path = require('path');
const accounts = require('../accounts.json');

const AUTH_URL = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=YOUR_REDIRECT_URI&scope=XboxLive.signin%20offline_access';

const links = [];
for(const alt of accounts.alts){
  if(alt.enabled && (!alt.refreshToken || alt.refreshToken === '')){
    links.push(`Alt: ${alt.id} | Email: ${alt.email} | Auth Link: ${AUTH_URL}`);
  }
}

if(links.length === 0){
  console.log('All enabled alts have refreshToken.');
} else {
  const outPath = path.join(__dirname, 'authLinks.txt');
  fs.writeFileSync(outPath, links.join('\n'), 'utf8');
  console.log(`Auth links exported to ${outPath}`);
  console.log(links.join('\n'));
}
