"use strict";
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const ask = (rl, q) => new Promise(r => rl.question(q, a => r(String(a || "").trim())));
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const write = (p, o) => { const t = p + ".tmp"; fs.writeFileSync(t, JSON.stringify(o, null, 2), "utf8"); fs.renameSync(t, p); };

(async () => {
  const ROOT = process.cwd();
  const cfgPath = path.join(ROOT, "config.json");
  const accPath = path.join(ROOT, "accounts.json");

  const cfg = read(cfgPath);
  const acc = read(accPath);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log("=== Wizard (Ultimate Alt Manager FINAL) ===");

  console.log('NOTE: DISCORD_TOKEN must be set in run.bat (do NOT store tokens in repo).');

  const appId   = await ask(rl, `discord.appId (${cfg.discord.appId || ""}): `);
  const guildId = await ask(rl, `discord.guildId (${cfg.discord.guildId || ""}): `);
  const channelId = await ask(rl, `discord.channelId (${cfg.discord.channelId || ""}): `);

  if (appId) cfg.discord.appId = appId;
  if (guildId) cfg.discord.guildId = guildId;
  if (channelId) cfg.discord.channelId = channelId;

  for (const sid of Object.keys(cfg.servers)) {
    const host = await ask(rl, `servers.${sid}.host (${cfg.servers[sid].host || ""}): `);
    if (host) cfg.servers[sid].host = host;
  }

  const mode = (await ask(rl, "Type 'rebuild' to rebuild accounts for 20+ alts; Enter to keep: ")).toLowerCase();
  if (mode === "rebuild") {
    acc.alts = [];
    const count = Math.max(1, parseInt(await ask(rl, "How many alts? (20): ") || "20", 10) || 20);
    const serverIds = Object.keys(cfg.servers);
    console.log("Servers:", serverIds.join(", "));
    for (let i = 1; i <= count; i++) {
      const id = `alt${i}`;
      const username = await ask(rl, `Alt ${id} username: `);
      const auth = (await ask(rl, `Alt ${id} auth microsoft/offline [microsoft]: `)) || "microsoft";
      const server = (await ask(rl, `Alt ${id} server [${serverIds[0]}]: `)) || serverIds[0];
      // Only enable the first alt by default; others can be enabled later in accounts.json or via UI
      const enabled = (i === 1);
      acc.alts.push({ id, username, auth, enabled, server, join: [] });

      // If the account uses Microsoft auth, attempt to request a device-code (if clientId configured)
      try {
        const linksDir = path.join(ROOT, "state", "auth-links");
        fs.mkdirSync(linksDir, { recursive: true });
        if ((auth || "").toLowerCase().includes("micro")) {
          const clientId = cfg.auth?.clientId || cfg.auth?.client_id;
          const scopes = Array.isArray(cfg.auth?.scopes) ? cfg.auth.scopes.join(" ") : (cfg.auth?.scopes || "offline_access openid");
          let out = "";
          if (clientId) {
            try {
              const { requestDeviceCode, pollDeviceToken, saveTokenDump } = require('../src/utils/msAuth');
              const dev = await requestDeviceCode(clientId, scopes);
              if (dev && dev.user_code) {
                out += `Device verification URL: ${dev.verification_uri_complete || dev.verification_uri}\n`;
                out += `User code: ${dev.user_code}\n`;
                out += `Expires in: ${dev.expires_in}s\n`;
                out += `Do NOT share tokens, passwords or emails.\n`;
                // auto-poll to complete device authorization and capture refresh_token
                try {
                  const tok = await pollDeviceToken(clientId, dev.device_code, dev.interval, dev.expires_in);
                  if (tok && tok.refresh_token) {
                    // persist refresh token into accounts.json for this alt
                    const found = acc.alts.find(a => (a.id || a.username) === id);
                    if (found) { found.refreshToken = tok.refresh_token; }
                    saveTokenDump(id, tok);
                    out += `Device authorized and refresh_token stored for ${id}.\n`;
                  } else {
                    out += `Device polling returned: ${JSON.stringify(tok)}\n`;
                  }
                } catch (pe) { out += `Device polling incomplete: ${String(pe?.message || pe)}\n`; }
              } else {
                out = `Open https://microsoft.com/devicelogin and enter the code shown there.\n`;
              }
            } catch (e) {
              out = `Open https://microsoft.com/devicelogin and follow the instructions.\n`;
            }
          } else {
            out = `Open https://microsoft.com/devicelogin and follow the instructions.\n`;
          }

          // write minimal info (no emails/tokens)
          fs.writeFileSync(path.join(linksDir, `${id}.txt`), out, "utf8");
        }
      } catch (e) { /* ignore */ }
    }
  }

  write(cfgPath, cfg);
  write(accPath, acc);

  console.log("âœ… Wizard done. Next: doctor.bat then install.bat then deploy_commands.bat then run.bat");
  rl.close();
})().catch(e => { console.error(String(e?.message || e)); process.exit(1); });