const dotenv = require('dotenv');
const { redactSecrets } = require('./security/redact');
const { maskId } = require('./security/mask');

function init() {
  dotenv.config();
}

function safeLog(s) {
  console.log(redactSecrets(String(s || '')));
}

module.exports = { init, safeLog, redactSecrets, maskId };
