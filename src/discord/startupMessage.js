const fs = require('fs');
const path = require('path');

let bootMessageSent = false;

async function sendStartupMessage(client, channelId) {
  if (bootMessageSent) return;
  bootMessageSent = true;

  if (!channelId) return;

  try {
    const channel = client.channels.cache.get(channelId);
    if (!channel) return;
    
    const pjson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8'));
    const version = pjson.version || '1.0.0';
    const timestamp = new Date().toLocaleString('en-US', {timeZone: 'America/Chicago'});
    
    await channel.send(`✅ Wicked Alt Manager v${version} online at ${timestamp}`);
  } catch (e) {
    // Fail silently
  }
}

module.exports = { sendStartupMessage };
