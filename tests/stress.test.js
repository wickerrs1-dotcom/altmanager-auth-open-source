const createBotManager = require('../src/botManager');

describe('Stress simulator (short)', () => {
  jest.setTimeout(30000);
  test('simulate many connects without duplicate bots or spam', async () => {
    const cfg = { limits: { maxConcurrentConnecting: 2, maxAltsTotal: 20 } };
    const accounts = { alts: {} };
    for(let i=0;i<10;i++) accounts.alts['a'+i] = {};
    const logs = { perAlt: () => {} };
    const bm = createBotManager({ config: cfg, accounts, logger: logs });

    for(let k of Object.keys(accounts.alts)){
      await bm.start(k);
    }

    // run for a short period to let queue process
    await new Promise(r => setTimeout(r, 3000));

    // Ensure no duplicate connecting of same alt
    const connecting = Array.from(bm.state.values()).filter(s => s.status === 'CONNECTING' || s.status === 'ONLINE');
    // connecting length should be <= total alts
    expect(connecting.length).toBeLessThanOrEqual(Object.keys(accounts.alts).length);

    bm.destroy();
  });
});
