# 🤖 Ultimate Alt Manager v2.1.0

**PROPRIETARY SOFTWARE** - See LICENSE file for terms

A production-ready Minecraft alt account manager with Discord integration, 24/7 chat relay, auto-reconnection, health scoring, and staff detection.

---

## 📋 Features

- **Multi-Alt Management**: Control 20+ accounts simultaneously with intelligent connection spacing
- **Microsoft Device-Code Auth**: Secure Microsoft authentication with automatic token caching
- **Discord Integration**: Full command control via Discord slash commands with 12-hour time format
- **Chat Relay**: Real-time server chat relay to Discord with message buffering
- **Auto-Reconnection**: Exponential backoff with jitter prevents rate-limiting
- **AFK Realism**: Look jitter, position keep-alive, and hotbar cycling
- **Health Scoring**: Track alt reliability with disconnect history
- **Staff Detection**: Multi-signal detection for staff members
- **Clean Console**: MCC-style logging with 12-hour time format
- **Security**: Automatic sensitive data redaction, cleanup script

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Configuration

Copy and edit the example files:

```bash
copy example-accounts.json accounts.json
copy example-config.json config.json
```

**Fill in your settings:**
- `accounts.json`: Your Minecraft email accounts
- `config.json`: Server hosts, Discord channel ID, etc.
- `.env` or Set environment: `DISCORD_TOKEN=your_bot_token`

### 3. Run

```bash
npm start
# or use: run.bat
```

---

## 📝 Configuration

### `config.json` Structure

```json
{
  "minecraft": { "version": "1.8.9" },
  "servers": {
    "A": { "host": "server1.example.net", "chatRelayAlt": "alt1" },
    "B": { "host": "server2.example.net" }
  },
  "discord": {
    "guildId": "your-guild-id",
    "channelId": "your-channel-id"
  }
}
```

### `accounts.json` Structure

```json
{
  "defaults": { "auth": "microsoft", "enabled": false },
  "alts": [
    { "id": "alt1", "email": "account1@outlook.com", "enabled": true, "server": "A" },
    { "id": "alt2", "email": "account2@gmail.com", "enabled": true, "server": "B" }
  ]
}
```

---

## 🎮 Discord Commands

Use `/alts [command]` with manual text input:

| Command | Format | Example |
|---------|--------|---------|
| Help | `/alts help` | Shows command menu |
| List | `/alts list` | Shows all alts |
| Status | `/alts status` | Manager health |
| Start | `/alts start alt1` | Connect account |
| Stop | `/alts stop alt1` | Disconnect |
| Restart | `/alts restart alt1` | Reconnect |
| Enable | `/alts enable alt1` | Mark enabled |
| Disable | `/alts disable alt1` | Mark disabled |
| Move | `/alts move alt1 B` | Switch server |
| Chat | `/alts chat alt1 hello` | Send message |
| Logs | `/alts logs alt1 50` | View logs |

---

## 📂 Project Structure

```
src/
├── botManager.js              # Core management
├── discord.js                 # Discord client
├── config.js                  # Config loader
├── logger.js                  # Logging (12h format)
├── security.js                # Auth & redaction
├── minecraft/
│   ├── protocolClient.js      # minecraft-protocol wrapper
│   └── botManager.js          # Worker management
├── discord/
│   ├── commands/
│   │   └── alts.js            # /alts command
│   └── handlers/
│       └── alts.js            # Command logic
├── utils/
│   ├── chatRelay.js           # Chat buffering
│   ├── healthScorer.js        # Health tracking
│   └── staffDetector.js       # Staff detection
└── logging/
    ├── mccFormat.js           # Log formatting
    └── discordLogger.js       # Discord audit logs
```

---

## 🔒 Security & Privacy

### Never Share These Files

- `accounts.json` - Email & account info
- `.env` - Discord bot token
- `logs/` - Connection history
- `state/auth-cache/` - Auth tokens
- `node_modules/` - Dependencies

### Safe Sharing

Before sharing, run:

```bash
cleanup-before-share.bat
```

Then safe to share:
- `example-accounts.json`
- `example-config.json`
- `src/` code
- `package.json`
- `LICENSE`

---

## 🕐 Time Format

All timestamps use **12-hour format with AM/PM**:

```
[02:45:30 PM] Alt connected
[11:15:22 AM] Disconnected
```

---

## 📊 Console Output

```
====================================
Ultimate Alt Manager v2.1.0
====================================
[CONFIG] Loaded 20 alts, 12 enabled
[STARTUP] Discord connecting...
02/10/2026, 02:15:47 PM SYSTEM_START | version=2.1.0
[STARTUP] BotManager ready
Alt manager started v2.1.0 | Ready for commands
02/10/2026 02:15:47 PM [MGR] alt1: connected server=A ign=WickedBank
```

---

## 🔄 Connection Flow

1. User types: `/alts start alt1`
2. Handler parses and calls `botManager.start()`
3. ProtocolClient connects with Microsoft device-code auth
4. On login: Records IGN, starts AFK timers, initializes chat relay
5. Chat relay buffers server messages and sends to Discord
6. On disconnect: Auto-reconnect with exponential backoff

---

## 🐛 Troubleshooting

### "DISCORD_TOKEN not found"
Set in `.env` or environment:
```
DISCORD_TOKEN=YOUR_TOKEN
```

### "config.json not found"
Copy example and fill in:
```bash
copy example-config.json config.json
```

### "Chat not in Discord"
1. Check `config.discord.channelId`
2. Bot needs "Send Messages" permission
3. Check `chatRelayAlt` in config.servers
4. Review `logs/audit.log`

### "Alt disconnects immediately"
1. Verify Microsoft credentials
2. Check server is online
3. Check whitelist if enabled
4. Look for "AUTH_FAILED" in logs

---

## 📜 Version

**v2.1.0** (February 10, 2026)
- 12-hour time format (12h AM/PM)
- Proprietary LICENSE
- Example configs
- Cleanup script
- Fixed Discord chat relay
- Clean MCC-style output

---

## 📄 License

**PROPRIETARY SOFTWARE**

This software is proprietary. You may NOT:
- Distribute to others
- Modify the code
- Use commercially
- Reverse engineer
- Remove copyright notices

**See LICENSE file for full terms.**

---

**Author**: Wicked  
**Framework**: Node.js + discord.js + minecraft-protocol
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

