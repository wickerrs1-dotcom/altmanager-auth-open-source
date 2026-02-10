const { tokenize, parseManual } = require('../src/discord/handlers/altsParser.js');

describe('Parser - tokenize', () => {
  it('splits simple space-separated tokens', () => {
    const result = tokenize('list');
    expect(result).toEqual(['list']);
  });

  it('handles multiple tokens', () => {
    const result = tokenize('start alt1');
    expect(result).toEqual(['start', 'alt1']);
  });

  it('preserves quoted strings with spaces', () => {
    const result = tokenize('chat alt1 "hello world"');
    expect(result).toEqual(['chat', 'alt1', 'hello world']);
  });

  it('handles multiple quoted sections', () => {
    const result = tokenize('reason alt1 "kicked by admin" "need rejoin"');
    expect(result).toEqual(['reason', 'alt1', 'kicked by admin', 'need rejoin']);
  });

  it('handles empty string', () => {
    const result = tokenize('');
    expect(result).toEqual([]);
  });
});

describe('Parser - parseManual', () => {
  it('parses simple command', () => {
    const result = parseManual('list');
    expect(result.name).toBe('list');
    expect(result.args).toEqual([]);
  });

  it('parses command with arguments', () => {
    const result = parseManual('start alt1');
    expect(result.name).toBe('start');
    expect(result.args).toEqual(['alt1']);
  });

  it('parses logs with numeric argument', () => {
    const result = parseManual('logs alt1 100');
    expect(result.name).toBe('logs');
    expect(result.args).toEqual(['alt1', '100']);
  });

  it('parses quoted messages', () => {
    const result = parseManual('chat alt1 "hello world"');
    expect(result.name).toBe('chat');
    expect(result.args).toEqual(['alt1', 'hello world']);
  });

  it('allows tail command', () => {
    const result = parseManual('tail alt1 on');
    expect(result.name).toBe('tail');
    expect(result.args).toEqual(['alt1', 'on']);
  });

  it('returns error for unknown command', () => {
    const result = parseManual('unknowncommand arg');
    expect(result.error).toBeDefined();
    expect(result.error).toMatch(/unknown command/i);
  });

  it('handles empty input', () => {
    const result = parseManual('');
    expect(result.error).toBeDefined();
  });
});
