const mineflayer = require("mineflayer");
const { getSession } = require("./auth/msAuth");

const CONNECT_SPACING_MS = 25000;

function timeNow() {
  const d = new Date();
  return [
    d.getHours().toString().padStart(2, "0"),
    d.getMinutes().toString().padStart(2, "0"),
    d.getSeconds().toString().padStart(2, "0")
  ].join(":");
}

function safeLog(line) {
  try { console.log(line); } catch {}
}

function computeBackoffMs(reasonText, retryCount) {
  const r = String(reasonText || "").toLowerCase();
  const isAuthFail = r.includes("auth_failed") || r.includes("403");

  if (isAuthFail) {
    const minMs = 10 * 60 * 1000;
    const maxMs = 120 * 60 * 1000;
    return Math.min(maxMs, minMs * Math.pow(2, Math.max(0, retryCount - 1)));
  }

  const base = Math.min(900000, 30000 * Math.pow(2, Math.max(0, retryCount - 1)));
  const jitter = Math.floor(Math.random() * 15000);
  return base + jitter;
}

let globalLastConnectAt = 0;
let globalConnectingCount = 0;
let globalBotsByAlt = {};
let globalTimersById = {};

class RealBotManager {
  constructor(opts = {}) {
    this.config = opts.config || {};
    this.accounts = opts.accounts || { alts: [] };
    this.logger = opts.logger || {};

    (async () => {
      await new Promise(r => setTimeout(r, 1000));
      for (const alt of this.accounts.alts) {
        if (alt.enabled) {
          await this.startAltReal(alt.id, alt);
        }
      }
    })();
  }

  async startAltReal(altKey, altAccount) {
    const existing = globalBotsByAlt[altKey];
    if (existing && (existing.state === "connecting" || existing.state === "online")) {
      return;
    }

    const now = Date.now();
    const delta = now - globalLastConnectAt;
    if (delta < CONNECT_SPACING_MS) {
      setTimeout(() => this.startAltReal(altKey, altAccount), CONNECT_SPACING_MS - delta);
      return;
    }

    globalLastConnectAt = Date.now();
    globalConnectingCount++;

    const record = {
      id: altKey,
      state: "connecting",
      reconnects: (globalBotsByAlt[altKey]?.reconnects || 0),
      lastReason: null,
      bot: null
    };
    globalBotsByAlt[altKey] = record;

    try {
      const serverCfg = this.config.servers?.[altAccount.server] || {};
      const host = serverCfg.host || "localhost";
      const port = serverCfg.port || 25565;
      const version = "1.8.9";

      const session = await getSession(altKey, altAccount, this.config);

      if (!session) {
        throw new Error("AUTH_FAILED: no session returned from msAuth");
      }

      if (!session.accessToken) {
        safeLog(`${timeNow()} [${altKey}] Missing accessToken in session (cannot connect)`);
        throw new Error("AUTH_FAILED: session missing accessToken");
      }

      if (!session.clientToken) {
        safeLog(`${timeNow()} [${altKey}] Missing clientToken in session (cannot connect)`);
        throw new Error("AUTH_FAILED: session missing clientToken");
      }

      if (!session.selectedProfile?.id || !session.selectedProfile?.name) {
        safeLog(`${timeNow()} [${altKey}] Missing selectedProfile in session (cannot connect)`);
        throw new Error("AUTH_FAILED: session missing selectedProfile");
      }

      const bot = mineflayer.createBot({
        host,
        port,
        version,
        auth: "microsoft",
        username: session.selectedProfile.name,
        accessToken: session.accessToken,
        clientToken: session.clientToken,
        selectedProfile: session.selectedProfile,
        session: {
          accessToken: session.accessToken,
          clientToken: session.clientToken,
          selectedProfile: session.selectedProfile
        },
        connectTimeout: 20000
      });

      record.bot = bot;

      bot.on("login", () => {
          record.state = "online";
          const msg = `${timeNow()} [${altKey}] Connected server=${host}`;
          safeLog(msg);
          this.logger.audit && this.logger.audit(msg);
      });

      bot.on("end", () => {
          record.state = "down";
          safeLog(`${timeNow()} [${altKey}] Bot disconnected`);
          globalConnectingCount = Math.max(0, globalConnectingCount - 1);
      });

      bot.on("error", (err) => {
          record.state = "down";
          safeLog(`${timeNow()} [${altKey}] Bot error: ${err.message}`);
          globalConnectingCount = Math.max(0, globalConnectingCount - 1);
      });

      return;
    } catch (e) {
      const reasonMessage = String(e?.message || "Unknown error");
      const publicReason = e?.__msAuthExactLogged
        ? "AUTH_FAILED (see msAuth error above)"
        : reasonMessage;

      record.state = "down";
      record.reconnects++;
      record.lastReason = reasonMessage;

      const delayMs = computeBackoffMs(reasonMessage, record.reconnects);
      safeLog(
        `${timeNow()} [${altKey}] Disconnected: ${publicReason} | retryIn=${Math.round(delayMs / 1000)}s`
      );

      this._scheduleReconnectReal(
        altKey,
        () => this.startAltReal(altKey, altAccount),
        delayMs
      );

      globalConnectingCount = Math.max(0, globalConnectingCount - 1);
    }
  }

  _scheduleReconnectReal(altKey, fn, delayMs) {
    if (globalTimersById[altKey]) clearTimeout(globalTimersById[altKey]);
    globalTimersById[altKey] = setTimeout(fn, delayMs);
  }
}

module.exports = RealBotManager;
module.exports.RealBotManager = RealBotManager;
module.exports.default = RealBotManager;
