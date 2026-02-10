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
  // Dynamically load all new modular commands from src/discord/commands/
  const commands = [];
  const commandsPath = path.join(process.cwd(), 'src', 'discord', 'commands');
  
  if (fs.existsSync(commandsPath)) {
    const files = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
    for (const file of files) {
      try {
        const cmd = require(path.join(commandsPath, file));
        if (cmd.data && cmd.data.toJSON) {
          commands.push(cmd.data.toJSON());
        }
      } catch (e) {
        console.warn(`Warning: Failed to load command ${file}:`, e.message);
      }
    }
  }
  
  return commands;
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

  // Deploy to GUILD only (clear global commands first if any old ones linger)
  try {
    // Clear global commands (in case old /alts cmd is registered globally)
    await rest.put(Routes.applicationCommands(cfg.discord.appId), { body: [] });
    console.log("✓ Cleared global commands");
    
    // Deploy to GUILD only (no global registration)
    await rest.put(Routes.applicationGuildCommands(cfg.discord.appId, cfg.discord.guildId), { body });
    console.log("✓ Deployed new commands to GUILD only");
    console.log(`✓ Registered ${body.length} commands`);
    console.log('\nCommand list:');
    body.forEach(cmd => console.log(`  - /${cmd.name}`));
  } catch (e) {
    console.error("✗ Deploy failed:", String(e?.message || e));
    process.exit(1);
  }
})().catch((e) => {
  console.error(String(e?.stack || e));
  process.exit(1);
});
