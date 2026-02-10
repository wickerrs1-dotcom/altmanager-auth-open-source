const createBotManager = require('../src/botManager');

describe('BotManager basic limits', () => {
  jest.setTimeout(10000);
  test('does not exceed maxConcurrentConnecting', async () => {
    const cfg = { limits: { maxConcurrentConnecting: 2 } };
    const accounts = { alts: { a: {}, b: {}, c: {}, d: {} } };
    const logs = { perAlt: () => {} };
    const bm = createBotManager({ config: cfg, accounts, logger: logs });

    await bm.start('a');
    await bm.start('b');
    await bm.start('c');
    await bm.start('d');

    // give some time for queue processing and simulated connects
    await new Promise(r => setTimeout(r, 1500));

    // connectingCount should never exceed 2 at runtime
    expect(bm.maxConcurrentConnecting).toBe(2);
    expect(bm.connectingCount).toBeLessThanOrEqual(2);

    bm.destroy();
  });

  test('backoff triggered on duplicate_login (simulated)', async () => {
    const cfg = { limits: { maxConcurrentConnecting: 2 } };
    const accounts = { alts: { x: {} } };
    const logs = { perAlt: () => {} };
    const bm = createBotManager({ config: cfg, accounts, logger: logs });

    // manually set a backoff scenario
    const alt = 'x';
    bm.state.set(alt, { status: 'IDLE', backoffUntil: Date.now() + 1000, retries: 0 });
    const res = await bm.start(alt);
    expect(res).toBe('in backoff');

    bm.destroy();
  });
});
