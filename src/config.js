const fs = require('fs');
const path = require('path');

function warn(...args){ try{ console.warn(...args); }catch{} }

function loadConfig(root){
  const cfgPath = path.join(root, 'config.json');
  const accountsPath = path.join(root, 'accounts.json');
  
  // LOAD CONFIG.JSON (required)
  if(!fs.existsSync(cfgPath)){
    throw new Error('config.json not found in project root. Please create it with your settings.');
  }
  const config = JSON.parse(fs.readFileSync(cfgPath,'utf8'));

  // VALIDATE: no FILL_ placeholders left in config
  const validateNoPlaceholders = (obj, path = '') => {
    if(typeof obj === 'string' && obj.startsWith('FILL_')){
      throw new Error(`Config validation failed at ${path || 'root'}: "${obj}" must be filled in before use`);
    }
    if(typeof obj === 'object' && obj !== null){
      for(const [k, v] of Object.entries(obj)){
        validateNoPlaceholders(v, path ? `${path}.${k}` : k);
      }
    }
  };
  validateNoPlaceholders(config, 'config');

  // LOAD ACCOUNTS.JSON (required)
  if(!fs.existsSync(accountsPath)){
    throw new Error('accounts.json not found in project root. Please create it with your alt accounts.');
  }
  const accountsRaw = JSON.parse(fs.readFileSync(accountsPath,'utf8'));

  // Normalize accounts to { defaults: {...}, alts: [...] } (keep as array for simplicity)
  const accounts = { defaults: { auth: 'microsoft', server: 'A', enabled: true, join: [] }, alts: [] };
  if(accountsRaw && typeof accountsRaw === 'object'){
    if(accountsRaw.defaults && typeof accountsRaw.defaults === 'object') accounts.defaults = accountsRaw.defaults;
    let arr = Array.isArray(accountsRaw.alts) ? accountsRaw.alts : (Array.isArray(accountsRaw) ? accountsRaw : []);
    
    // AUTO-MIGRATE old schema: username->email, serverId->server, joinCommands->join
    arr = arr.map(a => {
      if(!a || typeof a !== 'object') return a;
      const migrated = { ...a };
      if(!migrated.email && migrated.username) migrated.email = migrated.username;
      delete migrated.username;
      if(!migrated.server && migrated.serverId){
        const srv = String(migrated.serverId || '').replace('server', '').toUpperCase();
        migrated.server = ['A','B'].includes(srv) ? srv : 'A';
      }
      delete migrated.serverId;
      if(!migrated.join && migrated.joinCommands) migrated.join = migrated.joinCommands;
      delete migrated.joinCommands;
      return migrated;
    });
    
    accounts.alts = arr;
  }

  // VALIDATE: minecraft.version must be 1.8.9
  if(config.minecraft?.version !== '1.8.9'){
    warn(`Config: minecraft.version must be exactly "1.8.9"; ignoring and enforcing 1.8.9`);
    if(!config.minecraft) config.minecraft = {};
    config.minecraft.version = '1.8.9';
  }

  // Validate limits
  const limits = config.limits || {};
  if(limits.maxAltsTotal && limits.maxAltsTotal > 20){ warn('limits.maxAltsTotal capped at 20'); limits.maxAltsTotal = 20; }
  if(!limits.maxAltsTotal) limits.maxAltsTotal = 20;
  if(!limits.maxAltsPerServer) limits.maxAltsPerServer = 10;
  if(!limits.maxConcurrentConnecting) limits.maxConcurrentConnecting = 2;
  config.limits = limits;

  // Normalize alts
  if(accounts.alts.length > limits.maxAltsTotal){ warn(`Accounts has ${accounts.alts.length} alts; trimming to ${limits.maxAltsTotal}`); }
  const normalized = [];
  for(const a of accounts.alts.slice(0, limits.maxAltsTotal)){
    if(!a || !a.id) continue;
    if(!/^alt\d+$/.test(a.id)) warn(`alt id ${a.id} does not match altN format`);
    const server = (a.server || accounts.defaults.server || 'A');
    if(!['A','B'].includes(server)) warn(`alt ${a.id} server must be 'A' or 'B'`);
    const email = (a.email || '').trim();
    const enabled = !!a.enabled && !!email;
    if(a.enabled && !email) warn(`alt ${a.id} enabled but email empty; treating as disabled`);
    const join = Array.isArray(a.join) && a.join.length > 0 ? a.join : 
                 (Array.isArray(accounts.defaults.join) && accounts.defaults.join.length > 0 ? accounts.defaults.join : []);
    normalized.push({
      id: a.id,
      email: email,
      enabled: enabled,
      server: ['A','B'].includes(server) ? server : 'A',
      join: join,
      auth: a.auth || accounts.defaults.auth || 'microsoft'
    });
  }
  accounts.alts = normalized;

  return { config, accounts };
}

module.exports = { loadConfig };

