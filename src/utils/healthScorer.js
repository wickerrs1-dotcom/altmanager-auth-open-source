class HealthScorer {
  constructor() {
    this.scores = {}; // altId -> { uptime, disconnects, lastReasons, serverTolerance }
  }

  initAlt(altId) {
    if (!this.scores[altId]) {
      this.scores[altId] = {
        startTime: Date.now(),
        uptimeMinutes: 0,
        disconnects1h: 0,
        disconnects24h: 0,
        lastReasons: {},
        serverTolerance: 100,
        lastUpdate: Date.now()
      };
    }
  }

  recordDisconnect(altId, reason) {
    this.initAlt(altId);
    const s = this.scores[altId];
    s.disconnects1h += 1;
    s.disconnects24h += 1;
    s.lastReasons[reason] = (s.lastReasons[reason] || 0) + 1;
    s.lastUpdate = Date.now();
  }

  computeHealth(altId) {
    this.initAlt(altId);
    const s = this.scores[altId];
    const now = Date.now();
    
    // Decay disconnects
    const age = now - s.lastUpdate;
    if (age > 3600000) s.disconnects1h = 0; // 1h
    if (age > 86400000) s.disconnects24h = 0; // 24h
    
    // Compute uptime
    s.uptimeMinutes = Math.floor((now - s.startTime) / 60000);
    
    // Health formula: start 100, subtract for problems
    let health = 100;
    health -= Math.min(20, s.disconnects1h * 5); // Per disconnect in 1h
    health -= Math.min(15, Math.floor(s.disconnects24h * 0.5)); // Per disconnect in 24h
    health *= (s.serverTolerance / 100); // Apply server tolerance
    
    return Math.max(0, Math.min(100, Math.floor(health)));
  }

  getStats(altId) {
    this.initAlt(altId);
    const s = this.scores[altId];
    return {
      health: this.computeHealth(altId),
      uptime: s.uptimeMinutes,
      disconnects1h: s.disconnects1h,
      disconnects24h: s.disconnects24h,
      lastReasons: s.lastReasons,
      serverTolerance: s.serverTolerance
    };
  }
}

module.exports = HealthScorer;
