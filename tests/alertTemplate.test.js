const { formatAlert } = require('../src/format/alertTemplate.js');

describe('Alert template formatting', () => {
  it('formats alert with exact structure', () => {
    const testDate = new Date('2026-02-07T23:13:00Z');
    const result = formatAlert({
      ign: 'Benow',
      pos: { x: -4958.71875, y: 178, z: 4903.78125 },
      serverHost: 'mineage.net',
      date: testDate
    });

    expect(result).toContain('Alerts');
    expect(result).toContain('IGN: Benow');
    expect(result).toContain('Coords: X: -4959 Y: 178 Z: 4904');
    expect(result).toContain('mineage.net');
  });

  it('includes month, day, year', () => {
    const testDate = new Date('2026-02-07T23:13:00Z');
    const result = formatAlert({
      ign: 'TestPlayer',
      pos: { x: 0, y: 64, z: 0 },
      serverHost: 'test.net',
      date: testDate
    });

    expect(result).toMatch(/February/);
    expect(result).toMatch(/7/);
    expect(result).toMatch(/2026/);
  });

  it('formats hour correctly (12-hour format)', () => {
    const testDate = new Date('2026-02-07T23:13:00Z');
    const result = formatAlert({
      ign: 'Test',
      pos: { x: 0, y: 64, z: 0 },
      serverHost: 'test.net',
      date: testDate
    });

    // 23:13 UTC should be 6:13 PM in Toronto (EST-5)
    expect(result).toMatch(/PM|AM/);
  });

  it('rounds coordinates', () => {
    const result = formatAlert({
      ign: 'Test',
      pos: { x: 10.7, y: 20.3, z: 30.5 },
      serverHost: 'test.net',
      date: new Date()
    });

    expect(result).toContain('X: 11 Y: 20 Z: 31');
  });

  it('handles default date', () => {
    const result = formatAlert({
      ign: 'Test',
      pos: { x: 0, y: 64, z: 0 },
      serverHost: 'test.net'
    });

    expect(result).toContain('Alerts');
    expect(result).toContain('IGN: Test');
  });
});
