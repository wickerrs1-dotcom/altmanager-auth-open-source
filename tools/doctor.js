"use strict";
const fs = require("fs");
const path = require("path");

const die = (m) => { console.error("DOCTOR:", m); process.exit(1); };
const read = (p) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; } };

const ROOT = process.cwd();
const cfgPath = path.join(ROOT, "config.json");
const accPath = path.join(ROOT, "accounts.json");
if (!fs.existsSync(cfgPath)) die("Missing config.json");
if (!fs.existsSync(accPath)) die("Missing accounts.json");

const cfg = read(cfgPath);
const acc = read(accPath);
if (!cfg) die("config.json invalid JSON");
if (!acc) die("accounts.json invalid");

// Enforce DISCORD_TOKEN via environment only
if (!process.env.DISCORD_TOKEN) die('DISCORD_TOKEN environment variable required. Set it in run.bat before running deploy.');

["appId", "guildId", "channelId"].forEach(k => {
  if (!cfg.discord?.[k] || String(cfg.discord[k]).includes("EDIT_HERE")) die(`discord.${k} not set`);
});

for (const [sid, s] of Object.entries(cfg.servers || {})) {
  if (!s.host || String(s.host).includes("EDIT_HERE")) die(`servers.${sid}.host not set`);
}
// support both new schema (defaults + alts array) and legacy array
const altsArr = Array.isArray(acc.alts) ? acc.alts : (Array.isArray(acc) ? acc : (acc.alts ? Object.values(acc.alts) : []));
for (const a of altsArr) {
  if (!a.id) die(`Alt missing id`);
  if (a.email === undefined) console.warn(`Alt ${a.id} missing email field`);
  if (!['A','B'].includes(a.server)) die(`Alt ${a.id || a.username} invalid server ${a.server}`);
}

console.log("Doctor OK");
console.log("Discord:", `appId=${cfg.discord.appId} guildId=${cfg.discord.guildId} channelId=${cfg.discord.channelId}`);
console.log("Alts:", acc.alts.length);
console.log("Servers:", Object.keys(cfg.servers || {}).join(", "));
process.exit(0);