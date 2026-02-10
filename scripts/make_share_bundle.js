#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { redactSecrets } = require('../src/security/redact.js');
const { maskId } = require('../src/security/mask.js');

const ROOT = process.cwd();
const BUNDLE_DIR = path.join(ROOT, 'share_bundle');

function ensureDir(p) {
  try { fs.mkdirSync(p, { recursive: true }); } catch (e) {}
}

function readJsonSafe(fp) {
  try {
    if (!fs.existsSync(fp)) return null;
    return JSON.parse(fs.readFileSync(fp, 'utf8'));
  } catch (e) {
    return null;
  }
}

function makeShareBundle() {
  console.log('\n📦 Generating sanitized share_bundle/...\n');
  
  // Clear and recreate bundle dir
  try { fs.rmSync(BUNDLE_DIR, { recursive: true, force: true }); } catch (e) {}
  ensureDir(BUNDLE_DIR);

  // ========== A) PROJECT_SUMMARY.txt ==========
  const summaryLines = [];
  summaryLines.push('╔═══════════════════════════════════════════════════════╗');
  summaryLines.push('║         WICKED ALT MANAGER - PROJECT SUMMARY          ║');
  summaryLines.push('╚═══════════════════════════════════════════════════════╝');
  summaryLines.push('');

  // Node/npm versions
  try {
    const nodeV = execSync('node -v', { encoding: 'utf8' }).trim();
    const npmV = execSync('npm -v', { encoding: 'utf8' }).trim();
    summaryLines.push(`Node: ${nodeV}`);
    summaryLines.push(`NPM: ${npmV}`);
  } catch (e) {}

  summaryLines.push('');

  // package.json info
  try {
    const pjson = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    summaryLines.push(`Project: ${pjson.name}`);
    summaryLines.push(`Version: ${pjson.version}`);
    summaryLines.push(`Author: ${pjson.author || '(unknown)'}`);
    summaryLines.push('');
    summaryLines.push('Scripts:');
    for (const [k, v] of Object.entries(pjson.scripts || {})) {
      summaryLines.push(`  ${k}: ${v}`);
    }
  } catch (e) {
    summaryLines.push('(Could not read package.json)');
  }

  summaryLines.push('');
  summaryLines.push('Key File Checks:');

  const checks = [
    ['src/discord/commands/alts.command.js', 'Command definition'],
    ['tools/deployCommands.js', 'Deploy script'],
    ['src/auth/msAuth.js', 'MS auth caching'],
    ['src/security/redact.js', 'Secret redaction'],
    ['run.bat', 'Run script']
  ];

  for (const [file, desc] of checks) {
    const exists = fs.existsSync(path.join(ROOT, file)) ? '✓' : '✗';
    summaryLines.push(`  ${exists} ${file} (${desc})`);
  }

  fs.writeFileSync(path.join(BUNDLE_DIR, 'PROJECT_SUMMARY.txt'), summaryLines.join('\n'), 'utf8');

  // ========== B) COMMANDS_DUMP.txt ==========
  let commandsContent = 'Discord /alts Command Definition\n================================\n\n';
  try {
    const cmd = require('../src/discord/commands/alts.command.js');
    const json = cmd.data.toJSON();
    commandsContent += JSON.stringify(json, null, 2);
    commandsContent += '\n\nVERIFICATION:\n';
    commandsContent += `- Command name: ${json.name}\n`;
    commandsContent += `- Number of options: ${json.options.length}\n`;
    commandsContent += `- Option names: ${json.options.map(o => o.name).join(', ')}\n`;
    commandsContent += `- Zero-prefill: ${json.options.length === 1 && (json.options[0].choices?.length ?? 0) === 0 ? 'YES ✓' : 'NO ✗'}\n`;
  } catch (e) {
    commandsContent += `Error reading command: ${String(e)}\n`;
  }
  fs.writeFileSync(path.join(BUNDLE_DIR, 'COMMANDS_DUMP.txt'), commandsContent, 'utf8');

  // ========== C) LAST_LOGS.txt ==========
  let logsContent = '(No logs available)\n';
  const auditLogPath = path.join(ROOT, 'logs', 'audit.log');
  if (fs.existsSync(auditLogPath)) {
    try {
      const fullLog = fs.readFileSync(auditLogPath, 'utf8');
      const lines = fullLog.split('\n').filter(x => x.trim());
      const last200 = lines.slice(-200).join('\n');
      logsContent = redactSecrets(last200);
    } catch (e) {
      logsContent = '(Could not read audit.log)\n';
    }
  }
  fs.writeFileSync(path.join(BUNDLE_DIR, 'LAST_LOGS.txt'), logsContent, 'utf8');

  // ========== D) CONFIG_REDACTED.json ==========
  let configContent = '{}';
  const configPath = path.join(ROOT, 'config.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = readJsonSafe(configPath);
      const redacted = JSON.parse(JSON.stringify(config)); // deep copy
      if (redacted.discord) {
        if (redacted.discord.token) redacted.discord.token = '[REDACTED]';
        if (redacted.discord.clientId) redacted.discord.clientId = maskId(redacted.discord.clientId);
        if (redacted.discord.guildId) redacted.discord.guildId = maskId(redacted.discord.guildId);
        if (redacted.discord.channelId) redacted.discord.channelId = maskId(redacted.discord.channelId);
        if (redacted.discord.startupChannelId) redacted.discord.startupChannelId = maskId(redacted.discord.startupChannelId);
        if (redacted.discord.relay && redacted.discord.relay.channelId) {
          redacted.discord.relay.channelId = maskId(redacted.discord.relay.channelId);
        }
        if (redacted.discord.panel && redacted.discord.panel.channelId) {
          redacted.discord.panel.channelId = maskId(redacted.discord.panel.channelId);
        }
      }
      if (redacted.alerts && redacted.alerts.alertsChannelId) {
        redacted.alerts.alertsChannelId = maskId(redacted.alerts.alertsChannelId);
      }
      if (redacted.tail && redacted.tail.channelId) {
        redacted.tail.channelId = maskId(redacted.tail.channelId);
      }
      configContent = JSON.stringify(redacted, null, 2);
    } catch (e) {
      configContent = '(Error reading config.json)\n';
    }
  }
  fs.writeFileSync(path.join(BUNDLE_DIR, 'CONFIG_REDACTED.json'), configContent, 'utf8');

  // ========== E) ACCOUNTS_REDACTED.json ==========
  let accountsContent = '[]';
  const accountsPath = path.join(ROOT, 'accounts.json');
  if (fs.existsSync(accountsPath)) {
    try {
      const accounts = readJsonSafe(accountsPath);
      const redacted = [];
      for (const alt of (accounts || [])) {
        redacted.push({
          key: alt.altKey || alt.id || '(unknown)',
          type: alt.authMode || 'microsoft',
          enabled: alt.enabled !== false
        });
      }
      accountsContent = JSON.stringify(redacted, null, 2);
    } catch (e) {
      accountsContent = '[]';
    }
  }
  fs.writeFileSync(path.join(BUNDLE_DIR, 'ACCOUNTS_REDACTED.json'), accountsContent, 'utf8');

  // ========== F) WHAT_TO_SEND.txt ==========
  const whatToSend = `╔═══════════════════════════════════════════════════════╗
║         WHAT TO PASTE/UPLOAD TO CHATGPT              ║
╚═══════════════════════════════════════════════════════╝

✅ RUN THESE COMMANDS (you just did):
npm test
npm run share

📋 NOW PASTE/UPLOAD THESE 3 FILES:
1) share_bundle/PROJECT_SUMMARY.txt
2) share_bundle/COMMANDS_DUMP.txt
3) share_bundle/LAST_LOGS.txt

All secrets are automatically redacted!

---

💡 OPTIONAL (also safe to send):
- share_bundle/CONFIG_REDACTED.json (masked IDs)
- share_bundle/ACCOUNTS_REDACTED.json (no passwords/tokens)
- Your exact command that failed
- What you expected vs got

---

🚫 NEVER SEND:
- .env file
- accounts.json (unredacted)
- refreshToken / accessToken values
- Discord bot token
- Microsoft passwords
`;
  fs.writeFileSync(path.join(BUNDLE_DIR, 'WHAT_TO_SEND.txt'), whatToSend, 'utf8');

  console.log('✅ Share bundle created at: share_bundle/\n');
  console.log('📋 FILES CREATED:');
  console.log('   - PROJECT_SUMMARY.txt');
  console.log('   - COMMANDS_DUMP.txt');
  console.log('   - LAST_LOGS.txt');
  console.log('   - CONFIG_REDACTED.json');
  console.log('   - ACCOUNTS_REDACTED.json');
  console.log('   - WHAT_TO_SEND.txt');
  console.log('\n💡 NEXT STEP:\n   Paste/upload these 3 files:');
  console.log('   - PROJECT_SUMMARY.txt');
  console.log('   - COMMANDS_DUMP.txt');
  console.log('   - LAST_LOGS.txt\n');
}

makeShareBundle();
