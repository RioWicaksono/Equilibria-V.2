import { NextResponse } from 'next/server';
import { getFinanceService } from '@/application/services/FinanceService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const financeService = getFinanceService();
    const transactions = await financeService.getTransactions();

    return NextResponse.json({
      success: true,
      transactions,
      count: transactions.length,
    });
  } catch (error) {
    console.error('Telegram API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
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
      await financeService.addTransaction(
        parsed.amount,
        parsed.type,
        parsed.category,
        parsed.description,
        new Date().toISOString()
      );

      return NextResponse.json({
        success: true,
        message: `Transaksi berhasil dicatat: ${parsed.type} ${parsed.category} Rp${parsed.amount.toLocaleString('id-ID')}`,
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Format tidak dikenali. Gunakan format: [tipe] [kategori/deskripsi] [nominal]',
    });
  } catch (error) {
    console.error('Telegram POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

function parseTelegramMessage(message: string): { type: 'INCOME' | 'EXPENSE'; amount: number; category: string; description: string } | null {
  const text = message.toLowerCase().trim();

  // Pattern: [tipe] [deskripsi] [nominal]
  const incomePatterns = [/^(pemasukan|income)\s+(.+?)\s+(\d+)$/i, /^(masuk)\s+(.+?)\s+(\d+)$/i];
  const expensePatterns = [/^(pengeluaran|expense)\s+(.+?)\s+(\d+)$/i, /^(keluar)\s+(.+?)\s+(\d+)$/i];

  for (const pattern of incomePatterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        type: 'INCOME',
        amount: parseInt(match[3], 10),
        category: match[2].trim(),
        description: match[2].trim(),
      };
    }
  }

  for (const pattern of expensePatterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        type: 'EXPENSE',
        amount: parseInt(match[3], 10),
        category: match[2].trim(),
        description: match[2].trim(),
      };
    }
  }

  return null;
}
