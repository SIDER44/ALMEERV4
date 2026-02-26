import axios from 'axios';
const fetch = url => axios.get(url, { timeout: 20000 }).then(r => r.data);

module.exports = [
  { command: 'weather', execute: async ({ sock, msg, from, text }) => {
    if (!text) return sock.sendMessage(from, { text: '❌ .weather [city]' }, { quoted: msg });
    try {
      const d = await fetch(`https://api.siputzx.my.id/api/i/weather?city=${encodeURIComponent(text)}`);
      if (!d?.data) throw new Error('City not found');
      const w = d.data;
      await sock.sendMessage(from, { text: `🌤️ *${w.city||text}*\n\n🌡️ ${w.temp||w.temperature}°C\n💧 Humidity: ${w.humidity}%\n🌬️ Wind: ${w.wind||w.windSpeed} km/h\n☁️ ${w.weather||w.description}` }, { quoted: msg });
    } catch (e) { await sock.sendMessage(from, { text: `❌ ${e.message}` }, { quoted: msg }); }
  }},

  { command: 'wiki', execute: async ({ sock, msg, from, text }) => {
    if (!text) return sock.sendMessage(from, { text: '❌ .wiki [topic]' }, { quoted: msg });
    try {
      const r = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(text)}`);
      const d = r.data;
      await sock.sendMessage(from, { text: `📚 *${d.title}*\n\n${d.extract?.slice(0,1000)||'Not found'}` }, { quoted: msg });
    } catch { await sock.sendMessage(from, { text: `❌ Not found: ${text}` }, { quoted: msg }); }
  }},

  { command: 'lyrics', execute: async ({ sock, msg, from, text }) => {
    if (!text) return sock.sendMessage(from, { text: '❌ .lyrics [song]' }, { quoted: msg });
    await sock.sendMessage(from, { text: `🔍 Searching lyrics for *${text}*...` }, { quoted: msg });
    try {
      const d = await fetch(`https://api.siputzx.my.id/api/s/lyrics?q=${encodeURIComponent(text)}`);
      if (!d?.data) throw new Error('Not found');
      await sock.sendMessage(from, { text: `🎵 *${d.data.title}* — ${d.data.artist}\n\n${d.data.lyrics?.slice(0,3000)||'Not found'}` }, { quoted: msg });
    } catch (e) { await sock.sendMessage(from, { text: `❌ ${e.message}` }, { quoted: msg }); }
  }},

  { command: 'github', aliases: ['gh'], execute: async ({ sock, msg, from, args }) => {
    if (!args[0]) return sock.sendMessage(from, { text: '❌ .github [user] or [user/repo]' }, { quoted: msg });
    try {
      const isRepo = args[0].includes('/');
      const r = await axios.get(`https://api.github.com/${isRepo?'repos':'users'}/${args[0]}`);
      const d = r.data;
      await sock.sendMessage(from, { text: isRepo
        ? `📦 *${d.full_name}*\n📝 ${d.description||'No description'}\n⭐ ${d.stargazers_count} | 🍴 ${d.forks_count}\n🔗 ${d.html_url}`
        : `👤 *${d.name||d.login}*\n📝 ${d.bio||'No bio'}\n👥 ${d.followers} followers\n📦 ${d.public_repos} repos\n🔗 ${d.html_url}`
      }, { quoted: msg });
    } catch { await sock.sendMessage(from, { text: `❌ Not found: ${args[0]}` }, { quoted: msg }); }
  }},

  { command: 'npm', execute: async ({ sock, msg, from, text }) => {
    if (!text) return sock.sendMessage(from, { text: '❌ .npm [package]' }, { quoted: msg });
    try {
      const r = await axios.get(`https://registry.npmjs.org/${encodeURIComponent(text)}`);
      const d = r.data; const v = d['dist-tags']?.latest;
      await sock.sendMessage(from, { text: `📦 *${d.name}* v${v}\n📝 ${d.description||'N/A'}\n🔗 https://npmjs.com/package/${d.name}` }, { quoted: msg });
    } catch { await sock.sendMessage(from, { text: `❌ Not found: ${text}` }, { quoted: msg }); }
  }},

  { command: 'ytsearch', execute: async ({ sock, msg, from, text }) => {
    if (!text) return sock.sendMessage(from, { text: '❌ .ytsearch [query]' }, { quoted: msg });
    await sock.sendMessage(from, { text: `🔍 Searching *${text}*...` }, { quoted: msg });
    try {
      const d = await fetch(`https://api.siputzx.my.id/api/s/youtube?q=${encodeURIComponent(text)}`);
      const r = d?.data?.slice(0,5); if (!r?.length) throw new Error('No results');
      await sock.sendMessage(from, { text: `🎬 *Results: "${text}"*\n\n${r.map((v,i)=>`*${i+1}.* ${v.title}\n   ⏱️ ${v.duration||'N/A'} | 🔗 ${v.url}`).join('\n\n')}` }, { quoted: msg });
    } catch (e) { await sock.sendMessage(from, { text: `❌ ${e.message}` }, { quoted: msg }); }
  }},
];
