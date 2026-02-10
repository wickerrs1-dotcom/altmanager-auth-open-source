"use strict";
const fs = require("fs");
const path = require("path");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");

function loadToken() {
  // Enforce token via environment only (per security policy)
  if (process.env.DISCORD_TOKEN && process.env.DISCORD_TOKEN.trim()) return process.env.DISCORD_TOKEN.trim();
  console.error('DISCORD_TOKEN environment variable required (set in run.bat)');
  process.exit(1);
}

function loadConfig() {
  const cfgPath = path.join(process.cwd(), "config.json");
  const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
  if (!cfg.discord?.appId) throw new Error("discord.appId not set");
  if (!cfg.discord?.guildId) throw new Error("discord.guildId not set");
  if (cfg.discord.appId !== "1469392817121005571") throw new Error("discord.appId must be 1469392817121005571");
  return cfg;
}

function buildCommands() {
  return [
    {
      name: "alts",
      description: "Alt manager",
      options: [
        { type: 3, name: "cmd", description: "Manual command (ex: start alt1, join alt1 server, logs alt1)", required: false }
      ]
    }
  ];
}

function buildViewChat() {
  return [];
}

function buildTopLevel() {
  return [];
}

(async () => {
  const cfg = loadConfig();
  const token = loadToken();

  const rest = new REST({ version: "10" }).setToken(token);
  const body = buildCommands().concat(buildTopLevel()).concat(buildViewChat());

  // Deploy to GUILD only (no global registration)
  try {
    await rest.put(Routes.applicationGuildCommands(cfg.discord.appId, cfg.discord.guildId), { body });
    console.log("✓ Deployed /alts command to GUILD only");
    console.log('\nCommand JSON:');
    console.log(JSON.stringify(body, null, 2));
  } catch (e) {
    console.error("✗ Deploy failed:", String(e?.message || e));
    process.exit(1);
  }
})().catch((e) => {
  console.error(String(e?.stack || e));
  process.exit(1);
});
