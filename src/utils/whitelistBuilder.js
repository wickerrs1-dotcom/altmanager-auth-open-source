const fs = require('fs');
const path = require('path');

class WhitelistBuilder {
  constructor(accounts = {}, config = {}) {
    this.accounts = accounts;
    this.config = config;
    this.whitelist = new Set();
    this.build();
  }

  build() {
    // Auto-add all known alt IGNs
    if (this.accounts.alts && Array.isArray(this.accounts.alts)) {
      for (const alt of this.accounts.alts) {
        if (alt.id) this.whitelist.add(alt.id.toLowerCase());
      }
    }

    // Check config common fields
    if (this.config.faction) {
      if (this.config.faction.members && Array.isArray(this.config.faction.members)) {
        for (const m of this.config.faction.members) {
          if (typeof m === 'string') this.whitelist.add(m.toLowerCase());
        }
      }
      if (this.config.faction.allies && Array.isArray(this.config.faction.allies)) {
        for (const a of this.config.faction.allies) {
          if (typeof a === 'string') this.whitelist.add(a.toLowerCase());
        }
      }
      if (this.config.faction.whitelist && Array.isArray(this.config.faction.whitelist)) {
        for (const w of this.config.faction.whitelist) {
          if (typeof w === 'string') this.whitelist.add(w.toLowerCase());
        }
      }
    }

    // Load optional whitelist.txt if present
    try {
      const fp = path.join(process.cwd(), 'state', 'whitelist.txt');
      if (fs.existsSync(fp)) {
        const content = fs.readFileSync(fp, 'utf8');
        const lines = content.split('\n');
        for (const line of lines) {
          const name = line.trim().toLowerCase();
          if (name && name.length > 0) this.whitelist.add(name);
        }
      }
    } catch (e) {}
  }

  isWhitelisted(playerName) {
    if (!playerName) return false;
    return this.whitelist.has(playerName.toLowerCase());
  }

  add(playerName) {
    if (playerName) this.whitelist.add(playerName.toLowerCase());
  }

  size() {
    return this.whitelist.size;
  }
}

module.exports = WhitelistBuilder;
