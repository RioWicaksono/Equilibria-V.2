/**
 * Environment Variables Type Declarations
 * Provides type safety for environment variables
 */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Database
      DATABASE_URL: string;

      // Security
      API_SECRET_KEY: string;

      // Telegram
      TELEGRAM_BOT_TOKEN: string;

      // App
      APP_URL: string;
      NODE_ENV: string;

      // Push Notifications
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: string;
      VAPID_PRIVATE_KEY: string;
      VAPID_EMAIL: string;

      // Public (accessible from browser)
      NEXT_PUBLIC_APP_URL: string;
    }
  }
}

export {};