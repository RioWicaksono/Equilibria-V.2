const token = process.env.TELEGRAM_BOT_TOKEN;
const url = "https://ais-pre-wcxkxckvdkfjww354eln2z-33092737822.asia-southeast1.run.app/api/telegram";

fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${url}`)
  .then(res => res.json())
  .then(console.log)
  .catch(console.error);
