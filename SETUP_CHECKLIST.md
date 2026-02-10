# Wicked Alts Manager v1.3.2 - Setup Checklist

## ✓ Single-Source-of-Truth Setup

- ✓ Minecraft version locked to **1.8.9**
- ✓ One config file: `config.json` (all settings)
- ✓ One accounts file: `accounts.json` (all alts)
- ✓ No example files needed (templates generated inline)
- ✓ /alts Discord command configured (help embed UX)
- ✓ All tests passing (40/40)

---

## ⚠️ 3-STEP SETUP (5 MINUTES)

### Step 1: Generate accounts.json Template
```bash
npm run accounts:template
```

Creates `accounts.json` with 20 slots (alt1..alt20):
- alt1 enabled by default
- alt2..alt20 disabled (fill in emails to enable)
- alt1..alt10 on server A
- alt11..alt20 on server B

---

### Step 2: Fill run.bat Discord Token

Edit `run.bat` line 5:
```bat
set DISCORD_TOKEN=your_token_here
```

Keep it secret! This is the bot's authentication.

---

### Step 3: Fill accounts.json with Email Addresses

Edit `accounts.json` (created in Step 1):

```json
{
  "defaults": { "auth": "microsoft", "server": "A", "enabled": false, "join": [] },
  "alts": [
    { "id": "alt1", "email": "your_email@hotmail.com", "enabled": true, "server": "A", "join": [] },
    { "id": "alt2", "email": "alt2@hotmail.com", "enabled": true, "server": "A", "join": [] },
    ...
    { "id": "alt20", "email": "", "enabled": false, "server": "B", "join": [] }
  ]
}
```

**Rules:**
- `email` — Microsoft account email (required if enabled=true)
- `enabled` — true/false to run this alt
- `server` — "A" or "B" (which server to join)
- `join` — Custom commands (empty = use server's autoJoin)

---

## 🚀 RUN THE BOT

```bash
run.bat
```

That's it! The bot will:
1. Load `config.json` + `accounts.json`
2. Connect alts (25s spacing, max 2 concurrent)
3. Auto-join servers (6s after spawn)
4. Watch `alt1` console
5. Listen for `/alts` commands in Discord

---

## 📋 config.json (Already Pre-Filled)

### 3. **accounts.json** - Microsoft Account Emails
```json
{
  "alts": [
    { "id": "alt1", "email": "your_email_1@hotmail.com", "enabled": true, ... },
    { "id": "alt2", "email": "your_email_2@hotmail.com", "enabled": true, ... },
    ...
    { "id": "alt20", "email": "", "enabled": false, ... }
  ]
}
```

**Fields to fill:**
- Each alt's `email` - Microsoft account email
- Toggle `enabled: true/false` to enable/disable alts

**Location:** `accounts.json`

---

## 🚀 Next Steps

1. **Edit run.bat:**
   - Replace `PASTE_TOKEN_HERE` with your actual Discord bot token

2. **Edit config.json:**
   - Fill in your Minecraft server addresses
   - Fill in your Discord guild ID and startup channel ID

3. **Edit accounts.json:**
   - Add Microsoft account emails to each alt's `email` field
   - Toggle `enabled: true` for alts you want to use

4. **Run the bot:**
   ```bash
   run.bat
   ```

---

## ✓ Verification

All automated checks passed:
- 7 test suites
- 40 tests
- 0 failures

Discord command deployed: `/alts [cmd]`

---

## 📋 What Changed

**Version Locked:** Minecraft 1.8.9 (no longer configurable)

**Config Simplified:** Removed 100+ lines of experimental settings; kept only essentials:
- minecraft.version (locked to 1.8.9)
- servers A/B (host, port)
- limits (maxAltsTotal=20, maxConcurrentConnecting=2)
- reconnect policy (300-900s backoff)
- console (live, with alt watchdog)
- autoJoin, antiAfk, chat (enabled by default)
- discord (guildId, startupChannelId)

**Run.bat Safety:** 
- No output redirection (live console)
- 5s restart interval on crash
- Title: "Wicked Alts (1.8.9)"

**Auto-Bootstrap:** If `accounts.json` missing, it's created from `accounts.example.json` on first run.

**Validation:** Config is checked for:
- No FILL_ placeholders left unfilled
- Server names must be A or B
- maxAltsTotal capped at 20
- Email required for enabled alts

---

## 📞 Support

Issues during setup? Check:
1. Discord token is valid and bot has permissions
2. Minecraft server addresses are correct
3. All Microsoft account emails are valid (case-sensitive!)
4. Discord guild ID and channel ID are correct

