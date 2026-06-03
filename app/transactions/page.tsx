import { FinanceService } from '@/src/application/use-cases/FinanceService';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import ExportButton from './ExportButton';
import ClientTransactionList from './ClientTransactionList';
import TransactionModal from './TransactionModal';

export const dynamic = 'force-dynamic';

export default async function TransactionsPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  await headers();
  const allTransactions = await FinanceService.getTransactions();
  
  // Apply logic to show only today by default
  const requestedDate = typeof searchParams?.date === 'string' ? searchParams.date : new Date().toISOString().split('T')[0];
  
  const transactions = allTransactions.filter(t => {
    // API returns local timezone string or iso string. Let's match YYYY-MM-DD
    const tDate = new Date(t.date).toISOString().split('T')[0];
    return tDate === requestedDate;
  });

  async function deleteTransaction(id: string) {
    'use server';
    await FinanceService.deleteTransaction(id);
    revalidatePath('/transactions');
    revalidatePath('/');
    revalidatePath('/summary');
  }

  return (
    <div className="space-y-8">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Transaksi Hari Ini</h2>
          <p className="text-sm text-zinc-500 mt-1">Catat dan kelola riwayat harian Anda.</p>
        </div>
        <div className="flex gap-2">
           <ExportButton />
           <TransactionModal />
        </div>
      </header>

      <div className="bg-[#141414] border border-[#262626] rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white">Riwayat ({new Date(requestedDate).toLocaleDateString('id-ID')})</h3>
        </div>
        
        <ClientTransactionList 
          initialTransactions={transactions}
          onDelete={deleteTransaction}
        />
      </div>
    </div>
  );
}
