"use strict";

function pad2(n) { return String(n).padStart(2, '0'); }

function formatTime12(date = new Date()) {
  const h = date.getHours();
  const h12 = h % 12 || 12;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const m = pad2(date.getMinutes());
  const s = pad2(date.getSeconds());
  return `${pad2(h12)}:${m}:${s} ${ampm}`;
}

// action should be one of: Connected, Connecting, Disconnected
function formatMccLog({ alt, action, server }) {
  const t = formatTime12(new Date());
  const a = String(action || '').trim();
  const al = String(alt || '-');
  const srv = server ? String(server) : undefined;
  if (srv) return `[${t}] [${al}] ${a} -> ${srv}`;
  return `[${t}] [${al}] ${a}`;
}

module.exports = { formatMccLog };
