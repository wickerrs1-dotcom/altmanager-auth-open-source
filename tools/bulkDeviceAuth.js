// Bulk device code export for all enabled alts
const fs = require('fs');
const accounts = require('../accounts.json');
const pa = (() => { try { return require('prismarine-auth'); } catch (e) { return null } })();

if (!pa || !pa.Authflow) {
  console.log('prismarine-auth Authflow not available. Please install prismarine-auth.');
  process.exit(1);
}

const enabledAlts = accounts.alts.filter(a => a.enabled && (!a.refreshToken || a.refreshToken === ''));
if (enabledAlts.length === 0) {
  console.log('All enabled alts already have refreshToken.');
  process.exit(0);
}

console.log('Bulk Device Auth: Visit https://microsoft.com/devicelogin and enter each code below.');

let idx = 0;
function nextAuth() {
  const alt = enabledAlts[idx];
  const { Authflow } = pa;
  const flow = new Authflow(
    alt.email || alt.id,
    'ultimate-alt-manager',
    {
      flow: 'live',
      authTitle: '00000000402b5328', // Minecraft Java clientId
      deviceType: 'Win32',
      save: false
    },
    (code) => {
      console.log(`Alt: ${alt.id} | Email: ${alt.email}`);
      console.log(`Code: ${code.user_code}`);
      console.log(`URL: ${code.verification_uri}`);
      console.log('-----------------------------');
    }
  );
    // Replaced getXboxToken() with msAuth.getSession() flow
    const msAuth = require('../src/auth/msAuth');
    (async () => {
      const session = await msAuth.getSession(altKey, account, config);
      if (session && session.accessToken) {
        alt.refreshToken = session.accessToken; // Assuming accessToken is used similarly
      fs.writeFileSync('../accounts.json', JSON.stringify(accounts, null, 2), 'utf8');
    }
    idx++;
    nextAuth();
  }).catch(e => {
    console.log(`[AUTH ERROR] Alt: ${alt.id} | ${e.message || e}`);
    idx++;
    nextAuth();
  });
}

nextAuth();
