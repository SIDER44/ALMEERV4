const config = require('../config');
const { formatRuntime } = require('./utils');
const moment = require('moment');

const mainMenu = (ownerName, mode, runtime) => `
╭━━〔 *${config.botName}* 〕━━⬣
┃ 👤 Owner: ${ownerName}
┃ 🌐 Mode: ${mode}
┃ ⌨️  Prefix: *${config.prefix}*
┃ ⏱️  Runtime: ${formatRuntime(runtime)}
┃ 📅 ${moment().format('DD/MM/YYYY HH:mm:ss')}
╰━━━━━━━━━━━━━━━⬣

*〔 📋 CATEGORIES 〕*
╭─────────────────
│ *1.* 👑 Owner
│ *2.* 👥 Group
│ *3.* ⬇️  Downloader
│ *4.* 🤖 AI
│ *5.* 🔍 Search
│ *6.* 🎮 Fun
│ *7.* 🛠️  Utility
│ *8.* 🔒 Security
│ *9.* ⚙️  Settings
╰─────────────────

Type *${config.prefix}menu 1-9* for commands`.trim();

const categoryMenus = {
  1: () => `╭━━〔 👑 OWNER 〕━━⬣
┃ .shutdown  .restart  .mode
┃ .block  .unblock  .setprefix
┃ .setname  .setbio
┃ .eval  .exec  .broadcast
┃ .clearsession  .ban  .unban
┃ .banlist  .addpremium  .delpremium
╰━━━━━━━━━━━━━━━⬣`.trim(),

  2: () => `╭━━〔 👥 GROUP 〕━━⬣
┃ .kick  .add  .promote  .demote
┃ .tagall  .hidetag  .tagadmin
┃ .gclink  .revoke
┃ .group open/close
┃ .setwelcome  .setbye
┃ .rules  .groupinfo
┃ .warn  .warnlist  .resetwarn
┃ .mute  .antilink  .antispam
┃ .antibadword  .antiraid
╰━━━━━━━━━━━━━━━⬣`.trim(),

  3: () => `╭━━〔 ⬇️ DOWNLOADER 〕━━⬣
┃ .play  .playvid
┃ .ytmp3  .ytmp4
┃ .tiktok  .instagram
┃ .facebook  .twitter
┃ .spotify  .pinterest
┃ .apk  .sticker  .toimg
┃ .tomp3  .audio
╰━━━━━━━━━━━━━━━⬣`.trim(),

  4: () => `╭━━〔 🤖 AI 〕━━⬣
┃ .ai  .gpt
┃ .imagine  .code
┃ .bugfix  .explain
╰━━━━━━━━━━━━━━━⬣`.trim(),

  5: () => `╭━━〔 🔍 SEARCH 〕━━⬣
┃ .google  .ytsearch
┃ .lyrics  .weather
┃ .github  .npm  .wiki
╰━━━━━━━━━━━━━━━⬣`.trim(),

  6: () => `╭━━〔 🎮 FUN 〕━━⬣
┃ .meme  .joke  .quote
┃ .truth  .dare
┃ .ship  .hack  .roast
╰━━━━━━━━━━━━━━━⬣`.trim(),

  7: () => `╭━━〔 🛠️ UTILITY 〕━━⬣
┃ .ping  .alive  .runtime
┃ .speed  .profile  .owner
┃ .menu  .sticker  .toimg
┃ .tts  .afk  .uptime
┃ .copy  .delete  .plugins
╰━━━━━━━━━━━━━━━⬣`.trim(),

  8: () => `╭━━〔 🔒 SECURITY 〕━━⬣
┃ ✅ Anti-Call
┃ ✅ Anti-Delete
┃ ✅ Anti-DeleteStatus
┃ ✅ Anti-ViewOnce
┃ ✅ Anti-Link (group)
┃ ✅ Anti-Spam (group)
┃ ✅ Anti-Badword (group)
┃ ✅ Anti-Raid (group)
╰━━━━━━━━━━━━━━━⬣`.trim(),

  9: () => `╭━━〔 ⚙️ SETTINGS (TOGGLES) 〕━━⬣
┃ .autoviewstatus on/off
┃ .autoreactstatus on/off
┃ .autotyping on/off
┃ .autorecording on/off
┃ .autoread on/off
┃ .autoonline on/off
┃ .autoreply on/off
┃ .antidelete on/off
┃ .antideletestatus on/off
┃ .anticall on/off
┃ .antiviewonce on/off
┃ .welcome on/off
┃ .goodbye on/off
┃ .settings  ← view all
╰━━━━━━━━━━━━━━━⬣`.trim(),
};

module.exports = { mainMenu, categoryMenus };
