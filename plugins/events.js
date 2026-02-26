const chalk = require('chalk');
const msgCache = new Map();
const statusCache = new Map();

const registerEvents = (sock, db) => {

  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      const from = msg.key.remoteJid;

      if (msg.message) {
        msgCache.set(msg.key.id, { msg, from });
        if (msgCache.size > 500) msgCache.delete(msgCache.keys().next().value);
      }

      if (from === 'status@broadcast') {
        if (db.getSetting('antiDeleteStatus')) statusCache.set(msg.key.id, msg);

        if (db.getSetting('autoViewStatus')) {
          try { await sock.readMessages([msg.key]); console.log(chalk.blue('[AUTO VIEW STATUS]')); } catch {}
        }
        if (db.getSetting('autoReactStatus')) {
          try {
            const emoji = db.getSetting('reactEmoji') || '❤️';
            await sock.sendMessage(from, { react: { text: emoji, key: msg.key } });
            console.log(chalk.blue(`[AUTO REACT] ${emoji}`));
          } catch {}
        }
      }

      if (db.getSetting('antiViewOnce') && msg.message) {
        for (const type of ['imageMessage','videoMessage','audioMessage']) {
          if (msg.message[type]?.viewOnce) {
            try {
              const ownerJid = `${require('../config').ownerNumber}@s.whatsapp.net`;
              const buffer = await sock.downloadMediaMessage(msg);
              await sock.sendMessage(ownerJid, {
                [type === 'imageMessage' ? 'image' : type === 'videoMessage' ? 'video' : 'audio']: buffer,
                caption: `👁️ *Anti ViewOnce*\nFrom: @${msg.key.participant?.split('@')[0] || from.split('@')[0]}`,
              });
            } catch {}
            break;
          }
        }
      }
    }
  });

  sock.ev.on('messages.update', async updates => {
    for (const update of updates) {
      if (update.update?.messageStubType !== 68) continue;
      const from = update.key.remoteJid;
      const isGroup = from.endsWith('@g.us');
      const isStatus = from === 'status@broadcast';

      if (isStatus && db.getSetting('antiDeleteStatus')) {
        try {
          const ownerJid = `${require('../config').ownerNumber}@s.whatsapp.net`;
          const cached = statusCache.get(update.key.id);
          await sock.sendMessage(ownerJid, { text: '🗑️ *Anti Delete Status:* A status was deleted!' });
          if (cached) await sock.sendMessage(ownerJid, { forward: cached, force: true });
        } catch {}
        continue;
      }

      if (!isGroup && db.getSetting('antiDelete')) {
        const cached = msgCache.get(update.key.id);
        if (cached) {
          try {
            await sock.sendMessage(from, { forward: cached.msg, force: true });
            await sock.sendMessage(from, { text: '🗑️ *Anti Delete:* Message recovered!' });
          } catch {}
        }
        continue;
      }

      if (isGroup) {
        const groupData = db.getGroup(from);
        if (groupData?.antiDelete) {
          const cached = msgCache.get(update.key.id);
          if (cached) {
            try {
              await sock.sendMessage(from, { forward: cached.msg, force: true });
              await sock.sendMessage(from, {
                text: `🗑️ @${update.key.participant?.split('@')[0]} deleted a message!`,
                mentions: [update.key.participant],
              });
            } catch {}
          }
        }
      }
    }
  });

  sock.ev.on('call', async calls => {
    for (const call of calls) {
      if (call.status === 'offer' && db.getSetting('antiCall') !== false) {
        try {
          await sock.rejectCall(call.id, call.from);
          await sock.sendMessage(call.from, { text: '❌ Calls not supported. Please text instead.' });
        } catch {}
      }
    }
  });

  setInterval(async () => {
    if (db.getSetting('autoOnline')) {
      try { await sock.sendPresenceUpdate('available'); } catch {}
    }
  }, 30000);

  console.log(chalk.green('[EVENTS] Background events registered ✅'));
};

module.exports = { registerEvents };
