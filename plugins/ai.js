const axios = require('axios');
const gpt = async (p) => {
  const r = await axios.get(`https://api.siputzx.my.id/api/ai/chatgpt?prompt=${encodeURIComponent(p)}`, { timeout: 30000 });
  return r.data?.data || r.data?.result || 'No response.';
};

module.exports = [
  { command: 'ai', execute: async ({ sock, msg, from, text }) => {
    if (!text) return sock.sendMessage(from, { text: '❌ .ai [question]' }, { quoted: msg });
    await sock.sendMessage(from, { text: '🤖 Thinking...' }, { quoted: msg });
    try { await sock.sendMessage(from, { text: `🤖 *AI*\n\n${await gpt(text)}` }, { quoted: msg }); }
    catch (e) { await sock.sendMessage(from, { text: `❌ ${e.message}` }, { quoted: msg }); }
  }},
  { command: 'gpt', execute: async ({ sock, msg, from, text }) => {
    if (!text) return sock.sendMessage(from, { text: '❌ .gpt [prompt]' }, { quoted: msg });
    await sock.sendMessage(from, { text: '⚡ Processing...' }, { quoted: msg });
    try { await sock.sendMessage(from, { text: `🧠 *GPT*\n\n${await gpt(text)}` }, { quoted: msg }); }
    catch (e) { await sock.sendMessage(from, { text: `❌ ${e.message}` }, { quoted: msg }); }
  }},
  { command: 'code', execute: async ({ sock, msg, from, text }) => {
    if (!text) return sock.sendMessage(from, { text: '❌ .code [language] [task]' }, { quoted: msg });
    await sock.sendMessage(from, { text: '💻 Generating...' }, { quoted: msg });
    try { await sock.sendMessage(from, { text: `💻 *Code*\n\n${await gpt('Write clean code: '+text)}` }, { quoted: msg }); }
    catch (e) { await sock.sendMessage(from, { text: `❌ ${e.message}` }, { quoted: msg }); }
  }},
  { command: 'bugfix', execute: async ({ sock, msg, from, text }) => {
    if (!text) return sock.sendMessage(from, { text: '❌ .bugfix [code]' }, { quoted: msg });
    await sock.sendMessage(from, { text: '🔍 Analyzing...' }, { quoted: msg });
    try { await sock.sendMessage(from, { text: `🐛 *Bug Fix*\n\n${await gpt('Find and fix bugs:\n'+text)}` }, { quoted: msg }); }
    catch (e) { await sock.sendMessage(from, { text: `❌ ${e.message}` }, { quoted: msg }); }
  }},
  { command: 'explain', execute: async ({ sock, msg, from, text }) => {
    if (!text) return sock.sendMessage(from, { text: '❌ .explain [code/topic]' }, { quoted: msg });
    await sock.sendMessage(from, { text: '📚 Analyzing...' }, { quoted: msg });
    try { await sock.sendMessage(from, { text: `📖 *Explanation*\n\n${await gpt('Explain simply: '+text)}` }, { quoted: msg }); }
    catch (e) { await sock.sendMessage(from, { text: `❌ ${e.message}` }, { quoted: msg }); }
  }},
  { command: 'imagine', execute: async ({ sock, msg, from, text }) => {
    if (!text) return sock.sendMessage(from, { text: '❌ .imagine [description]' }, { quoted: msg });
    await sock.sendMessage(from, { text: `🎨 Generating: *${text}*...` }, { quoted: msg });
    try {
      const res = await axios.get(`https://image.pollinations.ai/prompt/${encodeURIComponent(text)}?nologo=true&width=1024&height=1024`, { responseType: 'arraybuffer', timeout: 60000 });
      await sock.sendMessage(from, { image: Buffer.from(res.data), caption: `🎨 ${text}` }, { quoted: msg });
    } catch (e) { await sock.sendMessage(from, { text: `❌ ${e.message}` }, { quoted: msg }); }
  }},
];
