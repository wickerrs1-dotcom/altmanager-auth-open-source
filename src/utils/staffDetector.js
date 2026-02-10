class StaffDetector {
  constructor() {
    this.signals = {}; // altId -> [{ type, ts }]
    this.confidenceThreshold = 2;
    this.confidentSignalWindow = 30000; // 30s
  }

  recordSignal(altId, signalType) {
    try {
      if (!altId) return;
      if (!this.signals[altId]) this.signals[altId] = [];
      
      this.signals[altId].push({ type: signalType, ts: Date.now() });
      
      // Cleanup old signals
      const now = Date.now();
      this.signals[altId] = this.signals[altId].filter(s => now - s.ts < this.confidentSignalWindow);
      
      // Check if confident
      if (this.signals[altId].length >= this.confidenceThreshold) {
        return this.isConfident(altId);
      }
    } catch (e) {}
    return false;
  }

  isConfident(altId) {
    if (!this.signals[altId]) return false;
    const sigs = this.signals[altId];
    if (sigs.length < this.confidenceThreshold) return false;
    
    // Get unique signal types in window
    const types = new Set(sigs.map(s => s.type));
    return types.size >= this.confidenceThreshold;
  }

  getSignals(altId) {
    const sigs = this.signals[altId] || [];
    return sigs.map(s => s.type).join(', ');
  }

  clear(altId) {
    if (altId) delete this.signals[altId];
  }
}

module.exports = StaffDetector;
