const { exec } = require('child_process');

module.exports = [
  { command: 'shutdown', ownerOnly: true,
    execute: async ({ sock, msg, from }) => {
      await sock.sendMessage(from, { text: '🔴 Shutting down...' }, { quoted: msg });
      setTimeout(() => process.exit(0), 2000);
    }
  },
  { command: 'restart', ownerOnly: true,
    execute: async ({ sock, msg, from }) => {
      await sock.sendMessage(from, { text: '🔄 Restarting...' }, { quoted: msg });
      setTimeout(() => process.exit(1), 2000);
    }
  },
  { command: 'mode', ownerOnly: true,
    execute: async ({ sock, msg, from, args, db }) => {
      const m = args[0]?.toLowerCase();
      if (!['public','private'].includes(m)) return sock.sendMessage(from, { text: '❌ .mode public/private' }, { quoted: msg });
      db.setSetting('mode', m);
      await sock.sendMessage(from, { text: `✅ Mode → *${m.toUpperCase()}*` }, { quoted: msg });
    }
  },
  { command: 'block', ownerOnly: true,
    execute: async ({ sock, msg, from }) => {
      const m = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (!m.length) return sock.sendMessage(from, { text: '❌ Mention a user.' }, { quoted: msg });
      await sock.updateBlockStatus(m[0], 'block');
      await sock.sendMessage(from, { text: `🚫 Blocked @${m[0].split('@')[0]}`, mentions: m }, { quoted: msg });
    }
  },
  { command: 'unblock', ownerOnly: true,
    execute: async ({ sock, msg, from }) => {
      const m = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (!m.length) return sock.sendMessage(from, { text: '❌ Mention a user.' }, { quoted: msg });
      await sock.updateBlockStatus(m[0], 'unblock');
      await sock.sendMessage(from, { text: `✅ Unblocked @${m[0].split('@')[0]}`, mentions: m }, { quoted: msg });
    }
  },
  { command: 'setprefix', ownerOnly: true,
    execute: async ({ sock, msg, from, args, db }) => {
      if (!args[0]) return sock.sendMessage(from, { text: '❌ .setprefix [prefix]' }, { quoted: msg });
      db.setSetting('prefix', args[0]);
      await sock.sendMessage(from, { text: `✅ Prefix → *${args[0]}*` }, { quoted: msg });
    }
  },
  { command: 'setname', ownerOnly: true,
    execute: async ({ sock, msg, from, text }) => {
      if (!text) return sock.sendMessage(from, { text: '❌ .setname [name]' }, { quoted: msg });
      await sock.updateProfileName(text);
      await sock.sendMessage(from, { text: `✅ Name → *${text}*` }, { quoted: msg });
    }
  },
  { command: 'setbio', ownerOnly: true,
    execute: async ({ sock, msg, from, text }) => {
      if (!text) return sock.sendMessage(from, { text: '❌ .setbio [bio]' }, { quoted: msg });
      await sock.updateProfileStatus(text);
      await sock.sendMessage(from, { text: `✅ Bio updated!` }, { quoted: msg });
    }
  },
  { command: 'eval', ownerOnly: true,
    execute: async ({ sock, msg, from, text }) => {
      if (!text) return sock.sendMessage(from, { text: '❌ .eval [code]' }, { quoted: msg });
      try {
        let r = eval(text); // eslint-disable-line no-eval
        if (typeof r !== 'string') r = JSON.stringify(r, null, 2);
        await sock.sendMessage(from, { text: `✅\n\`\`\`${r}\`\`\`` }, { quoted: msg });
      } catch (e) { await sock.sendMessage(from, { text: `❌ ${e.message}` }, { quoted: msg }); }
    }
  },
  { command: 'exec', ownerOnly: true,
    execute: async ({ sock, msg, from, text }) => {
      if (!text) return sock.sendMessage(from, { text: '❌ .exec [command]' }, { quoted: msg });
      exec(text, async (err, stdout, stderr) => {
        await sock.sendMessage(from, { text: err ? `❌ ${stderr}` : `✅ ${stdout || '(no output)'}` }, { quoted: msg });
      });
    }
  },
  { command: 'broadcast', ownerOnly: true,
    execute: async ({ sock, msg, from, text, db }) => {
      if (!text) return sock.sendMessage(from, { text: '❌ .broadcast [message]' }, { quoted: msg });
      const groups = Object.keys(db.get('groups') || {});
      let sent = 0;
      for (const jid of groups) {
        try { await sock.sendMessage(jid, { text: `📢 *Broadcast*\n\n${text}` }); sent++; await new Promise(r => setTimeout(r, 1000)); } catch {}
      }
      await sock.sendMessage(from, { text: `✅ Sent to *${sent}* groups.` }, { quoted: msg });
    }
  },
  { command: 'clearsession', ownerOnly: true,
    execute: async ({ sock, msg, from }) => {
      const fs = require('fs-extra');
      try { fs.emptyDirSync('./sessions'); await sock.sendMessage(from, { text: '✅ Session cleared. Re-pair needed.' }, { quoted: msg }); }
      catch (e) { await sock.sendMessage(from, { text: `❌ ${e.message}` }, { quoted: msg }); }
    }
  },
  { command: 'ban', ownerOnly: true,
    execute: async ({ sock, msg, from, db }) => {
      const m = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (!m.length) return sock.sendMessage(from, { text: '❌ Mention a user.' }, { quoted: msg });
      const d = db.get(); if (!d.banned.includes(m[0])) d.banned.push(m[0]); db.set('banned', d.banned);
      await sock.sendMessage(from, { text: `🚫 Banned @${m[0].split('@')[0]}`, mentions: m }, { quoted: msg });
    }
  },
  { command: 'unban', ownerOnly: true,
    execute: async ({ sock, msg, from, db }) => {
      const m = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (!m.length) return sock.sendMessage(from, { text: '❌ Mention a user.' }, { quoted: msg });
      const d = db.get(); d.banned = d.banned.filter(j => j !== m[0]); db.set('banned', d.banned);
      await sock.sendMessage(from, { text: `✅ Unbanned @${m[0].split('@')[0]}`, mentions: m }, { quoted: msg });
    }
  },
  { command: 'addpremium', ownerOnly: true,
    execute: async ({ sock, msg, from, db }) => {
      const m = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (!m.length) return sock.sendMessage(from, { text: '❌ Mention a user.' }, { quoted: msg });
      const d = db.get(); if (!d.premium.includes(m[0])) d.premium.push(m[0]); db.set('premium', d.premium);
      await sock.sendMessage(from, { text: `💎 Added premium to @${m[0].split('@')[0]}`, mentions: m }, { quoted: msg });
    }
  },
  { command: 'delpremium', ownerOnly: true,
    execute: async ({ sock, msg, from, db }) => {
      const m = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (!m.length) return sock.sendMessage(from, { text: '❌ Mention a user.' }, { quoted: msg });
      const d = db.get(); d.premium = d.premium.filter(j => j !== m[0]); db.set('premium', d.premium);
      await sock.sendMessage(from, { text: `✅ Removed premium from @${m[0].split('@')[0]}`, mentions: m }, { quoted: msg });
    }
  },
];
