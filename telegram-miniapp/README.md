# SwiftPay Telegram Mini App

A Telegram Mini App for the SwiftPay payment platform, enabling users to manage their wallet and transactions directly within Telegram.

## Features

- 💰 **Wallet Management** - View balance and manage cryptocurrency wallets
- 📊 **Transaction History** - Track all incoming and outgoing transactions
- 🔐 **Secure Authentication** - Telegram Web App authentication
- 📱 **Mobile Optimized** - Perfect for mobile use with safe area support
- 🎨 **Modern UI** - Dark theme optimized for Telegram
- ⚡ **Fast & Responsive** - Built with React and Vite

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0

### Installation

```bash
cd telegram-miniapp
pnpm install
```

### Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

### Development

```bash
pnpm dev
```

The app will be available at `http://localhost:5174`

### Build

```bash
pnpm build
```

## Project Structure

```
src/
├── components/      # Reusable UI components
├── pages/          # Page components
├── lib/            # Utilities and API client
│   ├── telegram.ts # Telegram Web App API wrapper
│   ├── api.ts      # API client
│   └── utils.ts    # Helper functions
├── types/          # TypeScript types
├── App.tsx         # Root component
└── main.tsx        # Entry point
```

## Telegram Integration

### Bot Setup

1. Create a new bot with [@BotFather](https://t.me/botfather)
2. Set the Mini App URL:
   ```
   /setmenubutton
   ```
3. Configure the web app URL in your bot settings

### API Integration

The app uses the same backend API as the main SwiftPay platform:

- Base URL: `https://api.swiftpay.ph/api/v1`
- Authentication: Telegram init data
- Headers: `X-Telegram-Init-Data: {initData}`

## Deployment

### Vercel

```bash
vercel deploy
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN pnpm install
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "preview"]
```

## License

MIT
