# Configuration Module

## Structure

```
config/
├── index.ts           # Main export
├── app.config.ts      # Application configuration
├── environment.ts     # Environment-specific settings
├── env.d.ts           # Type declarations for env vars
└── scripts/
    ├── generate-api-key.js  # Generate API keys
    └── setup-db.js           # Database setup
```

## Usage

### Import Configuration

```typescript
// Import specific config
import { APP_CONFIG, API_CONFIG } from '@/config';

// Import all config
import config from '@/config';

// Use in code
const apiKey = API_CONFIG.secretKey;
```

### Environment Variables

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Fill in your actual values:
- `DATABASE_URL` - Your Neon PostgreSQL connection string
- `API_SECRET_KEY` - Generate with: `node config/scripts/generate-api-key.js api-key`
- `TELEGRAM_BOT_TOKEN` - Get from @BotFather on Telegram
- `VAPID keys` - Generate with: `node config/scripts/generate-api-key.js vapid`

### Generate Keys

```bash
# Generate API secret key
node config/scripts/generate-api-key.js api-key

# Generate VAPID keys for push notifications
node config/scripts/generate-api-key.js vapid

# Generate all keys
node config/scripts/generate-api-key.js all
```

### Database Setup

```bash
# Setup database
node config/scripts/setup-db.js

# Run migrations
npx prisma migrate dev
```

## Configuration Options

| Variable | Description | Required |
|----------|--------------|----------|
| `DATABASE_URL` | Neon PostgreSQL connection string | Yes |
| `API_SECRET_KEY` | Secret key for API authentication | Yes |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | No |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID public key for push | No |
| `VAPID_PRIVATE_KEY` | VAPID private key for push | No |
| `NEXT_PUBLIC_APP_URL` | Application URL | Yes |

## Feature Flags

Features can be enabled/disabled via configuration:

```typescript
import { FEATURES } from '@/config';

if (FEATURES.telegram) {
  // Telegram integration code
}
```