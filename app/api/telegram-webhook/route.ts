import { NextRequest, NextResponse } from 'next/server';

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Validate secret token for cron/service routes
 */
function validateCronSecret(request: NextRequest): boolean {
  if (!CRON_SECRET) {
    // If no secret configured, allow only in non-production
    return process.env.NODE_ENV !== 'production';
  }

  const headerSecret = request.headers.get('x-cron-secret');
  return headerSecret === CRON_SECRET;
}

export async function POST(req: NextRequest) {
  // Validate cron secret
  if (!validateCronSecret(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

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

    const sendMsg = async (msg: string) => {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          reply_to_message_id: messageId,
          text: msg,
          parse_mode: 'Markdown',
        })
      });
    };

    // /start
    if (command === '/start' || command === '/menu') {
      await sendMsg(`👋 Halo ${firstName}!

Selamat datang di Equilibria Finance 💰

Ketik /help untuk panduan lengkap.`);
      return NextResponse.json({ ok: true });
    }

    // /help
    if (command === '/help' || command === '/panduan') {
      await sendMsg(`📚 Panduan

━━━━━━━━━━━━━━━
INPUT TRANSAKSI
━━━━━━━━━━━━━━━

Ketik langsung (tanpa slash):
pengeluaran makan 50000
pemasukan salary 5000000

━━━━━━━━━━━━━━━
KATEGORI OTOMATIS
━━━━━━━━━━━━━━━
Aku deteksi kategori dari kata:

🍔 Makanan → makan, kopi, lunch
🚗 Transport → ojek, grab, bensin
🛒 Belanja → indomaret, alfamart
🎬 Hiburan → film, netflix, game
💊 Kesehatan → obat, apotek
💵 Gaji → salary, bonus, thr
━━━━━━━━━━━━━━━
Equilibria Finance`);
      return NextResponse.json({ ok: true });
    }

    // /balance
    if (command === '/balance' || command === '/saldo') {
      await sendMsg(`💰 Saldo

━━━━━━━━━━━━━━━
Buka aplikasi lengkap:
https://equilibria-fiscal.vercel.app
━━━━━━━━━━━━━━━
Equilibria Finance`);
      return NextResponse.json({ ok: true });
    }

    // /budget
    if (command === '/budget' || command === '/anggaran') {
      await sendMsg(`📊 Budget

━━━━━━━━━━━━━━━
Atur budget di app:
https://equilibria-fiscal.vercel.app/budgets
━━━━━━━━━━━━━━━
Equilibria Finance`);
      return NextResponse.json({ ok: true });
    }

    // /list
    if (command === '/list' || command === '/riwayat') {
      await sendMsg(`📝 Riwayat

━━━━━━━━━━━━━━━
Lihat transaksi:
https://equilibria-fiscal.vercel.app/transactions
━━━━━━━━━━━━━━━
Equilibria Finance`);
      return NextResponse.json({ ok: true });
    }

    // Parse transaction
    const transactionText = (command === '/add' || command === '/tambah') ? args : text;

    if (!transactionText || transactionText.trim() === '') {
      await sendMsg(`📝 Format: /add makanan 50000\n\nContoh: /add Bens.in 50000`);
      return NextResponse.json({ ok: true });
    }

    // Parse and save
    const lower = transactionText.toLowerCase();
    const isIncome = lower.includes('pemasukan') || lower.includes('income') || lower.includes('masuk');
    const type = isIncome ? 'INCOME' : 'EXPENSE';

    // Extract amount
    const amountMatch = transactionText.match(/\d+/g);
    if (!amountMatch) {
      await sendMsg(`⚠️ Format: /add makanan 50000\n\nKetik nominal angka.`);
      return NextResponse.json({ ok: true });
    }

    const amount = parseInt(amountMatch[amountMatch.length - 1]);
    if (amount < 100) {
      await sendMsg(`⚠️ Minimal Rp 100`);
      return NextResponse.json({ ok: true });
    }

    // Auto-detect category
    const keywords: Record<string, string[]> = {
      'Makanan': ['makan', 'lunch', 'dinner', 'kopi', 'teh', 'nasi', 'bakso', 'soto', 'ayam', 'mie', 'gorengan', 'sate', 'rujak', 'es', 'juice', 'smoothie', 'jajan', 'camilan'],
      'Transport': ['transport', 'bensin', 'parkir', 'ojek', 'grab', 'gojek', 'taxi', 'angkot', 'bus', 'kereta', 'tol'],
      'Belanja': ['belanja', 'market', 'indomaret', 'alfamart', 'carrefour', 'alfamidi', 'hypermart', 'grosir'],
      'Hiburan': ['film', 'nonton', 'bioskop', 'game', 'netflix', 'spotify', 'youtube', 'konser', 'tiket', 'theme park'],
      'Tagihan': ['listrik', 'air', 'internet', 'pulsa', 'wifi', 'bpjs', 'pdam', 'gas', 'token', 'langganan'],
      'Kesehatan': ['obat', 'dokter', 'apotek', 'klinik', 'rs', 'rumah sakit', 'medical', 'vitamin', 'herbal'],
      'Gaji': ['gaji', 'salary', 'thr', 'bonus', 'tunjangan', 'lembur', 'komisi'],
      'Freelance': ['freelance', 'project', 'order', 'kontrak', 'honor', 'fee'],
      'Investasi': ['investasi', 'saham', 'reksa', 'crypto', 'trading', 'obligasi', 'deposito'],
      'Fashion': ['baju', 'sepatu', 'tas', 'celana', 'sandal', 'jacket', 'hoodie'],
      'Travel': ['travel', 'hotel', 'tiket pesawat', 'kereta', 'bali', 'liburan', 'penerbangan'],
      'Pendidikan': ['buku', 'kursus', 'les', 'sekolah', 'kuliah', 'seminar', 'pelatihan'],
      'Olahraga': ['gym', 'fitness', 'yoga', 'renang', 'badminton', 'basket', 'futsal'],
    };

    let category = 'Lainnya';
    for (const [cat, kws] of Object.entries(keywords)) {
      if (kws.some(k => lower.includes(k))) {
        category = cat;
        break;
      }
    }

    // Save to database
    const dateStr = new Date().toISOString().split('T')[0];
    const description = transactionText.replace(/\d+/g, '').trim() || category;

    try {
      const formData = new URLSearchParams();
      formData.append('type', type);
      formData.append('amount', amount.toString());
      formData.append('category', category);
      formData.append('description', description);
      formData.append('date', dateStr);

      // Use APP_URL - must be configured in production
      const baseUrl = process.env.APP_URL;
      if (!baseUrl) {
        console.error('[Telegram] APP_URL not configured');
        await sendMsg('⚠️ Konfigurasi server tidak lengkap. Hubungi admin.');
        return NextResponse.json({ ok: false, error: 'Server misconfiguration' }, { status: 500 });
      }

      const response = await fetch(`${baseUrl}/api/transactions`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (e) {
      console.error('Failed to save:', e);
    }

    // Send confirmation
    const emoji = isIncome ? '📈' : '📉';
    const displayDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long' });
    await sendMsg(`✅ Tersimpan!

━━━━━━━━━━━━━━━
${emoji} ${isIncome ? 'Pemasukan' : 'Pengeluaran'}
🏷️ ${category}
💰 Rp ${amount.toLocaleString('id-ID')}
📅 ${displayDate}
━━━━━━━━━━━━━━━
Equilibria Finance`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const isTest = req.nextUrl.searchParams.get('test') === 'true';

  // Test endpoint doesn't need auth, but status check does
  if (!isTest && !validateCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check bot health
  let botStatus = 'NOT_CONFIGURED';
  let errorMessage = '';

  if (token) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const data = await res.json();
      botStatus = data.ok ? 'CONNECTED' : 'DISCONNECTED';
      if (!data.ok && data.description) {
        errorMessage = data.description;
      }
    } catch (e) {
      botStatus = 'ERROR';
      errorMessage = e instanceof Error ? e.message : 'Network error';
    }
  } else {
    errorMessage = 'Telegram bot token not configured. Set TELEGRAM_BOT_TOKEN in environment variables.';
  }

  // If test mode, return detailed response
  if (isTest) {
    return NextResponse.json({
      success: botStatus === 'CONNECTED',
      bot: botStatus,
      status: botStatus === 'CONNECTED' ? 'ACTIVE' : 'INACTIVE',
      message: botStatus === 'CONNECTED' ? 'Bot is connected and ready!' : errorMessage,
      error: botStatus !== 'CONNECTED' ? errorMessage : undefined,
    });
  }

  return NextResponse.json({
    status: 'ok',
    bot: botStatus,
    telegram: botStatus,
    message: botStatus === 'CONNECTED' ? 'Bot connected' : errorMessage,
    error: botStatus !== 'CONNECTED' ? errorMessage : undefined,
  });
}
