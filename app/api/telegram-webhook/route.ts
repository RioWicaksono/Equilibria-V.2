import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      return NextResponse.json({ ok: false, error: 'Bot not configured' }, { status: 500 });
    }

    if (!body.message || !body.message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = body.message.chat.id;
    const messageId = body.message.message_id;
    const text = body.message.text.trim();
    const firstName = body.message.chat.first_name || 'User';
    const command = text.split(' ')[0].toLowerCase();
    const args = text.split(' ').slice(1).join(' ');

    const replyOptions = {
      chat_id: chatId,
      reply_to_message_id: messageId,
      parse_mode: 'Markdown' as const,
    };

    const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

    const sendMsg = async (msg: string) => {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...replyOptions, text: msg })
      });
    };

    // Command handlers
    if (command === '/start' || command === '/menu') {
      await sendMsg(`👋 Halo ${firstName}!

Bot Equilibria Finance 💰

Ketik /help untuk panduan.
━━━━━━━━━━━━━━━━━━━`);
      return NextResponse.json({ ok: true });
    }

    if (command === '/help' || command === '/panduan') {
      await sendMsg(`📚 *Panduan*

━━━━━━━━━━━━━━━━━━━
Format: [deskripsi] [nominal]

Contoh:
pengeluaran makan 50000
pemasukan gaji 5000000
━━━━━━━━━━━━━━━━━━━
_Equilibria Finance_`);
      return NextResponse.json({ ok: true });
    }

    if (command === '/balance' || command === '/saldo') {
      await sendMsg(`💰 *Saldo*

━━━━━━━━━━━━━━━━━━━
Buka app:
https://equilibria-fiscal.vercel.app
━━━━━━━━━━━━━━━━━━━
_Equilibria Finance_`);
      return NextResponse.json({ ok: true });
    }

    if (command === '/budget' || command === '/anggaran') {
      await sendMsg(`📊 *Budget*

━━━━━━━━━━━━━━━━━━━
Atur budget:
https://equilibria-fiscal.vercel.app/budgets
━━━━━━━━━━━━━━━━━━━
_Equilibria Finance_`);
      return NextResponse.json({ ok: true });
    }

    if (command === '/list' || command === '/riwayat') {
      await sendMsg(`📝 *Riwayat*

━━━━━━━━━━━━━━━━━━━
Lihat transaksi:
https://equilibria-fiscal.vercel.app/transactions
━━━━━━━━━━━━━━━━━━━
_Equilibria Finance_`);
      return NextResponse.json({ ok: true });
    }

    if (command === '/add' || command === '/tambah') {
      if (!args) {
        await sendMsg(`📝 *Format:*
━━━━━━━━━━━━━━━━━━━
/add makanan 50000
━━━━━━━━━━━━━━━━━━━
_Equilibria Finance_`);
        return NextResponse.json({ ok: true });
      }
      await parseTransaction(token, chatId, messageId, args, formatCurrency);
      return NextResponse.json({ ok: true });
    }

    // Quick transaction (no slash)
    await parseTransaction(token, chatId, messageId, text, formatCurrency);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

async function parseTransaction(token: string, chatId: number, replyId: number, text: string, formatCurrency: (n: number) => string) {
  const lower = text.toLowerCase();
  const isIncome = lower.includes('pemasukan') || lower.includes('income') || lower.includes('masuk');

  const amountMatch = text.match(/\d+/g);
  if (!amountMatch) {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, reply_to_message_id: replyId, text: '⚠️ Ketik nominal angka.\n\nContoh: pengeluaran makan 50000' })
    });
    return;
  }

  const amount = parseInt(amountMatch[amountMatch.length - 1]);
  if (amount < 100) {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, reply_to_message_id: replyId, text: '⚠️ Minimal Rp 100' })
    });
    return;
  }

  // Auto category
  const categories: [string, string[]][] = [
    ['🍔 Makanan', ['makan', 'lunch', 'dinner', 'kopi', 'teh', 'nasi', 'mie', 'ayam', 'soto', 'bakso']],
    ['🚗 Transport', ['transport', 'bensin', 'parkir', 'ojek', 'grab', 'gojek', 'taxi']],
    ['🛒 Belanja', ['belanja', 'market', 'indomaret', 'alfamart', 'carrefour']],
    ['🎬 Hiburan', ['film', 'nonton', 'game', 'netflix', 'spotify', 'youtube']],
    ['📄 Tagihan', ['listrik', 'air', 'internet', 'pulsa', 'wifi', 'bpjs']],
    ['💊 Kesehatan', ['obat', 'dokter', 'apotek', 'klinik']],
    ['💵 Gaji', ['gaji', 'salary', 'thr', 'bonus']],
    ['💻 Freelance', ['freelance', 'project', 'kerjaan', 'order']],
    ['📈 Investasi', ['investasi', 'saham', 'reksa', 'crypto', 'trading']],
    ['🏠 Rumah', ['kontrak', 'sewa', 'furniture']],
    ['👕 Fashion', ['baju', 'sepatu', 'celana', 'tas']],
    ['✈️ Travel', ['travel', 'hotel', 'tiket', 'pesawat', 'liburan']],
    ['📚 Pendidikan', ['buku', 'kursus', 'les', 'sekolah', 'kuliah']],
  ];

  let category = '💰 Lainnya';
  for (const [cat, keywords] of categories) {
    if (keywords.some(k => lower.includes(k))) { category = cat; break; }
  }

  const emoji = isIncome ? '📈' : '📉';
  const type = isIncome ? 'Pemasukan' : 'Pengeluaran';
  const date = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      reply_to_message_id: replyId,
      text: `✅ *Tercatat!*

${emoji} *${type}*
${category}
━━━━━━━━━━━━━━━━━━━
💰 *${formatCurrency(amount)}*
📅 ${date}
━━━━━━━━━━━━━━━━━━━
_Equilibria Finance_`,
      parse_mode: 'Markdown'
    })
  });
}

export async function GET() {
  return NextResponse.json({ status: 'ok', bot: process.env.TELEGRAM_BOT_TOKEN ? 'ready' : 'missing_token' });
}