"use strict";
const { formatMccLog } = require("./mccLog");
const { shouldSend } = require("./logDedupe");

// logDiscord({ alt, state, server, relay })
// state: connecting|online|offline
function logDiscord({ alt, state, action, detail, server, relay }) {
  if (!alt) return;
  let act = action || null;
  if (!act && state) {
    const map = { connecting: 'Connecting', online: 'Connected', offline: 'Disconnected' };
    act = map[state] || String(state);
  }
  if (!act) act = 'Info';
  const msg = formatMccLog({ alt, action: act, server }) + (detail ? ` | ${String(detail).slice(0, 800)}` : '');
  const key = String(alt);
  if (!shouldSend(key, msg, 3500)) return;
  try {
    if (typeof relay === 'function') relay(msg);
  } catch (e) {}
}

module.exports = { logDiscord };
