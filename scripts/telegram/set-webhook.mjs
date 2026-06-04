/**
 * Telegram Webhook Setup Script
 *
 * Usage: TELEGRAM_BOT_TOKEN=your_token node scripts/telegram/set-webhook.mjs
 */

const token = process.env.TELEGRAM_BOT_TOKEN;
const url = process.env.WEBHOOK_URL || "https://ais-pre-wcxkxckvdkfjww354eln2z-33092737822.asia-southeast1.run.app/api/telegram";

if (!token) {
  console.error("Error: TELEGRAM_BOT_TOKEN environment variable is not set");
  process.exit(1);
}

const webhookUrl = `https://api.telegram.org/bot${token}/setWebhook?url=${url}`;

fetch(webhookUrl)
  .then((res) => res.json())
  .then((result) => {
    if (result.ok) {
      console.log("✅ Webhook set successfully!");
      console.log(`   URL: ${url}`);
    } else {
      console.error("❌ Failed to set webhook:", result.description);
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("❌ Error:", error.message);
    process.exit(1);
  });