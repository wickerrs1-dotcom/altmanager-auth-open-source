const dotenv = require('dotenv');
const { redactSecrets } = require('./security/redact');
const { maskId } = require('./security/mask');

function init() {
  const oldLog = console.log;
  const oldWarn = console.warn;
  console.log = () => {};
  console.warn = () => {};
  dotenv.config({ debug: false });
  console.log = oldLog;
  console.warn = oldWarn;
}

function safeLog(s) {
  console.log(redactSecrets(String(s || '')));
}

module.exports = { init, safeLog, redactSecrets, maskId };
