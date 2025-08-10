# FlashCard Pro 🧠

A modern, intelligent flashcard application built with Next.js that's fully compatible with Anki decks.

## ✨ Features

- **Intelligent Spaced Repetition**: Uses FSRS algorithm for optimal learning intervals
- **Anki Compatibility**: Full import/export support for .apkg files  
- **Modern UI**: Beautiful interface built with shadcn/ui and Tailwind CSS
- **Offline-First**: All data stored locally using browser localStorage
- **Study Sessions**: Comprehensive study interface with progress tracking
- **Card Management**: Create, edit, and organize flashcards with tags
- **Background Audio**: Nature sounds and ambient noise for focus

## 🚀 Quick Start

### Using Docker (Recommended)

Pull and run the pre-built image:

```bash
docker run -d \
  --name flashcard-pro \
  --restart unless-stopped \
  -p 3000:3000 \
  -e TZ=Europe/Vienna \
  ghcr.io/phil-flashcard-pro/flashcard:latest
```

Or use docker-compose:

```bash
curl -o docker-compose.yml https://raw.githubusercontent.com/phil-flashcard-pro/flashcard/main/docker-compose.production.yml
docker-compose up -d
```

### Development

```bash
git clone https://github.com/phil-flashcard-pro/flashcard.git
cd flashcard
npm install
npm run dev
```

## 📱 Usage

1. **Access the app**: Open http://localhost:3000
2. **Create decks**: Add new flashcard decks
3. **Import Anki**: Upload .apkg files from Anki
4. **Study**: Use spaced repetition to learn efficiently
5. **Track progress**: Monitor your learning statistics

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui components  
- **Spaced Repetition**: ts-fsrs library (FSRS algorithm)
- **Anki Import**: sql.js + JSZip for .apkg processing
- **Data Storage**: Browser localStorage (client-side)

## 📦 Docker Images

Images are automatically built and pushed to GitHub Container Registry:

- `ghcr.io/phil-flashcard-pro/flashcard:latest` - Latest stable release
- `ghcr.io/phil-flashcard-pro/flashcard:main` - Main branch builds

## 🏠 Self-Hosting

Perfect for home networks and NAS deployments:

- **No internet required**: Fully offline after initial setup
- **Lightweight**: ~50MB Docker image
- **ARM support**: Works on Raspberry Pi and ARM-based NAS
- **Health checks**: Built-in monitoring and auto-restart

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.