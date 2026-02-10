const mc = require('minecraft-protocol');
const EventEmitter = require('events');

class ProtocolClient extends EventEmitter {
  constructor(opts = {}) {
    super();
    this.host = opts.host || 'localhost';
    this.port = opts.port || 25565;
    this.username = opts.username || 'player';
    this.version = '1.8.9'; // pinned
    this.profilesFolder = opts.profilesFolder;
    this.auth = 'microsoft';
    this.client = null;
  }

  connect() {
    if (this.client) return this;
    const client = mc.createClient({
      host: this.host,
      port: this.port,
      username: this.username,
      auth: this.auth,
      version: this.version,
      profilesFolder: this.profilesFolder
    });

    this.client = client;
    this.server = this.host;

    // Forward minecraft-protocol events to this EventEmitter
    client.on('login', () => this.emit('login'));
    client.on('end', (reason) => this.emit('end', reason));
    client.on('error', (err) => this.emit('error', err));
    
    // Catch legacy auth errors and suppress them (device-code has started)
    client.on('error', (err) => {
      const msg = String(err?.message || '');
      if(msg.includes('invalid_grant') || msg.includes('400') || msg.includes('auth')) {
        // Suppress legacy refresh token errors once device-code flow starts
        try { err.__silenced = true; } catch {}
      }
    });

    client.on('packet', (data, meta) => {
      try {
        if (meta && meta.name === 'kick_disconnect') {
          const reason = data && (data.reason || data.message) || '';
          this.emit('kick_disconnect', reason);
        }
        // Capture chat messages for relay - check both 'chat' and 'chat_packet' names
        if (meta && (meta.name === 'chat' || meta.name === 'chat_packet')) {
          try {
            const message = data && (data.message || data.text);
            if (message) {
              this.emit('chat_message', message);
            }
          } catch (e) {}
        }
        // Capture entity spawn for enemy detection (looks for \"named_entity_spawn\" or \"spawn_entity\")
        if (meta && (meta.name === 'named_entity_spawn' || meta.name === 'spawn_entity' || meta.name === 'spawn_entity_v')) {
          try {
            this.emit('entity_spawn', {
              entityId: data.entityId || data.entity_id,
              x: data.x,
              y: data.y,
              z: data.z,
              name: data.name || data.player_name || ''
            });
          } catch (e) {}
        }
        // Capture player_info for staff detection signals (add, remove, gamemode, invisibility, etc)
        if (meta && meta.name === 'player_info') {
          try {
            if (data && data.data && Array.isArray(data.data)) {
              data.data.forEach(info => {
                if (info.action === 'add_player' || info.action === 0) {
                  this.emit('player_info_add', { uuid: info.uuid, name: info.name || info.gameProfile?.name });
                } else if (info.action === 'update_gamemode' || info.action === 1) {
                  this.emit('player_info_gamemode', { uuid: info.uuid, gamemode: info.gamemode });
                }
              });
            }
            // Generic player_info for any changes
            this.emit('player_info', data);
          } catch (e) {}
        }
        // Capture metadata for invisibility detection (entity_metadata packet)
        if (meta && meta.name === 'entity_metadata') {
          try {
            this.emit('entity_metadata', {
              entityId: data.entityId || data.entityid || data.entity_id,
              metadata: data.metadata || data.Metadata || []
            });
          } catch (e) {}
        }
      } catch (e) {}
    });

    return this;
  }

  sendChat(message) {
    if (!this.client) return;
    try { this.client.write('chat', { message: String(message) }); } catch (e) {}
  }

  end() {
    try { if (this.client) this.client.end(); } catch (e) {}
    this.client = null;
  }
}

module.exports = ProtocolClient;
