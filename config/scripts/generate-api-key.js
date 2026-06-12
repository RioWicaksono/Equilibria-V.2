#!/usr/bin/env node
/**
 * Generate API Key Script
 * Usage: node config/scripts/generate-api-key.js
 */

const crypto = require('crypto');

function generateApiKey(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

function generateVapidKeys() {
  const vapidKeys = crypto.generateKeyPairSync('RSA', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  return {
    publicKey: vapidKeys.publicKey,
    privateKey: vapidKeys.privateKey,
  };
}

// Main
const args = process.argv.slice(2);
const command = args[0] || 'api-key';

console.log('\n🔑 Equilibria Key Generator\n');

switch (command) {
  case 'api-key':
    const apiKey = generateApiKey();
    console.log('📝 API Secret Key:');
    console.log(`   ${apiKey}\n`);
    console.log('Add to your .env.local:');
    console.log(`   API_SECRET_KEY="${apiKey}"\n`);
    break;

  case 'vapid':
    const keys = generateVapidKeys();
    console.log('📝 VAPID Public Key:');
    console.log(`   ${keys.publicKey}\n`);
    console.log('📝 VAPID Private Key:');
    console.log(`   ${keys.privateKey}\n`);
    console.log('Add to your .env.local:');
    console.log(`   NEXT_PUBLIC_VAPID_PUBLIC_KEY="${keys.publicKey}"`);
    console.log(`   VAPID_PRIVATE_KEY="${keys.privateKey}"\n`);
    break;

  case 'all':
    const newApiKey = generateApiKey();
    const newVapidKeys = generateVapidKeys();
    console.log('📝 API Secret Key:');
    console.log(`   ${newApiKey}`);
    console.log('\n📝 VAPID Keys:');
    console.log(`   Public: ${newVapidKeys.publicKey}`);
    console.log(`   Private: ${newVapidKeys.privateKey}`);
    console.log('\n✨ Copy these to your .env.local file!\n');
    break;

  default:
    console.log('Usage: node generate-api-key.js <command>');
    console.log('\nCommands:');
    console.log('  api-key  - Generate API secret key');
    console.log('  vapid    - Generate VAPID keys for push notifications');
    console.log('  all      - Generate all keys\n');
    break;
}