const { redactSecrets } = require('../src/security/redact.js');

describe('Secret redaction', () => {
  it('redacts refreshToken values', () => {
    const input = 'config: { "refreshToken":"abc123def456" }';
    const result = redactSecrets(input);
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('abc123def456');
  });

  it('redacts accessToken values', () => {
    const input = 'auth: { "accessToken":"xyz789" }';
    const result = redactSecrets(input);
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('xyz789');
  });

  it('redacts Bearer tokens', () => {
    const input = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
    const result = redactSecrets(input);
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
  });

  it('redacts Bot tokens', () => {
    const input = 'Authorization: Bot MTk4NjIyNDgzNDU4MTI4';
    const result = redactSecrets(input);
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('MTk4NjIyNDgzNDU4MTI4');
  });

  it('redacts email addresses', () => {
    const input = 'contact: admin@example.com, support@domain.org';
    const result = redactSecrets(input);
    expect(result).toContain('[EMAIL_REDACTED]');
    expect(result).not.toContain('@example.com');
    expect(result).not.toContain('@domain.org');
  });

  it('redacts password fields', () => {
    const input = 'password: "MySecurePass123"';
    const result = redactSecrets(input);
    expect(result).toContain('[REDACTED]');
    expect(result).not.toContain('MySecurePass123');
  });

  it('redacts token field with different separators', () => {
    const input1 = 'token=secret123';
    const input2 = 'token: secret456';
    const input3 = 'token "secret789"';

    const result1 = redactSecrets(input1);
    const result2 = redactSecrets(input2);
    const result3 = redactSecrets(input3);

    expect(result1).toContain('[REDACTED]');
    expect(result2).toContain('[REDACTED]');
    expect(result3).toContain('[REDACTED]');
  });

  it('handles non-string input gracefully', () => {
    const numResult = redactSecrets(123);
    expect(numResult).toBe(123);

    const nullResult = redactSecrets(null);
    expect(nullResult).toBe(null);

    const objResult = redactSecrets({ key: 'value' });
    expect(objResult).toEqual({ key: 'value' });
  });

  it('does not break normal text', () => {
    const input = 'This is a normal log line with no secrets';
    const result = redactSecrets(input);
    expect(result).toBe(input);
  });

  it('redacts multiple secrets in one string', () => {
    const input = 'token: secret123 and refreshToken: abc789 and email: test@test.com';
    const result = redactSecrets(input);
    expect(result).not.toContain('secret123');
    expect(result).not.toContain('abc789');
    expect(result).not.toContain('test@test.com');
    expect(result).toContain('[REDACTED]');
    expect(result).toContain('[EMAIL_REDACTED]');
  });
});
