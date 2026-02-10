const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

let pa;
try {
  pa = require("prismarine-auth");
} catch {
  pa = null;
}

function ensureDir(p) {
  try { fs.mkdirSync(p, { recursive: true }); } catch {}
}

function readJson(fp) {
  try {
    if (!fs.existsSync(fp)) return null;
    return JSON.parse(fs.readFileSync(fp, "utf8"));
  } catch {
    return null;
  }
}

function writeJson(fp, data) {
  ensureDir(path.dirname(fp));
  fs.writeFileSync(fp, JSON.stringify(data, null, 2), "utf8");
}

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

function normalize(cfg) {
  cfg ??= {};
  cfg.auth ??= {};
  cfg.auth.profilesFolder ??= "state/auth-cache";
  return cfg;
}

function altCacheDir(cfg, altKey) {
  const dir = path.join(process.cwd(), cfg.auth.profilesFolder, String(altKey));
  ensureDir(dir);
  return dir;
}

function sessionFile(alt) {
  return path.join(process.cwd(), "state", "auth-cache", String(alt), "session.json");
}

function resetAltCache(altKey, cfg) {
  try {
    fs.rmSync(altCacheDir(cfg, altKey), { recursive: true, force: true });
  } catch {}
}

function isRefreshTokenClientMismatch(err) {
  const msg = String(err?.message || "").toLowerCase();
  if (msg.includes("invalid_grant")) return true;
  if (msg.includes("different client id")) return true;
  if (msg.includes("issued for a different client")) return true;
  return false;
}

function isForbiddenAuthFailure(err) {
  const msg = String(err?.message || "").toLowerCase();
  if (msg.includes("403")) return true;
  if (msg.includes("forbidden")) return true;
  return false;
}

async function getSession(altKey, account = {}, cfg = {}) {
  cfg = normalize(cfg);
  if (!pa?.Authflow) return null;

  const sf = sessionFile(altKey);
  const cached = readJson(sf);

  if (cached && cached.expiresAt > nowSec() + 60) {
    return cached;
  }

  const doAuth = async () => {
    const flow = new pa.Authflow(
      account.email || altKey,
      altCacheDir(cfg, altKey),
      {
        flow: "sisu",
        authTitle: pa.Titles?.MinecraftJava || "00000000402b5328",
        deviceType: "Win32"
      },
      (code) => {
        const verificationUrl = code?.verification_uri || code?.verificationUrl || code?.verification_url;
        const userCode = code?.user_code || code?.userCode;

        if (verificationUrl && userCode) {
          console.log(`[DEVICE AUTH] Open ${verificationUrl} and enter code: ${userCode}`);
          return;
        }

        if (code?.message) {
          console.log(`[DEVICE AUTH] ${code.message}`);
        }
      }
    );

    return await flow.getMinecraftJavaToken({
      fetchProfile: true,
      fetchEntitlements: true
    });
  };

  let res;
  let lastErr = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      res = await doAuth();
      lastErr = null;
      break;
    } catch (err) {
      lastErr = err;
      const msg = String(err?.message || "Unknown Microsoft auth error");
      console.error(`[msAuth] Auth failed: ${msg}`);
      if (err && typeof err === "object") err.__msAuthExactLogged = true;

      if (attempt === 1 && (isRefreshTokenClientMismatch(err) || isForbiddenAuthFailure(err))) {
        resetAltCache(altKey, cfg);
        continue;
      }

      throw err;
    }
  }

  if (lastErr) throw lastErr;

  if (!res?.token || !res?.profile?.id) {
    throw new Error("AUTH_FAILED: missing Minecraft token/profile");
  }

  const session = {
    accessToken: res.token,
    clientToken: crypto.randomUUID(),
    selectedProfile: {
      id: res.profile.id,
      name: res.profile.name
    },
    expiresAt: nowSec() + 55 * 60
  };

  writeJson(sf, session);
  return session;
}

function clearAuthCache(altKey) {
  // Intentionally a no-op: auth cache should persist unless manually removed by the operator.
  return false;
}

module.exports = { getSession, clearAuthCache };
