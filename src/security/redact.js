function redactSecrets(text) {
  if (typeof text !== 'string') return text;
  
  let out = text;
  
  // Redact Discord tokens (Bearer/Bot prefix)
  out = out.replace(/Bearer\s+[^\s]+/gi, 'Bearer [REDACTED]');
  out = out.replace(/Bot\s+[^\s]+/gi, 'Bot [REDACTED]');
  
  // Redact token values in config dumps (key:token, key="token", key: token, key=token)
  out = out.replace(/token[:\s='"]+([^\s'"}\]]+)/gi, 'token: [REDACTED]');
  out = out.replace(/refreshToken[:\s='"]+([^\s'"}\]]+)/gi, 'refreshToken: [REDACTED]');
  out = out.replace(/accessToken[:\s='"]+([^\s'"}\]]+)/gi, 'accessToken: [REDACTED]');
  out = out.replace(/password[:\s='"]+([^\s'"}\]]+)/gi, 'password: [REDACTED]');
  
  // Redact email patterns
  out = out.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL_REDACTED]');
  
  // Redact session/cache file paths with sensitive data
  out = out.replace(/auth-cache\/[\w]+_\w+-cache\.json/g, 'auth-cache/[REDACTED]');
  
  return out;
}

module.exports = { redactSecrets };
