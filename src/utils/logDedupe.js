"use strict";

const lastMap = new Map();

function shouldSend(key, message, windowMs = 3000) {
  try {
    const now = Date.now();
    const prev = lastMap.get(key);
    if (!prev) {
      lastMap.set(key, { message, at: now });
      return true;
    }
    if (prev.message === message && (now - prev.at) < windowMs) return false;
    lastMap.set(key, { message, at: now });
    return true;
  } catch (e) {
    return true;
  }
}

module.exports = { shouldSend };
