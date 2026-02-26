import config from '../config.js';
import { formatRuntime } from './utils.js';

export const mainMenu = (ownerName, mode, runtime) => `
╭━━〔 *${config.botName}* 〕━━⬣
┃ 👤 Owner: ${ownerName}
┃ 🌐 Mode: ${mode}
┃ ⌨️  Prefix: *${config.prefix}*
┃ ⏱️  Runtime: ${formatRuntime(runtime)}
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

export const categoryMenus = {
  1: () => `╭━━〔 👑 OWNER 〕━━⬣
┃ .shutdown  .restart  .mode
┃ .block  .unblock  .setprefix
┃ .setname  .setbio  .eval
┃ .exec  .broadcast  .ban
┃ .unban  .addpremium  .delpremium
╰━━━━━━━━━━━━━━━⬣`,

  2: () => `╭━━〔 👥 GROUP 〕━━⬣
┃ .kick  .add  .promote  .demote
┃ .tagall  .hidetag  .tagadmin
┃ .gclink  .revoke  .group
┃ .setwelcome  .setbye  .rules
┃ .warn  .resetwarn  .groupinfo
┃ .antilink  .antispam  .antibadword
╰━━━━━━━━━━━━━━━⬣`,

  3: () => `╭━━〔 ⬇️ DOWNLOADER 〕━━⬣
┃ .play  .playvid
┃ .ytmp3  .ytmp4
┃ .tiktok  .instagram
┃ .facebook  .twitter
┃ .spotify  .pinterest
┃ .tomp3  .sticker  .toimg
╰━━━━━━━━━━━━━━━⬣`,

  4: () => `╭━━〔 🤖 AI 〕━━⬣
┃ .ai  .gpt  .imagine
┃ .code  .bugfix  .explain
╰━━━━━━━━━━━━━━━⬣`,

  5: () => `╭━━〔 🔍 SEARCH 〕━━⬣
┃ .ytsearch  .lyrics
┃ .weather  .wiki
┃ .github  .npm
╰━━━━━━━━━━━━━━━⬣`,

  6: () => `╭━━〔 🎮 FUN 〕━━⬣
┃ .meme  .joke  .quote
┃ .truth  .dare
┃ .ship  .hack  .roast
╰━━━━━━━━━━━━━━━⬣`,

  7: () => `╭━━〔 🛠️ UTILITY 〕━━⬣
┃ .ping  .alive  .runtime
┃ .speed  .profile  .owner
┃ .sticker  .toimg  .tomp3
┃ .tts  .afk  .delete
╰━━━━━━━━━━━━━━━⬣`,

  8: () => `╭━━〔 🔒 SECURITY 〕━━⬣
┃ ✅ Anti-Call
┃ ✅ Anti-Delete
┃ ✅ Anti-Delete Status
┃ ✅ Anti-ViewOnce
┃ ✅ Anti-Link (group)
┃ ✅ Anti-Spam (group)
┃ ✅ Anti-Badword (group)
╰━━━━━━━━━━━━━━━⬣`,

  9: () => `╭━━〔 ⚙️ SETTINGS 〕━━⬣
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
╰━━━━━━━━━━━━━━━⬣`,
};
