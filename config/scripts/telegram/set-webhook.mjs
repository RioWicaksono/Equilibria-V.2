/**
 * Telegram Webhook Setup Script
 *
 * Usage:
 *   node config/scripts/telegram/set-webhook.mjs
 *
 * Environment:
 *   - TELEGRAM_BOT_TOKEN (required)
 *   - NEXT_PUBLIC_APP_URL or APP_URL (required)
 */

const token = process.env.TELEGRAM_BOT_TOKEN;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;

if (!token) {
  console.error('❌ Error: TELEGRAM_BOT_TOKEN is not set');
  console.error('   Set it in your .env.local file');
  process.exit(1);
}

if (!appUrl) {
  console.error('❌ Error: APP_URL is not set');
  console.error('   Set NEXT_PUBLIC_APP_URL in your .env.local file');
  process.exit(1);
}

const webhookUrl = `${appUrl}/api/telegram-webhook`;

console.log('\n📱 Telegram Webhook Setup\n');
console.log(`   Bot Token: ${token.substring(0, 10)}...`);
console.log(`   Webhook URL: ${webhookUrl}\n`);

fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${webhookUrl}`)
  .then((res) => res.json())
  .then((result) => {
    if (result.ok) {
      console.log('✅ Webhook set successfully!\n');
      console.log('📋 Next steps:');
      console.log('   1. Test your bot by sending /start');
      console.log('   2. Check Settings > Telegram in the app\n');
    } else {
      console.error('❌ Failed to set webhook:', result.description);
      console.error('\nTroubleshooting:');
      console.error('   1. Verify your bot token is correct');
      console.error('   2. Ensure your app URL is publicly accessible');
      console.error('   3. Check if the app is running\n');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });