import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      return NextResponse.json({ ok: false, error: 'Bot not configured' }, { status: 500 });
    }

    // Only handle text messages
    if (!body.message || !body.message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = body.message.chat.id;
    const text = body.message.text.trim();
    const firstName = body.message.chat.first_name || 'User';
    const command = text.split(' ')[0].toLowerCase();
    const args = text.split(' ').slice(1).join(' ');

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(amount);
    };

    const sendMsg = async (msg: string) => {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' })
      });
    };

    switch (command) {
      case '/start':
      case '/menu':
        await sendMsg(`👋 *Halo ${firstName}!*

Selamat datang di *Equilibria Finance Bot* 🤖

━━━━━━━━━━━━━━━
📋 *Command:*
━━━━━━━━━━━━━━━
/start  - Menu
/help   - Panduan
/balance - Cek saldo
/stats  - Statistik
/budget - Budget
/list   - Riwayat
/add    - Tambah transaksi

━━━━━━━━━━━━━━━
💡 *Quick Mode:*
━━━━━━━━━━━━━━━
Ketik langsung:
pengeluaran makan 50000
━━━━━━━━━━━━━━━
_Equilibria Finance_`);
        break;

      case '/help':
      case '/panduan':
        await sendMsg(`📚 *Panduan*

━━━━━━━━━━━━━━━
Format:
• /add pengeluaran makan 50000
• /add pemasukan gaji 5000000

Quick: ketik langsung tanpa slash

━━━━━━━━━━━━━━━
Categories auto-detect
━━━━━━━━━━━━━━━
_Equilibria Finance_`);
        break;

      case '/balance':
      case '/saldo':
      case '/stats':
      case '/statistik':
      case '/budget':
      case '/anggaran':
      case '/list':
      case '/riwayat':
        await sendMsg(`📊 *Data Finance*

━━━━━━━━━━━━━━━
Buka app untuk melihat data lengkap:

👉 equilibria-fiscal.vercel.app
━━━━━━━━━━━━━━━
_Equilibria Finance_`);
        break;

      case '/add':
      case '/tambah':
        if (!args) {
          await sendMsg(`📝 *Tambah Transaksi*

━━━━━━━━━━━━━━━
/add pengeluaran makan 50000
━━━━━━━━━━━━━━━
_Equilibria Finance_`);
        } else {
          await handleTransaction(token, chatId, args, formatCurrency);
        }
        break;

      default:
        await handleTransaction(token, chatId, text, formatCurrency);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

async function handleTransaction(token: string, chatId: number, text: string, formatCurrency: (n: number) => string) {
  const lowerText = text.toLowerCase();

  // Determine type
  const isIncome = lowerText.includes('pemasukan') || lowerText.includes('income') || lowerText.includes('masuk');
  const type = isIncome ? 'INCOME' : 'EXPENSE';

  // Extract amount
  const amountMatch = text.match(/\d+/g);
  if (!amountMatch) {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: '⚠️ Format: [tipe] [deskripsi] [nominal]\nContoh: pengeluaran makan 50000',
        parse_mode: 'Markdown'
      })
    });
    return;
  }

  const amount = parseInt(amountMatch[amountMatch.length - 1]);

  if (amount < 100) {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: '⚠️ Minimal Rp 100',
      })
    });
    return;
  }

  // Auto category
  const keywords: Record<string, string[]> = {
    'Makanan': ['makan', 'lunch', 'dinner', 'nasi', 'mie', 'ayam', 'soto', 'bakso'],
    'Transport': ['transport', 'bensin', 'parkir', 'ojek', 'grab', 'gojek'],
    'Belanja': ['belanja', 'market', 'indomaret', 'alfamart'],
    'Hiburan': ['film', 'nonton', 'game', 'netflix'],
    'Tagihan': ['listrik', 'air', 'internet', 'pulsa', 'wifi'],
    'Kesehatan': ['obat', 'dokter', 'apotek'],
    'Gaji': ['gaji', 'salary', 'thr', 'bonus'],
    'Freelance': ['freelance', 'project'],
  };

  let category = 'Lainnya';
  for (const [cat, kws] of Object.entries(keywords)) {
    if (kws.some(k => lowerText.includes(k))) {
      category = cat;
      break;
    }
  }

  const typeEmoji = isIncome ? '📈' : '📉';
  const date = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long' });

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: `✅ *Transaksi Dicatat!*

━━━━━━━━━━━━━━━
${typeEmoji} ${isIncome ? 'Pemasukan' : 'Pengeluaran'}
🏷️ ${category}
💰 ${formatCurrency(amount)}
📅 ${date}
━━━━━━━━━━━━━━━
_Equilibria Finance_`,
      parse_mode: 'Markdown'
    })
  });
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    bot: process.env.TELEGRAM_BOT_TOKEN ? 'ready' : 'missing_token',
  });
}