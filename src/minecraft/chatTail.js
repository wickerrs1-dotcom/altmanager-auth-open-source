const { ChannelType } = require('discord.js');

const tailStates = new Map();

async function attachChatTail(bot, ctx, client) {
  const { altKey, config } = ctx;
  
  if (!config.tail || !config.tail.enabled) return null;
  if (config.tail.altKey !== altKey) return null;
  
  const tailChannelId = config.tail.channelId;
  if (!tailChannelId) return null;
  
  try {
    const channel = client.channels.cache.get(tailChannelId);
    if (!channel || channel.type !== ChannelType.GuildText) return null;
    
    const state = {
      buffer: [],
      lastFlush: Date.now(),
      maxLines: config.tail.maxLinesPerMinute || 10,
      flushInterval: null
    };
    
    const onChat = (username, message) => {
      const line = `[${new Date().toLocaleTimeString()}] ${username}: ${message}`;
      state.buffer.push(line);
      console.log(`[tail] ${altKey}: ${line}`);
      
      if (state.buffer.length >= state.maxLines || Date.now() - state.lastFlush > 5000) {
        flushTail(channel, state, altKey);
      }
    };
    
    bot.on('chat', onChat);
    
    state.flushInterval = setInterval(() => {
      if (state.buffer.length > 0) {
        flushTail(channel, state, altKey);
      }
    }, 5000);
    
    const cleanup = () => {
      bot.off('chat', onChat);
      if (state.flushInterval) clearInterval(state.flushInterval);
      if (state.buffer.length > 0) {
        flushTail(channel, state, altKey).catch(() => {});
      }
    };
    
    return cleanup;
  } catch (e) {
    return null;
  }
}

function flushTail(channel, state, altKey) {
  if (state.buffer.length === 0) return Promise.resolve();
  
  const lines = state.buffer.splice(0, state.maxLines);
  const msg = `\`\`\`\n${lines.join('\n')}\n\`\`\``;
  
  state.lastFlush = Date.now();
  
  return channel.send(msg).catch(() => {});
}

async function handleTailCommand(alt, action, id) {
  if (action === 'on') {
    return `Tail enabled for ${alt} ✅`;
  } else if (action === 'off') {
    return `Tail disabled for ${alt} ✅`;
  } else if (action === 'channel' && id) {
    return `Tail channel set to ${id} ✅`;
  } else {
    return `tail [on/off/channel <id>]`;
  }
}

module.exports = { attachChatTail, handleTailCommand };
