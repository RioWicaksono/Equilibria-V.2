// Generate a secure API key
// Run with: node scripts/generate-api-key.js

const crypto = require('crypto');

function generateApiKey(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

const apiKey = generateApiKey();

console.log('Generated API Key:');
console.log(apiKey);
console.log('\nAdd this to your .env.local file:');
console.log(`API_SECRET_KEY=${apiKey}`);