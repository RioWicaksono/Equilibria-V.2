# ⚖️ Equilibria V.2

Aplikasi pencatatan keuangan pribadi dengan fitur lengkap untuk mengelola transaksi, tabungan, budget, dan target finansial.

## ✨ Fitur Utama

- **📊 Dashboard** - Ringkasan keuangan real-time
- **💰 Transaksi** - Pencatatan pemasukan & pengeluaran
- **👛 Multi-Dompet** - Kelola berbagai rekening (IDR, USD, dll)
- **📈 Budget** - Batas pengeluaran per kategori
- **🎯 Target Tabungan** - Pantau progress pencapaian
- **💳 Hutang & Piutang** - Kelola pinjaman
- **🔄 Auto Transaction** - Transaksi berulang otomatis
- **⏰ Reminder** - Pengingat jatuh tempo
- **📱 PWA** - Install sebagai aplikasi native
- **🔐 Keamanan** - PIN & biometric authentication
- **📱 Mobile-First** - Responsive design
- **🔔 Telegram Bot** - Catat transaksi via chat

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, Tailwind CSS 4 |
| Backend | Next.js API Routes, Prisma ORM |
| Database | PostgreSQL (Neon) |
| State | React Query, Context API |
| UI | Framer Motion, Lucide Icons |
| Testing | Vitest, Playwright |
| Deployment | Vercel |

## 📁 Project Structure (DDD)

```
equilibria/
├── app/                    # Next.js App Router
│   ├── components/         # UI Components
│   │   ├── ui/           # Reusable components
│   │   ├── layout/       # Layout components
│   │   └── shared/       # Shared utilities
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities
│   ├── providers/         # Context providers
│   └── pages/             # App pages (api, pages)
│
├── src/                    # Domain Layer (DDD)
│   ├── domain/            # Business logic
│   │   ├── entities/     # Domain entities
│   │   ├── value-objects/ # Value objects
│   │   ├── repositories/  # Repository interfaces
│   │   └── events/        # Domain events
│   ├── application/       # Use cases
│   │   ├── services/      # Application services
│   │   └── use-cases/    # Use case implementations
│   └── infrastructure/    # External concerns
│       ├── database/      # Prisma client
│       ├── repositories/   # Repository implementations
│       └── services/      # External services
│
├── config/                 # Configuration
│   ├── app.config.ts      # App configuration
│   ├── environment.ts     # Environment settings
│   └── scripts/          # Setup scripts
│
├── prisma/                # Database schema
├── public/                # Static assets
├── tests/                  # Test files
│   ├── domain/           # Domain tests
│   ├── api/              # API tests
│   ├── e2e/              # E2E tests
│   └── lib/              # Utility tests
│
├── config/               # Configuration
└── .env.local           # Environment variables
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm or pnpm
- PostgreSQL database (or use Neon)

### Installation

```bash
# Clone repository
git clone <repo-url>
cd equilibria-v2

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Edit .env.local with your values
nano .env.local

# Setup database
npm run db:migrate

# Start development
npm run dev
```

### Generate Keys

```bash
# Generate API secret key
npm run key:generate

# Generate all keys
npm run key:all
```

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |
| `npm run db:migrate` | Run database migrations |
| `npm run lint` | Run ESLint |

## 🔐 Environment Variables

Create `.env.local` from `.env.example`:

```env
# Database
DATABASE_URL="postgresql://..."

# Security
API_SECRET_KEY="generated-key"

# Telegram (optional)
TELEGRAM_BOT_TOKEN="token"

# Push Notifications (optional)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
```

## 🧪 Testing

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e
```

## 📱 PWA Installation

1. Buka aplikasi di browser Chrome/Safari
2. Klik "Install" pada popup atau menu
3. Aplikasi akan ter-install sebagai native app

## 🔔 Telegram Integration

1. Buat bot baru via @BotFather
2. Copy bot token ke `.env.local`
3. Jalankan script setup webhook:

```bash
node config/scripts/telegram/set-webhook.mjs
```

4. Mulai catat transaksi dengan format:
```
[pemasukan|pengeluaran] [kategori] [nominal]
```

## 📄 License

Private - All rights reserved

## 🌐 Live Demo

**Production:** [Equilibria V.2](https://equilibria-v2.vercel.app)