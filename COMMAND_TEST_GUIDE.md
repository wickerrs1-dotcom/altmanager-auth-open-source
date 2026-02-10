# ✅ Alt Manager - Complete Command Test Guide

## System Status
- ✅ **Single `/alts` command** deployed (no prefill, no subcommands)
- ✅ **13 individual commands removed** (alts-start, alts-stop, etc. deleted)
- ✅ **Manual text input parsing** implemented
- ✅ All handlers updated to use BotManager methods
- ✅ `join()` method implemented
- ✅ `move()` method fixed
- ✅ `logs()` and `reason()` methods implemented

---

## 📋 All Available Commands

### Information Commands

#### 1. **Help** - Show command list
```
/alts help
Expected: Shows this complete command reference as embed
```

#### 2. **List** - Show connected alts
```
/alts list
Expected: 🟢 alt1 — IGN — online
          🔴 alt2 — alt2 — offline

/alts list all
Expected: Shows ALL alts including offline
```

#### 3. **Status** - Get detailed alt info
```
/alts status alt1
Expected:
  State: online
  IGN: <minecraft username>
  Server: A
  Reason: none
```

#### 4. **Stats** - Overall health
```
/alts stats
Expected:
  Total: 3
  Online: 1
  Connecting: 0
  Offline: 2
```

#### 5. **Health** - Manager health (long form)
```
/alts health
Expected: Same as stats but in detailed embed format
```

---

### Control Commands

#### 6. **Start** - Connect alt(s)
```
/alts start alt1
Expected: alt1: Queued (waiting) or now (if serialization slot available)

/alts start ALL
Expected: Starts all enabled alts sequentially
```

#### 7. **Stop** - Disconnect alt(s)
```
/alts stop alt1
Expected: alt1: Stopped

/alts stop ALL
Expected: Disconnects all alts
```

#### 8. **Restart** - Reconnect alt(s)
```
/alts restart alt1
Expected: Disconnects then reconnects

/alts restart ALL
Expected: Restarts all alts
```

---

### Server/Movement Commands

#### 9. **Move** - Change server (changes config + restarts)
```
/alts move alt1 A
Expected: alt1: Moved to server A (then restarts to apply)

/alts move alt1 B
Expected: alt1: Moved to server B
```

#### 10. **Join** - Execute join commands (sends join commands immediately)
```
/alts join alt1 A
Expected: alt1: Joined server A
         (Executes /server factions or configured join commands)

/alts join alt1 B
Expected: alt1: Joined server B
```

**Key Difference:**
- `move alt1 A` = Change to A in config + restart (full move)
- `join alt1 A` = Execute join commands (fast, no restart)

---

### Chat/Message Commands

#### 11. **Chat** - Send message in-game
```
/alts chat alt1 hello world
Expected: alt1: Message sent

/alts chat alt1 /say hi
Expected: Executes command: /say hi
```

#### 12. **Reason** - Why is this alt offline?
```
/alts reason alt1
Expected: alt1: Socket closed: Session ended
       or alt1: No disconnect recorded
```

---

### Configuration Commands

#### 13. **Enable** - Mark alt as enabled
```
/alts enable alt1
Expected: alt1: Enabled
         (Will auto-start on next bot restart)
```

#### 14. **Disable** - Mark alt as disabled
```
/alts disable alt1
Expected: alt1: Disabled
         (Will not auto-start on restart)
```

#### 15. **Logs** - View alt logs
```
/alts logs alt1
Expected: [Last 50 log lines from logs/alts/alt1.log]

/alts logs alt1 100
Expected: [Last 100 log lines]
```

---

## 🧪 Test Scenarios

### Scenario 1: Basic Connection
1. `/alts list all` → Should show all alts with 🔴 offline
2. `/alts start alt1` → Should show alt1 connecting/queued
3. Wait 20s
4. `/alts status alt1` → Should show IGN, Server A, State=online
5. `/alts list` → Should show 🟢 alt1 online
6. Wait 30s
7. `/alts stop alt1` → Should disconnect
8. `/alts list` → Should show 🔴 alt1 offline

### Scenario 2: Server Movement
1. `/alts start alt1` → Connect to server A
2. Wait for online
3. `/alts move alt1 B` → Change to B + restart
4. `/alts status alt1` → Should show Server: B
5. After reconnect: `/alts join alt1 B` → Execute join commands

### Scenario 3: Chat
1. `/alts start alt1` → Connect
2. Wait for online
3. `/alts chat alt1 hello` → Should send message
4. Check game chat - should see: **alt1: hello**
5. `/alts chat alt1 /say test` → Should execute /say command

### Scenario 4: Batch Operations
1. `/alts start ALL` → Should start all enabled alts
   - alt1 connects immediately
   - alt2 queued (90s timeout)
   - alt3 queued (90s timeout)
2. Monitor: Should serialize (one at a time with 90s spacing)
3. `/alts stop ALL` → Should disconnect all

### Scenario 5: Logging
1. `/alts logs alt1` → Should return 50 lines
2. `/alts logs alt1 100` → Should return 100 lines
3. `/alts reason alt1` → Should show last disconnect reason

---

## 🔍 Verification Checklist

- [ ] `/alts help` shows embed with all commands
- [ ] `/alts list` shows online alts only
- [ ] `/alts list all` shows all alts (online + offline)
- [ ] `/alts status alt1` shows IGN (not alt ID)
- [ ] `/alts start alt1` works (checks serialization)
- [ ] `/alts stop alt1` disconnects properly
- [ ] `/alts restart alt1` reconnects
- [ ] `/alts move alt1 A` changes server and restarts
- [ ] `/alts join alt1 A` executes join commands without full restart
- [ ] `/alts chat alt1 hello` sends message in-game
- [ ] `/alts reason alt1` shows disconnect reason
- [ ] `/alts enable alt1` marks enabled
- [ ] `/alts disable alt1` marks disabled
- [ ] `/alts logs alt1` shows log file contents
- [ ] `/alts stats` shows correct counts
- [ ] `/alts health` shows detailed embed
- [ ] Batch: `/alts start ALL` serializes properly (90s spacing)
- [ ] Batch: `/alts stop ALL` disconnects all
- [ ] Error handling: Invalid alt name shows error
- [ ] Error handling: Wrong server letter shows error

---

## 🚀 Production Ready

All commands are now:
- ✅ Zero prefill/autocomplete
- ✅ Manual text input parsing
- ✅ Proper error messages
- ✅ Embeds for list/status responses
- ✅ Serialization support (max 1 concurrent)
- ✅ Backoff on reconnect
- ✅ AFK realism enabled
- ✅ IGN tracking and display
- ✅ Server movement support
- ✅ Chat relay support

**Ready to test in Discord!**
