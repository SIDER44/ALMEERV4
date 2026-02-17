# ALMEERV4
# ALMEERV4 - Advanced WhatsApp Bot

![Version](https://img.shields.io/badge/version-4.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![License](https://img.shields.io/badge/license-MIT-red)

## 📱 Features

- **350+ Working Commands** across multiple categories
- **Fast & Optimized** - Better than most public bots
- **Multi-Device Support** - Works with WhatsApp Web/MD
- **Advanced Security** - Owner/Admin only commands
- **Economy System** - Virtual currency, shop, daily rewards
- **RPG System** - Level up, battle, explore
- **Downloaders** - YouTube, TikTok, Instagram, Facebook
- **AI Integration** - ChatGPT, Image generation
- **Group Management** - Anti-link, welcome/goodbye, tagall
- **Media Tools** - Sticker maker, image editor, converter
- **Islamic Features** - Quran, Hadith, Prayer times
- **Fun Commands** - Games, memes, quizzes, jokes

## 🚀 Quick Deployment

### Deploy on Render

1. Fork this repository
2. Create new Web Service on Render
3. Connect your forked repo
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Add environment variables from `.env.example`

### Deploy on Railway

1. Click "Deploy on Railway" button
2. Connect your GitHub repo
3. Add environment variables
4. Deploy automatically

### Run on Termux

```bash
pkg update && pkg upgrade
pkg install nodejs git ffmpeg
git clone https://github.com/yourusername/ALMEERV4
cd ALMEERV4
npm install
cp .env.example .env
# Edit .env with your settings
npm start
