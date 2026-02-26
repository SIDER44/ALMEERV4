import config from '../config.js';

const toggle = async ({ sock, msg, from, args, db, key, label, scope = 'global' }) => {
  const state = args[0]?.toLowerCase();
  if (!['on', 'off'].includes(state)) {
    const cur = scope === 'group' ? db.getGroup(from)[key] : db.getSetting(key);
    return sock.sendMessage(from, {
      text: `⚙️ *${label}*\nStatus: *${cur ? 'ON ✅' : 'OFF ❌'}*\n\nUsage: *${config.prefix}${key} on/off*`
    }, { quoted: msg });
  }
  const value = state === 'on';
  scope === 'group' ? db.setGroup(from, { [key]: value }) : db.setSetting(key, value);
  await sock.sendMessage(from, { text: `${value ? '✅' : '❌'} *${label}* → *${state.toUpperCase()}*` }, { quoted: msg });
};

export default [
  { command: 'autoviewstatus', aliases: ['avs'], ownerOnly: true,
    execute: ctx => toggle({ ...ctx, key: 'autoViewStatus', label: 'Auto View Status' }) },

  { command: 'autoreactstatus', aliases: ['ars'], ownerOnly: true,
    execute: async ({ sock, msg, from, args, db }) => {
      if (['on','off'].includes(args[0])) {
        db.setSetting('autoReactStatus', args[0] === 'on');
        return sock.sendMessage(from, { text: `${args[0]==='on'?'✅':'❌'} Auto React Status → *${args[0].toUpperCase()}*` }, { quoted: msg });
      }
      if (args[0]) {
        db.setSetting('reactEmoji', args[0]);
        return sock.sendMessage(from, { text: `✅ React emoji → ${args[0]}` }, { quoted: msg });
      }
      const cur = db.getSetting('autoReactStatus');
      await sock.sendMessage(from, { text: `⚙️ *Auto React Status*\nStatus: ${cur?'ON ✅':'OFF ❌'}\nEmoji: ${db.getSetting('reactEmoji')||'❤️'}\n\n*.autoreactstatus on/off*\n*.autoreactstatus 🔥* (set emoji)` }, { quoted: msg });
    }
  },

  { command: 'autotyping', ownerOnly: true,
    execute: ctx => toggle({ ...ctx, key: 'autoTyping', label: 'Auto Typing' }) },
  { command: 'autorecording', ownerOnly: true,
    execute: ctx => toggle({ ...ctx, key: 'autoRecording', label: 'Auto Recording' }) },
  { command: 'autoread', ownerOnly: true,
    execute: ctx => toggle({ ...ctx, key: 'autoRead', label: 'Auto Read' }) },
  { command: 'autoonline', ownerOnly: true,
    execute: ctx => toggle({ ...ctx, key: 'autoOnline', label: 'Always Online' }) },

  { command: 'autoreply', ownerOnly: true,
    execute: async ({ sock, msg, from, args, db }) => {
      if (['on','off'].includes(args[0])) {
        db.setSetting('autoReply', args[0] === 'on');
        return sock.sendMessage(from, { text: `${args[0]==='on'?'✅':'❌'} Auto Reply → *${args[0].toUpperCase()}*` }, { quoted: msg });
      }
      if (args.length) {
        db.setSetting('autoReplyMsg', args.join(' '));
        return sock.sendMessage(from, { text: `✅ Auto reply message updated!` }, { quoted: msg });
      }
      await sock.sendMessage(from, { text: `⚙️ Auto Reply: ${db.getSetting('autoReply')?'ON ✅':'OFF ❌'}\nMsg: _${db.getSetting('autoReplyMsg')||'Bot is busy!'}_` }, { quoted: msg });
    }
  },

  { command: 'antidelete', ownerOnly: true,
    execute: ctx => toggle({ ...ctx, key: 'antiDelete', label: 'Anti Delete (Private)' }) },
  { command: 'antideletestatus', aliases: ['ads'], ownerOnly: true,
    execute: ctx => toggle({ ...ctx, key: 'antiDeleteStatus', label: 'Anti Delete Status' }) },
  { command: 'antideletegroup', aliases: ['adg'], groupOnly: true,
    execute: ctx => toggle({ ...ctx, key: 'antiDelete', label: 'Anti Delete (Group)', scope: 'group' }) },
  { command: 'anticall', ownerOnly: true,
    execute: ctx => toggle({ ...ctx, key: 'antiCall', label: 'Anti Call' }) },
  { command: 'antiviewonce', aliases: ['avo'], ownerOnly: true,
    execute: ctx => toggle({ ...ctx, key: 'antiViewOnce', label: 'Anti View Once' }) },
  { command: 'antilink', groupOnly: true,
    execute: ctx => toggle({ ...ctx, key: 'antilink', label: 'Anti Link', scope: 'group' }) },
  { command: 'antispam', groupOnly: true,
    execute: ctx => toggle({ ...ctx, key: 'antispam', label: 'Anti Spam', scope: 'group' }) },
  { command: 'antibadword', groupOnly: true,
    execute: ctx => toggle({ ...ctx, key: 'antibadword', label: 'Anti Bad Word', scope: 'group' }) },
  { command: 'antiraid', groupOnly: true,
    execute: ctx => toggle({ ...ctx, key: 'antiRaid', label: 'Anti Raid', scope: 'group' }) },
  { command: 'welcome', groupOnly: true,
    execute: ctx => toggle({ ...ctx, key: 'welcome', label: 'Welcome Messages', scope: 'group' }) },
  { command: 'goodbye', aliases: ['bye'], groupOnly: true,
    execute: ctx => toggle({ ...ctx, key: 'bye', label: 'Goodbye Messages', scope: 'group' }) },

  { command: 'settings', aliases: ['config'], ownerOnly: true,
    execute: async ({ sock, msg, from, db }) => {
      const s = db.get('settings');
      const f = v => v ? '✅ ON' : '❌ OFF';
      await sock.sendMessage(from, { text: `╭━━〔 ⚙️ *ALL SETTINGS* 〕━━⬣
┃
┃ 🔄 AUTO FEATURES
┃ View Status  : ${f(s.autoViewStatus)}
┃ React Status : ${f(s.autoReactStatus)} [${s.reactEmoji||'❤️'}]
┃ Typing       : ${f(s.autoTyping)}
┃ Recording    : ${f(s.autoRecording)}
┃ Auto Read    : ${f(s.autoRead)}
┃ Always Online: ${f(s.autoOnline)}
┃ Auto Reply   : ${f(s.autoReply)}
┃
┃ 🛡️ ANTI FEATURES
┃ Anti Delete  : ${f(s.antiDelete)}
┃ Anti Del Sts : ${f(s.antiDeleteStatus)}
┃ Anti Call    : ${f(s.antiCall !== false)}
┃ Anti ViewOnce: ${f(s.antiViewOnce)}
┃
┃ 🌐 BOT
┃ Mode  : ${s.mode||'public'}
┃ Prefix: ${s.prefix||'.'}
┃
╰━━━━━━━━━━━━━━━⬣` }, { quoted: msg });
    }
  },
];
