Wicked Alt Manager v1.3.2

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up accounts (creates `accounts.json` from `accounts.example.json` automatically on first run):
   ```bash
   npm run accounts:template
   ```

3. Edit these files ONLY:
   - `config.json` — server hosts, limits, autoJoin/antiAfk/chat settings
   - `accounts.json` — your alt emails, enabled status, server (A/B), custom join commands
   - `run.bat` — set your Discord bot token (replace PASTE_TOKEN_HERE with actual token)

4. Deploy Discord commands:
   ```bash
   set DISCORD_TOKEN=<your_token>
   node tools/deployCommands.js
   ```

5. Start the bot:
   ```bash
   run.bat
   ```

6. In Discord, try:
   ```
   /alts cmd:"ping"
   /alts cmd:"start alt1"
   ```

## How accounts.json Works

- On first run, if `accounts.json` does not exist, it is created automatically from `accounts.example.json`.
- Schema: `email` (Microsoft), `enabled`, `server` (A or B), `join` (commands after spawn)
- Auto-migration: old `username` → `email`, `serverId` → `server`, `joinCommands` → `join`

## Console Output

- You will see live Minecraft chat in CMD for the "watchAlt" (default: alt1)
- Status updates for all alts: Connecting, Connected, Disconnected, Kicked, Error
- If server throttles: retryIn >= 300s (never reconnect-storm)

## Files Structure

- `src/` — simplied bot manager, Discord command handler, logger
- `config.json` — user-editable (servers, limits, modules)
- `accounts.json` — user-editable (alt list, 20 slots)
- `run.bat` — launcher (set DISCORD_TOKEN here locally, not in config)
- `state/auth/` — cached Microsoft session tokens (git-ignored)
- `logs/` — per-alt logs (git-ignored)

## Important Notes

- **DISCORD_TOKEN must be set in run.bat ONLY** (never in config.json or code)
- **accounts.json and config.json are git-ignored** (local config only)
- Real Mineflayer game connections (v1.3.2+)
- 25s spacing between alt connects
- 300s minimum backoff for "logging in too fast" errors
- No console black screen — live status output

