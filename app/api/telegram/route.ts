import { NextRequest, NextResponse } from 'next/server';
import { getFinanceService } from '@/application/services/FinanceService';
import { getPrismaAsync } from '@/infrastructure/database/PrismaClient';

export const dynamic = 'force-dynamic';

/**
 * Validate Telegram webhook signature
 * In production, you should verify the Telegram initData
 */
function validateTelegramRequest(req: NextRequest): { valid: boolean; chatId?: string } {
  // Check for Telegram Bot API token
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.warn('[Telegram] No bot token configured');
    return { valid: false };
  }

  // Get chat_id from request body or headers
  const chatId = req.headers.get('x-telegram-chat-id');

  // For webhook setup from Telegram, validate the secret token
  const secretToken = req.headers.get('x-telegram-bot-api-secret-token');
  if (secretToken !== botToken.split(':')[0]) {
    // In development, allow without validation
    if (process.env.NODE_ENV !== 'production') {
      return { valid: true, chatId: chatId || 'dev-user' };
    }
    return { valid: false };
  }

  return { valid: true, chatId: chatId || 'unknown' };
}

/**
 * Associate transactions with a user identifier (chat_id)
 * Currently stores in description, but can be extended with proper user model
 */
async function linkTransactionToUser(
  transactionId: string,
  chatId: string,
  message: string
): Promise<void> {
  const prisma = await getPrismaAsync();

  // Update transaction with Telegram metadata
  // In future, this should link to a proper user model
  await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      description: `[TG:${chatId}] ${message}`,
    },
  });
}

export async function GET(req: NextRequest) {
  // Validate request
  const validation = validateTelegramRequest(req);
  if (!validation.valid) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const financeService = getFinanceService();
    const transactions = await financeService.getTransactions();

    return NextResponse.json({
      success: true,
      transactions,
      count: transactions.length,
      userId: validation.chatId,
    });
  } catch (error) {
    console.error('Telegram API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Validate request
  const validation = validateTelegramRequest(req);
  if (!validation.valid) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Parse message for transaction commands
    const parsed = parseTelegramMessage(message);

    if (parsed) {
      const financeService = getFinanceService();
      const transaction = await financeService.addTransaction(
        parsed.amount,
        parsed.type,
        parsed.category,
        parsed.description,
        new Date().toISOString()
      );

      // Link transaction to Telegram user
      if (transaction.id && validation.chatId) {
        await linkTransactionToUser(transaction.id, validation.chatId, message);
      }

      const typeLabel = parsed.type === 'INCOME' ? '💰 Masuk' : '💸 Keluar';

      return NextResponse.json({
        success: true,
        message: `${typeLabel}\nKategori: ${parsed.category}\nJumlah: Rp${parsed.amount.toLocaleString('id-ID')}\n\n✅ Tersimpan!`,
      });
    }

    return NextResponse.json({
      success: false,
      message: `Format tidak dikenali.\n\nContoh:\n• masuk gaji 5000000\n• keluar makan 150000\n• expense transportasi 50000`,
    });
  } catch (error) {
    console.error('Telegram POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

/**
 * Parse Telegram message for transaction commands
 * Supported formats:
 * - [tipe] [kategori] [nominal]
 * - masuk/gaji/masukan [kategori] [nominal]
 * - keluar/makan/belanja [kategori] [nominal]
 * - expense/income [kategori] [nominal]
 */
function parseTelegramMessage(
  message: string
): { type: 'INCOME' | 'EXPENSE'; amount: number; category: string; description: string } | null {
  const text = message.toLowerCase().trim();

  // Income patterns
  const incomeKeywords = ['masuk', 'masukan', 'income', 'pemasukan', '+'];
  const expenseKeywords = ['keluar', 'pengeluaran', 'expense', 'pengeluaran', '-'];

  // Try to detect type
  let type: 'INCOME' | 'EXPENSE' | null = null;
  let remainingText = text;

  for (const keyword of incomeKeywords) {
    if (text.startsWith(keyword)) {
      type = 'INCOME';
      remainingText = text.slice(keyword.length).trim();
      break;
    }
  }

  if (!type) {
    for (const keyword of expenseKeywords) {
      if (text.startsWith(keyword)) {
        type = 'EXPENSE';
        remainingText = text.slice(keyword.length).trim();
        break;
      }
    }
  }

  // Default to expense if no type detected
  if (!type) {
    type = 'EXPENSE';
    remainingText = text;
  }

  // Extract amount (last number in the text)
  const amountMatch = remainingText.match(/(\d{1,15})/);
  if (!amountMatch) {
    return null;
  }

  const amount = parseInt(amountMatch[1], 10);
  if (amount <= 0 || amount > 999999999999999) {
    return null;
  }

  // Everything before the amount is the category/description
  const amountIndex = remainingText.indexOf(amountMatch[1]);
  const categoryPart = remainingText.slice(0, amountIndex).trim();

  // Clean up category
  const category = categoryPart
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 3)
    .join(' ')
    .substring(0, 50) || (type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran');

  return {
    type,
    amount,
    category,
    description: `${category} - via Telegram`,
  };
}
