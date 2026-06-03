import { NextResponse } from 'next/server';
import { Telegraf } from 'telegraf';
import prisma from '@/lib/prisma';

declare global {
  var telegramLogs: Array<{ message: string, status: string, timestamp: string }>;
}
globalThis.telegramLogs = globalThis.telegramLogs || [];

function addLog(message: string, status: string) {
  globalThis.telegramLogs.unshift({
    message,
    status,
    timestamp: new Date().toISOString()
  });
  if (globalThis.telegramLogs.length > 10) {
    globalThis.telegramLogs.pop();
  }
}

function categorizeTransaction(description: string): string {
  const text = description.toLowerCase();
  
  const keywords = {
    'Food': ['makan', 'minum', 'food', 'kopi', 'sarapan', 'siang', 'malam', 'cemilan', 'snack', 'cafe', 'resto'],
    'Transport': ['bensin', 'parkir', 'tol', 'transport', 'gojek', 'grab', 'kereta', 'bus', 'taxi'],
    'Utilities': ['sewa', 'kos', 'listrik', 'air', 'internet', 'pulsa', 'kuota', 'tagihan', 'pajak'],
    'Shopping': ['shopee', 'tokopedia', 'belanja', 'baju', 'sepatu', 'buku', 'kebutuhan', 'supermarket', 'mall'],
    'Salary': ['gaji', 'bonus', 'project', 'freelance', 'thr'],
    'Entertainment': ['nonton', 'bioskop', 'game', 'langganan', 'netflix', 'spotify', 'liburan'],
    'Health': ['obat', 'dokter', 'rs', 'rumah sakit', 'vitamin', 'apotek', 'asuransi']
  };

  for (const [category, words] of Object.entries(keywords)) {
    if (words.some(word => text.includes(word))) {
      return category;
    }
  }

  return 'Other';
}

// Helper function to create a new telegraf bot instance
function getBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  return new Telegraf(token);
}

const bot = getBot();

if (bot) {
  bot.start((ctx) => ctx.reply('Selamat datang di Equilibria Bot! 💸\n\nGunakan format:\n[Pemasukan/Pengeluaran] [Kategori/Deskripsi] [Nominal]\n\nContoh:\npengeluaran makan siang 50000'));

  bot.on('text', async (ctx) => {
    try {
      const text = ctx.message.text.trim();
      if (text.startsWith('/')) return;

      const match = text.match(/^(pengeluaran|pemasukan|expense|income)\s+(.+)\s+(\d+)$/i);

      if (!match) {
        return ctx.reply('Format tidak dikenali.\n\nGunakan format: [Pemasukan/Pengeluaran] [Kategori/Deskripsi] [Nominal]\nContoh: pengeluaran makan siang 50000');
      }

      const typeStr = match[1].toLowerCase();
      const rawDescription = match[2].trim();
      const amount = parseFloat(match[3]);
      
      const type = (typeStr === 'pemasukan' || typeStr === 'income') ? 'INCOME' : 'EXPENSE';
      
      const category = categorizeTransaction(rawDescription);

      await prisma.transaction.create({
        data: {
          amount,
          type,
          category,
          description: rawDescription,
          date: new Date(),
        }
      });

      const typeLabel = type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran';
      ctx.reply(`✅ Berhasil dicatat!\n\n${typeLabel}: Rp ${amount.toLocaleString('id-ID')}\nKategori: ${category} (${rawDescription})`);
      
    } catch (error) {
      console.error(error);
      ctx.reply('Terjadi kesalahan saat memproses data Anda.');
    }
  });
}

export const dynamic = 'force-dynamic';

// Used for "Test Connection" and pulling status
export async function GET(req: Request) {
  const url = new URL(req.url);
  const isTest = url.searchParams.get('test') === 'true';
  const getLogs = url.searchParams.get('logs') === 'true';

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ status: 'INACTIVE', message: 'Telegram Bot Token is not configured', logs: globalThis.telegramLogs });
  }

  if (getLogs) {
    return NextResponse.json({ logs: globalThis.telegramLogs });
  }
  
  if (isTest && bot) {
    try {
      const botInfo = await bot.telegram.getMe();
      return NextResponse.json({ 
        status: 'ACTIVE', 
        message: `Successfully connected to bot @${botInfo.username}`,
        payload: botInfo,
        lastSync: new Date().toISOString()
      });
    } catch (error: any) {
      return NextResponse.json({ status: 'INACTIVE', message: 'Failed to verify bot connection token.', error: error.message });
    }
  }

  return NextResponse.json({ status: 'ACTIVE', message: 'Telegram Bot is configured', lastSync: new Date().toISOString() });
}

// Webhook payload receiver
export async function POST(req: Request) {
  try {
    if (!bot) {
      addLog("System Error", "Error: Bot not configured");
      return NextResponse.json({ error: 'Bot is not configured' }, { status: 500 });
    }
    const body = await req.json();
    
    let rawMessage = "Unknown Payload";
    if (body?.message?.text) {
      rawMessage = `User [${body.message.from?.first_name || 'Unknown'}]: ${body.message.text}`;
    } else if (body?.message) {
      rawMessage = "Non-text message received";
    }

    try {
      await bot.handleUpdate(body);
      addLog(rawMessage, "Success");
      return NextResponse.json({ ok: true });
    } catch (err) {
      addLog(rawMessage, "Failed");
      throw err;
    }
  } catch (err) {
    console.error('Error handling telegram webhook', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
