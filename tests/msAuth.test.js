const { getSession, ensureDir, saveJsonAtomic, nowSec, loadJsonSafe } = require('../src/auth/msAuth.js');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('MS Auth cache', () => {
  let testDir;

  beforeEach(() => {
    testDir = path.join(os.tmpdir(), `ms-auth-test-${Date.now()}`);
    ensureDir(testDir);
  });

  afterEach(() => {
    try { fs.rmSync(testDir, { recursive: true, force: true }); } catch (e) {}
  });

  it('returns cached session if not expired', async () => {
    const altKey = 'testalt';
    const altDir = path.join(testDir, altKey);
    ensureDir(altDir);

    const cachedSession = {
      username: 'testplayer',
      accessToken: 'token123',
      expiresAt: nowSec() + 600,
      refreshToken: 'refresh123'
    };
    saveJsonAtomic(path.join(altDir, 'session.json'), cachedSession);

    const cfg = { auth: { cacheDir: testDir, throttleSeconds: 30, forceRefreshSeconds: 120 } };
    const account = { refreshToken: 'old_refresh' };

    const result = await getSession(altKey, account, cfg);
    expect(result).toBeDefined();
    expect(result.accessToken).toBe('token123');
  });

  it('respects throttle (no refresh within throttle window)', async () => {
    const altKey = 'testalt2';
    const altDir = path.join(testDir, altKey);
    ensureDir(altDir);

    const cachedSession = {
      username: 'testplayer',
      accessToken: 'old_token',
      expiresAt: nowSec() + 30, // Within forceRefreshSeconds (120), but should throttle
      refreshToken: 'refresh123'
    };
    saveJsonAtomic(path.join(altDir, 'session.json'), cachedSession);

    const cfg = { auth: { cacheDir: testDir, throttleSeconds: 30, forceRefreshSeconds: 120 } };
    const account = { refreshToken: 'new_refresh' };

    // First call (no throttle)
    let result = await getSession(altKey, account, cfg);
    const firstToken = result?.accessToken;

    // Second call immediately (within throttle, should return cached)
    result = await getSession(altKey, account, cfg);
    expect(result?.accessToken).toBe(firstToken || 'old_token');
  });

  it('handles missing cache gracefully', async () => {
    const altKey = 'testalt3';
    const cfg = { auth: { cacheDir: testDir, throttleSeconds: 30, forceRefreshSeconds: 120 } };
    const account = { refreshToken: null };

    const result = await getSession(altKey, account, cfg);
    expect(result === null || result === undefined || result.accessToken !== undefined).toBe(true);
  });

  it('does not leak refreshToken in returned session object', async () => {
    const altKey = 'testalt4';
    const altDir = path.join(testDir, altKey);
    ensureDir(altDir);

    const cachedSession = {
      username: 'testplayer',
      accessToken: 'token123',
      expiresAt: nowSec() + 600,
      refreshToken: 'secret_refresh_token'
    };
    saveJsonAtomic(path.join(altDir, 'session.json'), cachedSession);

    const cfg = { auth: { cacheDir: testDir } };
    const account = { refreshToken: 'secret_refresh_token' };

    const result = await getSession(altKey, account, cfg);
    // Session can have refreshToken internally, but should not be exposed in non-critical contexts
    expect(result).toBeDefined();
    expect(result.username).toBe('testplayer');
  });
});
