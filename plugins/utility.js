const { mainMenu, categoryMenus } = require('../lib/menu');
const { formatBytes, formatRuntime } = require('../lib/utils');
const os = require('os');
const startTime = Date.now();

export default [
  { command: 'menu',
    execute: async ({ sock, msg, from, args, db, config }) => {
      const n = parseInt(args[0]);
      const mode = db.getSetting('mode')||config.mode;
      const runtime = Math.floor((Date.now()-startTime)/1000);
      if (n && categoryMenus[n]) return sock.sendMessage(from, { text: categoryMenus[n]() }, { quoted: msg });
      await sock.sendMessage(from, { text: mainMenu(config.ownerName, mode, runtime) }, { quoted: msg });
    }
  },
  { command: 'ping',
    execute: async ({ sock, msg, from }) => {
      const start = Date.now();
      await sock.sendMessage(from, { text: '🏓 Pong!' }, { quoted: msg });
      await sock.sendMessage(from, { text: `🏓 *Pong!* ⚡ ${Date.now()-start}ms` }, { quoted: msg });
    }
  },
  { command: 'alive',
    execute: async ({ sock, msg, from, config }) => {
      const runtime = Math.floor((Date.now()-startTime)/1000);
      await sock.sendMessage(from, { text: `╭━━〔 ⚡ *${config.botName}* 〕━━⬣\n┃ ✅ ONLINE\n┃ ⏱️ ${formatRuntime(runtime)}\n┃ 💾 RAM: ${formatBytes(process.memoryUsage().heapUsed)}\n┃ 🚀 Node ${process.version}\n╰━━━━━━━━━━━━━━━⬣` }, { quoted: msg });
    }
  },
  { command: 'runtime', execute: async ({ sock, msg, from }) => {
    await sock.sendMessage(from, { text: `⏱️ *Runtime:* ${formatRuntime(Math.floor((Date.now()-startTime)/1000))}` }, { quoted: msg });
  }},
  { command: 'uptime', execute: async ({ sock, msg, from }) => {
    await sock.sendMessage(from, { text: `⏱️ *Uptime:* ${formatRuntime(Math.floor(process.uptime()))}` }, { quoted: msg });
  }},
  { command: 'owner', execute: async ({ sock, msg, from, config }) => {
    await sock.sendMessage(from, { text: `👑 *Owner*\n📛 ${config.ownerName}\n📞 +${config.ownerNumber}` }, { quoted: msg });
  }},
  { command: 'speed', execute: async ({ sock, msg, from }) => {
    const start = Date.now();
    await sock.sendMessage(from, { text: `╭━━〔 ⚡ Speed 〕━━⬣\n┃ 🏓 ${Date.now()-start}ms\n┃ 💻 ${os.cpus()[0].model.slice(0,25)}\n┃ 🧠 RAM: ${formatBytes(os.totalmem()-os.freemem())} / ${formatBytes(os.totalmem())}\n┃ 🏠 ${os.platform()}\n╰━━━━━━━━━━━━━━━⬣` }, { quoted: msg });
  }},
  { command: 'profile', execute: async ({ sock, msg, from, sender, isOwner, isPremium, db }) => {
    const u = db.getUser(sender);
    await sock.sendMessage(from, { text: `╭━━〔 👤 Profile 〕━━⬣\n┃ 📞 +${sender.replace('@s.whatsapp.net','')}\n┃ 👑 Owner: ${isOwner?'Yes':'No'}\n┃ 💎 Premium: ${isPremium?'Yes':'No'}\n┃ ⚠️ Warns: ${u.warn||0}\n╰━━━━━━━━━━━━━━━⬣` }, { quoted: msg });
  }},
  { command: 'sticker', aliases: ['s'],
    execute: async ({ sock, msg, from }) => {
      const q = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const imgMsg = msg.message?.imageMessage || q?.imageMessage;
      if (!imgMsg) return sock.sendMessage(from, { text: '❌ Send or reply to an image.' }, { quoted: msg });
      try {
        const buf = await sock.downloadMediaMessage(msg);
        await sock.sendMessage(from, { sticker: buf }, { quoted: msg });
      } catch (e) { await sock.sendMessage(from, { text: `❌ ${e.message}` }, { quoted: msg }); }
    }
  },
  { command: 'toimg', execute: async ({ sock, msg, from }) => {
    const q = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const s = msg.message?.stickerMessage || q?.stickerMessage;
    if (!s) return sock.sendMessage(from, { text: '❌ Reply to a sticker.' }, { quoted: msg });
    try {
      const buf = await sock.downloadMediaMessage({ message: { stickerMessage: s } });
      await sock.sendMessage(from, { image: buf, caption: '🖼️' }, { quoted: msg });
    } catch (e) { await sock.sendMessage(from, { text: `❌ ${e.message}` }, { quoted: msg }); }
  }},
  { command: 'tts', execute: async ({ sock, msg, from, text }) => {
    if (!text) return sock.sendMessage(from, { text: '❌ .tts [text]' }, { quoted: msg });
    try {
      const axios = require('axios');
      const res = await axios.get(`https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`, { responseType: 'arraybuffer' });
      await sock.sendMessage(from, { audio: Buffer.from(res.data), mimetype: 'audio/mp4' }, { quoted: msg });
    } catch (e) { await sock.sendMessage(from, { text: `❌ ${e.message}` }, { quoted: msg }); }
  }},
  { command: 'afk', execute: async ({ sock, msg, from, text, sender }) => {
    const db = require('../lib/database');
    db.setUser(sender, { afk: true, afkReason: text||'No reason', afkTime: Date.now() });
    await sock.sendMessage(from, { text: `😴 @${sender.split('@')[0]} is now AFK\n📝 ${text||'No reason'}`, mentions: [sender] }, { quoted: msg });
  }},
  { command: 'delete', aliases: ['del'], execute: async ({ sock, msg, from }) => {
    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    if (!ctx) return sock.sendMessage(from, { text: '❌ Reply to a message to delete it.' }, { quoted: msg });
    await sock.sendMessage(from, { delete: { id: ctx.stanzaId, remoteJid: from, fromMe: true } });
  }},
  { command: 'plugins', ownerOnly: true, execute: async ({ sock, msg, from }) => {
    const fs = require('fs');
    const files = fs.readdirSync('./plugins').filter(f=>f.endsWith('.js'));
    await sock.sendMessage(from, { text: `🔌 *Plugins (${files.length})*\n\n${files.map((f,i)=>`${i+1}. ${f}`).join('\n')}` }, { quoted: msg });
  }},
];
