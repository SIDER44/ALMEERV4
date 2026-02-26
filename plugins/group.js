export default [
  { command: 'kick', groupOnly: true,
    execute: async ({ sock, msg, from }) => {
      const m = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (!m.length) return sock.sendMessage(from, { text: '❌ Mention a user to kick.' }, { quoted: msg });
      await sock.groupParticipantsUpdate(from, m, 'remove');
      await sock.sendMessage(from, { text: `👢 Kicked: ${m.map(j=>'@'+j.split('@')[0]).join(', ')}`, mentions: m }, { quoted: msg });
    }
  },
  { command: 'add', groupOnly: true,
    execute: async ({ sock, msg, from, args }) => {
      if (!args[0]) return sock.sendMessage(from, { text: '❌ .add [number]' }, { quoted: msg });
      const jid = `${args[0].replace(/\D/g,'')}@s.whatsapp.net`;
      await sock.groupParticipantsUpdate(from, [jid], 'add');
      await sock.sendMessage(from, { text: `✅ Added @${args[0]}`, mentions: [jid] }, { quoted: msg });
    }
  },
  { command: 'promote', groupOnly: true,
    execute: async ({ sock, msg, from }) => {
      const m = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (!m.length) return sock.sendMessage(from, { text: '❌ Mention a user.' }, { quoted: msg });
      await sock.groupParticipantsUpdate(from, m, 'promote');
      await sock.sendMessage(from, { text: `⬆️ Promoted: ${m.map(j=>'@'+j.split('@')[0]).join(', ')}`, mentions: m }, { quoted: msg });
    }
  },
  { command: 'demote', groupOnly: true,
    execute: async ({ sock, msg, from }) => {
      const m = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (!m.length) return sock.sendMessage(from, { text: '❌ Mention a user.' }, { quoted: msg });
      await sock.groupParticipantsUpdate(from, m, 'demote');
      await sock.sendMessage(from, { text: `⬇️ Demoted: ${m.map(j=>'@'+j.split('@')[0]).join(', ')}`, mentions: m }, { quoted: msg });
    }
  },
  { command: 'tagall', groupOnly: true,
    execute: async ({ sock, msg, from, text }) => {
      const meta = await sock.groupMetadata(from);
      const members = meta.participants.map(p => p.id);
      await sock.sendMessage(from, { text: `📢 ${text||'Attention!'}\n\n${members.map(j=>'@'+j.split('@')[0]).join(' ')}`, mentions: members }, { quoted: msg });
    }
  },
  { command: 'hidetag', groupOnly: true,
    execute: async ({ sock, msg, from, text }) => {
      const meta = await sock.groupMetadata(from);
      const members = meta.participants.map(p => p.id);
      await sock.sendMessage(from, { text: text||'📢', mentions: members }, { quoted: msg });
    }
  },
  { command: 'tagadmin', aliases: ['ta'], groupOnly: true,
    execute: async ({ sock, msg, from, text }) => {
      const meta = await sock.groupMetadata(from);
      const admins = meta.participants.filter(p=>p.admin).map(p=>p.id);
      await sock.sendMessage(from, { text: `👑 Admins\n\n${text||''}\n${admins.map(j=>'@'+j.split('@')[0]).join(' ')}`, mentions: admins }, { quoted: msg });
    }
  },
  { command: 'gclink', groupOnly: true,
    execute: async ({ sock, msg, from }) => {
      try {
        const code = await sock.groupInviteCode(from);
        await sock.sendMessage(from, { text: `🔗 https://chat.whatsapp.com/${code}` }, { quoted: msg });
      } catch { await sock.sendMessage(from, { text: '❌ Need admin rights.' }, { quoted: msg }); }
    }
  },
  { command: 'revoke', groupOnly: true,
    execute: async ({ sock, msg, from }) => {
      try {
        await sock.groupRevokeInvite(from);
        const code = await sock.groupInviteCode(from);
        await sock.sendMessage(from, { text: `🔄 New link: https://chat.whatsapp.com/${code}` }, { quoted: msg });
      } catch { await sock.sendMessage(from, { text: '❌ Need admin rights.' }, { quoted: msg }); }
    }
  },
  { command: 'group', groupOnly: true,
    execute: async ({ sock, msg, from, args }) => {
      const a = args[0]?.toLowerCase();
      if (!['open','close'].includes(a)) return sock.sendMessage(from, { text: '❌ .group open/close' }, { quoted: msg });
      await sock.groupSettingUpdate(from, a==='open'?'not_announcement':'announcement');
      await sock.sendMessage(from, { text: `${a==='open'?'🔓 Group opened':'🔒 Group closed'}` }, { quoted: msg });
    }
  },
  { command: 'setwelcome', groupOnly: true,
    execute: async ({ sock, msg, from, text, db }) => {
      if (!text) return sock.sendMessage(from, { text: '❌ .setwelcome [message]' }, { quoted: msg });
      db.setGroup(from, { welcomeMsg: text, welcome: true });
      await sock.sendMessage(from, { text: `✅ Welcome message set:\n_${text}_` }, { quoted: msg });
    }
  },
  { command: 'setbye', groupOnly: true,
    execute: async ({ sock, msg, from, text, db }) => {
      if (!text) return sock.sendMessage(from, { text: '❌ .setbye [message]' }, { quoted: msg });
      db.setGroup(from, { byeMsg: text, bye: true });
      await sock.sendMessage(from, { text: `✅ Goodbye message set:\n_${text}_` }, { quoted: msg });
    }
  },
  { command: 'rules', groupOnly: true,
    execute: async ({ sock, msg, from, text, db }) => {
      if (text) { db.setGroup(from, { rules: text }); return sock.sendMessage(from, { text: '✅ Rules updated!' }, { quoted: msg }); }
      const g = db.getGroup(from);
      await sock.sendMessage(from, { text: `📜 *Rules*\n\n${g.rules||'No rules set.'}` }, { quoted: msg });
    }
  },
  { command: 'groupinfo', aliases: ['gi'], groupOnly: true,
    execute: async ({ sock, msg, from }) => {
      const m = await sock.groupMetadata(from);
      const admins = m.participants.filter(p=>p.admin).length;
      await sock.sendMessage(from, { text: `╭━━〔 👥 Group Info 〕━━⬣\n┃ 📛 ${m.subject}\n┃ 👥 Members: ${m.participants.length}\n┃ 👑 Admins: ${admins}\n┃ 📅 ${new Date(m.creation*1000).toLocaleDateString()}\n╰━━━━━━━━━━━━━━━⬣` }, { quoted: msg });
    }
  },
  { command: 'warn', groupOnly: true,
    execute: async ({ sock, msg, from, db }) => {
      const m = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (!m.length) return sock.sendMessage(from, { text: '❌ Mention a user to warn.' }, { quoted: msg });
      const u = db.getUser(m[0]); u.warn = (u.warn||0)+1; db.setUser(m[0], u);
      await sock.sendMessage(from, { text: `⚠️ Warning *${u.warn}/3* for @${m[0].split('@')[0]}${u.warn>=3?'\n🔴 Kicking!':''}`, mentions: m }, { quoted: msg });
      if (u.warn >= 3) { await sock.groupParticipantsUpdate(from, m, 'remove'); db.setUser(m[0], {...u, warn:0}); }
    }
  },
  { command: 'resetwarn', groupOnly: true,
    execute: async ({ sock, msg, from, db }) => {
      const m = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (!m.length) return sock.sendMessage(from, { text: '❌ Mention a user.' }, { quoted: msg });
      db.setUser(m[0], { warn: 0 });
      await sock.sendMessage(from, { text: `✅ Warnings reset for @${m[0].split('@')[0]}`, mentions: m }, { quoted: msg });
    }
  },
];
