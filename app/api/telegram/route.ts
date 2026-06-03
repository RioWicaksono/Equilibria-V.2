import { NextResponse } from 'next/server';
import { Telegraf } from 'telegraf';
import prisma from '@/lib/prisma';

// Helper function to create a new telegraf bot instance
function getBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  return new Telegraf(token);
}

const bot = getBot();

if (bot) {
  // Command handler
  bot.start((ctx) => ctx.reply('Selamat datang di Equilibria Bot! 💸\n\nUntuk mencatat transaksi, gunakan format:\n[Pemasukan/Pengeluaran] [Kategori/Deskripsi] [Nominal]\n\nContoh:\npengeluaran makan siang 50000\npemasukan gaji 1000000\n\nAtau gunakan perintah:\n/saldo - Lihat saldo saat ini (total dari transaksi)\n/recent - 5 Transaksi terakhir'));

  bot.command('saldo', async (ctx) => {
    try {
      const expenses = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: 'EXPENSE' },
      });
      const incomes = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: 'INCOME' },
      });
      
      const totalIncome = incomes._sum.amount || 0;
      const totalExpense = expenses._sum.amount || 0;
      const balance = totalIncome - totalExpense;

      ctx.reply(`Saldo Anda Saat Ini:\nRp ${balance.toLocaleString('id-ID')}\n\nTotal Pemasukan: Rp ${totalIncome.toLocaleString('id-ID')}\nTotal Pengeluaran: Rp ${totalExpense.toLocaleString('id-ID')}`);
    } catch (e) {
      console.error(e);
      ctx.reply('Gagal mengambil data saldo.');
    }
  });

  bot.command('recent', async (ctx) => {
    try {
      const recent = await prisma.transaction.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      });
      
      if (recent.length === 0) {
        return ctx.reply('Belum ada transaksi.');
      }

      const msg = recent.map(t => {
        const symbol = t.type === 'INCOME' ? '+' : '-';
        return `${t.date.toISOString().split('T')[0]} | ${t.category}\n${symbol} Rp ${t.amount.toLocaleString('id-ID')}`;
      }).join('\n\n');
      
      ctx.reply(`5 Transaksi Terakhir:\n\n${msg}`);

    } catch (e) {
      console.error(e);
      ctx.reply('Gagal mengambil data transaksi.');
    }
  });

  bot.on('text', async (ctx) => {
    try {
      const text = ctx.message.text.trim();
      
      // Jangan proses jika ini command
      if (text.startsWith('/')) return;

      // Extract details from plain text. Expected: "pengeluaran makan siang 50000" or "pemasukan gaji bulanan 10000"
      const match = text.match(/^(pengeluaran|pemasukan|expense|income)\s+(.+)\s+(\d+)$/i);

      if (!match) {
        return ctx.reply('Format tidak dikenali.\n\nGunakan format: [Pemasukan/Pengeluaran] [Kategori/Deskripsi] [Nominal]\nContoh: pengeluaran makan siang 50000');
      }

      const typeStr = match[1].toLowerCase();
      const category = match[2].trim();
      const amount = parseFloat(match[3]);
      
      const type = (typeStr === 'pemasukan' || typeStr === 'income') ? 'INCOME' : 'EXPENSE';

      // Record to database
      await prisma.transaction.create({
        data: {
          amount,
          type,
          category,
          description: `Via Telegram`,
          date: new Date(),
        }
      });

      const typeLabel = type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran';
      ctx.reply(`✅ Berhasil dicatat!\n\n${typeLabel}: Rp ${amount.toLocaleString('id-ID')}\nKategori: ${category}`);
      
    } catch (error) {
      console.error(error);
      ctx.reply('Terjadi kesalahan saat memproses data Anda.');
    }
  });
}

export const dynamic = 'force-dynamic';

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ status: 'INACTIVE', message: 'Telegram Bot Token is not configured' });
  }
  return NextResponse.json({ status: 'ACTIVE', message: 'Telegram Bot is configured' });
}

export async function POST(req: Request) {
  try {
    if (!bot) {
      return NextResponse.json({ error: 'Bot is not configured' }, { status: 500 });
    }
    const body = await req.json();
    await bot.handleUpdate(body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error handling telegram webhook', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
