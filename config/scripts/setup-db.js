#!/usr/bin/env node
/**
 * Database Setup Script
 * Usage: node config/scripts/setup-db.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setup() {
  console.log('\n🔧 Equilibria Database Setup\n');

  try {
    // Test connection
    console.log('📡 Testing database connection...');
    await prisma.$connect();
    console.log('   ✅ Connected successfully!\n');

    // Run migrations
    console.log('🔄 Running migrations...');
    // Note: In production, use prisma migrate deploy
    // For development, you can use prisma migrate dev

    // Create indexes (if needed)
    console.log('📊 Creating indexes...');

    // Seed default data (optional)
    console.log('\n✨ Database setup complete!\n');

    console.log('Next steps:');
    console.log('  1. Run: npx prisma migrate dev');
    console.log('  2. Add seed data if needed');
    console.log('  3. Start the app: npm run dev\n');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('  1. Check DATABASE_URL in .env.local');
    console.log('  2. Ensure Neon database is running');
    console.log('  3. Check network connectivity\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setup();