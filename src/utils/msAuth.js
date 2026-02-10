"use strict";
const https = require("https");
const fs = require("fs");
const path = require("path");

function postForm(url, obj) {
  const body = new URLSearchParams(obj).toString();
  const u = new URL(url);
  const opts = { method: 'POST', hostname: u.hostname, path: u.pathname + (u.search || ''), headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) } };
  return new Promise((resolve, reject) => {
    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { const j = JSON.parse(d || '{}'); resolve({ statusCode: res.statusCode, body: j }); } catch (e) { resolve({ statusCode: res.statusCode, body: d }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function requestDeviceCode(clientId, scope) {
  const url = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/devicecode';
  const resp = await postForm(url, { client_id: clientId, scope: scope || 'offline_access openid' });
  return resp.body;
}

async function pollDeviceToken(clientId, device_code, intervalSeconds, expiresInSeconds) {
  const url = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token';
  const start = Date.now();
  const interval = Math.max(1, Math.floor(intervalSeconds || 5)) * 1000;
  const expires = (expiresInSeconds || 900) * 1000;
  while ((Date.now() - start) < expires) {
    await new Promise(r => setTimeout(r, interval));
    const resp = await postForm(url, { client_id: clientId, grant_type: 'urn:ietf:params:oauth:grant-type:device_code', device_code });
    if (resp && resp.statusCode >= 200 && resp.statusCode < 300 && resp.body && resp.body.access_token) return resp.body;
    // authorization_pending returns 400 with error
    if (resp && resp.body && resp.body.error && resp.body.error !== 'authorization_pending') return resp.body;
  }
  throw new Error('device_code expired');
}

async function refreshToken(clientId, refreshToken, scope) {
  const url = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token';
  const resp = await postForm(url, { client_id: clientId, grant_type: 'refresh_token', refresh_token: refreshToken, scope: scope || 'offline_access openid' });
  return resp.body;
}

function saveTokenDump(id, data) {
  try {
    const dir = path.join(process.cwd(), 'state', 'auth-cache');
    fs.mkdirSync(dir, { recursive: true });
    const fp = path.join(dir, `${id}_oauth.json`);
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    return fp;
  } catch (e) { return null; }
}

module.exports = { requestDeviceCode, pollDeviceToken, refreshToken, saveTokenDump };
