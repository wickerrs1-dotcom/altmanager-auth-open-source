const discordLogger = require('../logging/discordLogger');

class ChatRelay {
  constructor(altId, serverId, opts = {}) {
    this.altId = altId;
    this.serverId = serverId;
    this.buffer = [];
    this.lastFlush = Date.now();
    this.flushInterval = opts.flushInterval || 5000; // 5s buffer
    this.maxBufferSize = opts.maxBufferSize || 20; // max 20 msgs before flush
    this.flushTimer = null;
    this.onSend = opts.onSend || (() => {});
  }

  addMessage(message) {
    try {
      if (!message || typeof message !== 'string') return;
      
      const msg = message.trim();
      if (!msg || msg.length === 0) return;

      // Parse IGN: message format
      const match = msg.match(/^<([^>]+)>\s*(.+)$/);
      if (!match) return; // Ignore system messages, join/leave, etc
      
      const [, ign, content] = match;
      const sanitized = this._sanitize(content);
      
      // Ignore empty or short spam
      if (!sanitized || sanitized.length < 2) return;
      
      // Trim long lines
      const truncated = sanitized.length > 200 ? sanitized.substring(0, 200) + '…' : sanitized;
      
      this.buffer.push({ ign, content: truncated, ts: Date.now() });
      
      // Auto-flush if buffer full
      if (this.buffer.length >= this.maxBufferSize) {
        this.flush();
      } else if (!this.flushTimer) {
        this.flushTimer = setTimeout(() => this.flush(), this.flushInterval);
      }
    } catch (e) {
      try { console.error(`[ChatRelay] Error adding message: ${e.message}`); } catch {}
    }
  }

  _sanitize(msg) {
    if (!msg) return '';
    // Remove ANSI color codes
    let clean = msg.replace(/§./g, '');
    // Remove control chars, keep alphanumeric + common punct
    clean = clean.replace(/[^\w\s\-.,!?():'"&]/g, ' ');
    // Collapse whitespace
    clean = clean.replace(/\s+/g, ' ').trim();
    return clean;
  }

  flush() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    
    if (this.buffer.length === 0) return;
    
    const messages = this.buffer.splice(0);
    this.lastFlush = Date.now();
    
    try {
      this.onSend(messages);
    } catch (e) {
      try { console.error(`[ChatRelay] Error in onSend: ${e.message}`); } catch {}
    }
  }

  end() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
    this.buffer = [];
    this.seen.clear();
  }
}

module.exports = ChatRelay;
