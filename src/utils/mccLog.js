"use strict";

function pad2(n) { return String(n).padStart(2, '0'); }

function formatTime24(date = new Date()) {
  const h = pad2(date.getHours());
  const m = pad2(date.getMinutes());
  const s = pad2(date.getSeconds());
  return `${h}:${m}:${s}`;
}

// action should be one of: Connected, Connecting, Disconnected
function formatMccLog({ alt, action, server }) {
  const t = formatTime24(new Date());
  const a = String(action || '').trim();
  const al = String(alt || '-');
  const srv = server ? String(server) : undefined;
  if (srv) return `[${t}] [${al}] ${a} -> ${srv}`;
  return `[${t}] [${al}] ${a}`;
}

module.exports = { formatMccLog };
