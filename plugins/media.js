import axios from 'axios';
const { isUrl } = require('../lib/utils');
const fetch = url => axios.get(url, { timeout: 30000 }).then(r => r.data);

module.exports = [
  { command: 'play', execute: async ({ sock, msg, from, text }) => {
    if (!text) return sock.sendMessage(from, { text: '❌ .play [song name]' }, { quoted: msg });
    await sock.sendMessage(from, { text: `🎵 Searching *${text}*...` }, { quoted: msg });
    try {
      const s = await fetch(`https://api.siputzx.my.id/api/s/youtube?q=${encodeURIComponent(text)}`);
      const top = s?.data?.[0]; if (!top) throw new Error('Not found');
      const dl = await fetch(`https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(top.url)}`);
      if (!dl?.data?.dl) throw new Error('Download failed');
      const res = await axios.get(dl.data.dl, { responseType: 'arraybuffer', timeout: 60000 });
      await sock.sendMessage(from, { audio: Buffer.from(res.data), mimetype: 'audio/mp4', fileName: `${top.title}.mp3` }, { quoted: msg });
      await sock.sendMessage(from, { text: `🎵 *${top.title}*\n⏱️ ${top.duration||'N/A'}\n🔗 ${top.url}` });
    } catch (e) { await sock.sendMessage(from, { text: `❌ ${e.message}` }, { quoted: msg }); }
  }},

  { command: 'playvid', aliases: ['pv'], execute: async ({ sock, msg, from, text }) => {
    if (!text) return sock.sendMessage(from, { text: '❌ .playvid [name]' }, { quoted: msg });
    await sock.sendMessage(from, { text: `🎬 Searching *${text}*...` }, { quoted: msg });
    try {
      const s = await fetch(`https://api.siputzx.my.id/api/s/youtube?q=${encodeURIComponent(text)}`);
      const top = s?.data?.[0]; if (!top) throw new Error('Not found');
      const dl = await fetch(`https://api.siputzx.my.id/api/d/ytmp4?url=${encodeURIComponent(top.url)}`);
      if (!dl?.data?.dl) throw new Error('Download failed');
      const res = await axios.get(dl.data.dl, { responseType: 'arraybuffer', timeout: 120000 });
      await sock.sendMessage(from, { video: Buffer.from(res.data), caption: `🎬 ${top.title}` }, { quoted: msg });
    } catch (e) { await sock.sendMessage(from, { text: `❌ ${e.message}` }, { quoted: msg }); }
  }},

  { command: 'ytmp3', aliases: ['yta'], execute: async ({ sock, msg, from, args }) => {
    const url = args[0];
    if (!url || !isUrl(url)) return sock.sendMessage(from, { text: '❌ .ytmp3 [url]' }, { quoted: msg });
    await sock.sendMessage(from, { text: '⏳ Downloading audio...' }, { quoted: msg });
    try {
      const dl = await fetch(`https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(url)}`);
      if (!dl?.data?.dl) throw new Error('No link');
      const res = await axios.get(dl.data.dl, { responseType: 'arraybuffer', timeout: 60000 });
      await sock.sendMessage(from, { audio: Buffer.from(res.data), mimetype: 'audio/mp4', fileName: `${dl.data.title||'audio'}.mp3` }, { quoted: msg });
    } catch (e) { await sock.sendMessage(from, { text: `❌ ${e.message}` }, { quoted: msg }); }
  }},

  { command: 'ytmp4', aliases: ['ytv'], execute: async ({ sock, msg, from, args }) => {
    const url = args[0];
    if (!url || !isUrl(url)) return sock.sendMessage(from, { text: '❌ .ytmp4 [url]' }, { quoted: msg });
    await sock.sendMessage(from, { text: '⏳ Downloading video...' }, { quoted: msg });
    try {
      const dl = await fetch(`https://api.siputzx.my.id/api/d/ytmp4?url=${encodeURIComponent(url)}`);
      if (!dl?.data?.dl) throw new Error('No link');
      const res = await axios.get(dl.data.dl, { responseType: 'arraybuffer', timeout: 120000 });
      await sock.sendMessage(from, { video: Buffer.from(res.data), caption: `🎬 ${dl.data.title||'Video'}` }, { quoted: msg });
    } catch (e) { await sock.sendMessage(from, { text: `❌ ${e.message}` }, { quoted: msg }); }
  }},

  { command: 'tiktok', aliases: ['tt'], execute: async ({ sock, msg, from, args }) => {
    const url = args[0];
    if (!url || !isUrl(url)) return sock.sendMessage(from, { text: '❌ .tiktok [url]' }, { quoted: msg });
    await sock.sendMessage(from, { text: '⏳ Downloading TikTok...' }, { quoted: msg });
    try {
      const d = await fetch(`https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(url)}`);
      if (!d?.data?.video) throw new Error('Not found');
      const res = await axios.get(d.data.video, { responseType: 'arraybuffer', timeout: 60000 });
      await sock.sendMessage(from, { video: Buffer.from(res.data), caption: `🎵 ${d.data.title||'TikTok'}` }, { quoted: msg });
    } catch (e) { await sock.sendMessage(from, { text: `❌ ${e.message}` }, { quoted: msg }); }
  }},

  { command: 'instagram', aliases: ['ig'], execute: async ({ sock, msg, from, args }) => {
    const url = args[0];
    if (!url || !isUrl(url)) return sock.sendMessage(from, { text: '❌ .instagram [url]' }, { quoted: msg });
    await sock.sendMessage(from, { text: '⏳ Downloading...' }, { quoted: msg });
    try {
      const d = await fetch(`https://api.siputzx.my.id/api/d/instagram?url=${encodeURIComponent(url)}`);
      const mediaUrl = Array.isArray(d?.data) ? d.data[0] : d?.data;
      if (!mediaUrl) throw new Error('Not found');
      const res = await axios.get(mediaUrl, { responseType: 'arraybuffer', timeout: 60000 });
      const isVid = mediaUrl.includes('.mp4');
      await sock.sendMessage(from, isVid ? { video: Buffer.from(res.data), caption: '📸 Instagram' } : { image: Buffer.from(res.data), caption: '📸 Instagram' }, { quoted: msg });
    } catch (e) { await sock.sendMessage(from, { text: `❌ ${e.message}` }, { quoted: msg }); }
  }},

  { command: 'facebook', aliases: ['fb'], execute: async ({ sock, msg, from, args }) => {
    const url = args[0];
    if (!url || !isUrl(url)) return sock.sendMessage(from, { text: '❌ .facebook [url]' }, { quoted: msg });
    await sock.sendMessage(from, { text: '⏳ Downloading...' }, { quoted: msg });
    try {
      const d = await fetch(`https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(url)}`);
      const v = d?.data?.hd || d?.data?.sd || d?.data;
      if (!v) throw new Error('Not found');
      const res = await axios.get(v, { responseType: 'arraybuffer', timeout: 120000 });
      await sock.sendMessage(from, { video: Buffer.from(res.data), caption: '📘 Facebook' }, { quoted: msg });
    } catch (e) { await sock.sendMessage(from, { text: `❌ ${e.message}` }, { quoted: msg }); }
  }},

  { command: 'twitter', aliases: ['tw'], execute: async ({ sock, msg, from, args }) => {
    const url = args[0];
    if (!url || !isUrl(url)) return sock.sendMessage(from, { text: '❌ .twitter [url]' }, { quoted: msg });
    await sock.sendMessage(from, { text: '⏳ Downloading...' }, { quoted: msg });
    try {
      const d = await fetch(`https://api.siputzx.my.id/api/d/twitter?url=${encodeURIComponent(url)}`);
      const v = d?.data?.[0]?.url || d?.data?.url;
      if (!v) throw new Error('Not found');
      const res = await axios.get(v, { responseType: 'arraybuffer', timeout: 60000 });
      await sock.sendMessage(from, { video: Buffer.from(res.data), caption: '🐦 Twitter/X' }, { quoted: msg });
    } catch (e) { await sock.sendMessage(from, { text: `❌ ${e.message}` }, { quoted: msg }); }
  }},

  { command: 'spotify', aliases: ['sp'], execute: async ({ sock, msg, from, args }) => {
    const url = args[0];
    if (!url || !isUrl(url)) return sock.sendMessage(from, { text: '❌ .spotify [url]' }, { quoted: msg });
    await sock.sendMessage(from, { text: '🎵 Downloading Spotify...' }, { quoted: msg });
    try {
      const d = await fetch(`https://api.siputzx.my.id/api/d/spotify?url=${encodeURIComponent(url)}`);
      if (!d?.data?.dl) throw new Error('No link');
      const res = await axios.get(d.data.dl, { responseType: 'arraybuffer', timeout: 60000 });
      await sock.sendMessage(from, { audio: Buffer.from(res.data), mimetype: 'audio/mp4', fileName: `${d.data.title||'track'}.mp3` }, { quoted: msg });
    } catch (e) { await sock.sendMessage(from, { text: `❌ ${e.message}` }, { quoted: msg }); }
  }},

  { command: 'pinterest', aliases: ['pin'], execute: async ({ sock, msg, from, text }) => {
    if (!text) return sock.sendMessage(from, { text: '❌ .pinterest [query]' }, { quoted: msg });
    await sock.sendMessage(from, { text: `📌 Searching *${text}*...` }, { quoted: msg });
    try {
      const d = await fetch(`https://api.siputzx.my.id/api/s/pinterest?q=${encodeURIComponent(text)}`);
      const imgs = d?.data?.slice(0,3); if (!imgs?.length) throw new Error('Not found');
      for (const img of imgs) {
        const res = await axios.get(img, { responseType: 'arraybuffer', timeout: 30000 });
        await sock.sendMessage(from, { image: Buffer.from(res.data), caption: `📌 ${text}` });
        await new Promise(r => setTimeout(r, 800));
      }
    } catch (e) { await sock.sendMessage(from, { text: `❌ ${e.message}` }, { quoted: msg }); }
  }},

  { command: 'tomp3', execute: async ({ sock, msg, from }) => {
    const q = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!q?.videoMessage) return sock.sendMessage(from, { text: '❌ Reply to a video.' }, { quoted: msg });
    try {
      const buf = await sock.downloadMediaMessage({ message: { videoMessage: q.videoMessage } });
      await sock.sendMessage(from, { audio: buf, mimetype: 'audio/mp4' }, { quoted: msg });
    } catch (e) { await sock.sendMessage(from, { text: `❌ ${e.message}` }, { quoted: msg }); }
  }},
];
