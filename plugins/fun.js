const axios = require('axios');
const { randomItem } = require('../lib/utils');

const jokes = ["Why do programmers prefer dark mode? Because light attracts bugs! 🐛","How many programmers to change a bulb? None, it's a hardware problem! 💡","Why did the dev quit? Didn't get arrays! 😄"];
const quotes = ['"The only way to do great work is to love what you do." — Steve Jobs','"Code is like humor. When you have to explain it, it\'s bad." — Cory House','"First solve the problem, then write the code." — John Johnson'];
const truths = ["Have you ever pushed to main without testing?","What's the most embarrassing bug you caused in production?","Have you ever lied about your coding skills?"];
const dares = ["Write a full program in one line and send it here!","Explain recursion using a real-life example.","Write the worst possible variable names for a function."];

module.exports = [
  { command: 'joke', execute: async ({ sock, msg, from }) => {
    try {
      const r = await axios.get('https://official-joke-api.appspot.com/random_joke', { timeout: 5000 });
      await sock.sendMessage(from, { text: `😂 *Joke*\n\n${r.data.setup}\n\n${r.data.punchline}` }, { quoted: msg });
    } catch { await sock.sendMessage(from, { text: `😂 *Joke*\n\n${randomItem(jokes)}` }, { quoted: msg }); }
  }},
  { command: 'quote', execute: async ({ sock, msg, from }) => {
    try {
      const r = await axios.get('https://api.quotable.io/random', { timeout: 5000 });
      await sock.sendMessage(from, { text: `💬 "${r.data.content}" — ${r.data.author}` }, { quoted: msg });
    } catch { await sock.sendMessage(from, { text: `💬 ${randomItem(quotes)}` }, { quoted: msg }); }
  }},
  { command: 'truth', execute: async ({ sock, msg, from }) => { await sock.sendMessage(from, { text: `🎯 *Truth*\n\n${randomItem(truths)}` }, { quoted: msg }); }},
  { command: 'dare', execute: async ({ sock, msg, from }) => { await sock.sendMessage(from, { text: `🔥 *Dare*\n\n${randomItem(dares)}` }, { quoted: msg }); }},
  { command: 'ship', execute: async ({ sock, msg, from }) => {
    const m = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const p1 = m[0] ? `@${m[0].split('@')[0]}` : 'Person1';
    const p2 = m[1] ? `@${m[1].split('@')[0]}` : 'Person2';
    const pct = Math.floor(Math.random()*101);
    const emoji = pct<30?'💔':pct<60?'💛':pct<80?'❤️':'💘';
    const label = pct<30?'Not compatible':'Maybe someday!':pct<60?'Maybe someday!':pct<80?'Great match!':'SOULMATES! 🎉';
    await sock.sendMessage(from, { text: `💑 *Ship*\n\n${p1} + ${p2}\n\n${emoji} *${pct}%* — ${label}`, mentions: m }, { quoted: msg });
  }},
  { command: 'hack', execute: async ({ sock, msg, from, args }) => {
    const m = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const t = m[0] ? `@${m[0].split('@')[0]}` : (args[0]||'someone');
    const steps = [`💻 Initializing hack on ${t}...`,`🔍 Scanning IP...`,`🔓 Bypassing firewall...`,`📡 Accessing mainframe...`,`💾 Downloading data...`,`✅ Hack complete! ${t} has been owned! 😈`];
    for (const s of steps) { await sock.sendMessage(from, { text: s, mentions: m }); await new Promise(r=>setTimeout(r,1000)); }
  }},
  { command: 'roast', execute: async ({ sock, msg, from }) => {
    const m = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const roasts = ["You're the human version of a 404 error.","I'd agree with you but then we'd both be wrong.","Your code has more bugs than the Amazon rainforest.","Even Google couldn't find a reason to follow you."];
    const t = m[0] ? `@${m[0].split('@')[0]}` : 'you';
    await sock.sendMessage(from, { text: `🔥 *Roast*\n\n${t}, ${randomItem(roasts)}`, mentions: m }, { quoted: msg });
  }},
  { command: 'meme', execute: async ({ sock, msg, from }) => {
    await sock.sendMessage(from, { text: '😂 Fetching meme...' }, { quoted: msg });
    try {
      const r = await axios.get('https://meme-api.com/gimme', { timeout: 10000 });
      const res = await axios.get(r.data.url, { responseType: 'arraybuffer' });
      await sock.sendMessage(from, { image: Buffer.from(res.data), caption: `😂 ${r.data.title}` }, { quoted: msg });
    } catch (e) { await sock.sendMessage(from, { text: `❌ ${e.message}` }, { quoted: msg }); }
  }},
];
