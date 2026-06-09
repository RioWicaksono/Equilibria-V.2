import * as XLSX from 'xlsx';

interface ExportData {
  transactions?: Array<{
    id: string;
    amount: number;
    type: string;
    category: string;
    description?: string;
    date: string;
  }>;
  wallets?: Array<{
    id: string;
    name: string;
    balance: number;
    currency: string;
    description?: string;
  }>;
  goals?: Array<{
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: string;
    description?: string;
  }>;
  debts?: Array<{
    id: string;
    name: string;
    amount: number;
    type: string;
    status: string;
    description?: string;
  }>;
  recurring?: Array<{
    id: string;
    name: string;
    amount: number;
    frequency: string;
    description?: string;
  }>;
}

export const exportToCSV = (data: ExportData, type: string): string => {
  const rows: string[] = [];

  if (type === 'all' || type === 'transactions') {
    rows.push('=== TRANSAKSI ===');
    if (data.transactions?.length) {
      rows.push('ID,Tanggal,Jenis,Kategori,Jumlah,Deskripsi');
      data.transactions.forEach(t => {
        rows.push(`${t.id},${t.date},${t.type},${t.category},${t.amount},${t.description || ''}`);
      });
    } else {
      rows.push('Tidak ada data');
    }
    rows.push('');
  }

  if (type === 'all' || type === 'wallets') {
    rows.push('=== DOMPET ===');
    if (data.wallets?.length) {
      rows.push('ID,Nama,Saldo,Mata Uang,Deskripsi');
      data.wallets.forEach(w => {
        rows.push(`${w.id},${w.name},${w.balance},${w.currency},${w.description || ''}`);
      });
    } else {
      rows.push('Tidak ada data');
    }
    rows.push('');
  }

  if (type === 'all' || type === 'goals') {
    rows.push('=== TARGET TABUNGAN ===');
    if (data.goals?.length) {
      rows.push('ID,Nama,Target,Terkumpul,Jatuh Tempo,Deskripsi');
      data.goals.forEach(g => {
        rows.push(`${g.id},${g.name},${g.targetAmount},${g.currentAmount},${g.deadline},${g.description || ''}`);
      });
    } else {
      rows.push('Tidak ada data');
    }
    rows.push('');
  }

  if (type === 'all' || type === 'debts') {
    rows.push('=== HUTANG/PiUTANG ===');
    if (data.debts?.length) {
      rows.push('ID,Nama,Jumlah,Tipe,Status,Deskripsi');
      data.debts.forEach(d => {
        rows.push(`${d.id},${d.name},${d.amount},${d.type},${d.status},${d.description || ''}`);
      });
    } else {
      rows.push('Tidak ada data');
    }
    rows.push('');
  }

  if (type === 'all' || type === 'recurring') {
    rows.push('=== TRANSAKSI OTOMATIS ===');
    if (data.recurring?.length) {
      rows.push('ID,Nama,Jumlah,Frekuensi,Deskripsi');
      data.recurring.forEach(r => {
        rows.push(`${r.id},${r.name},${r.amount},${r.frequency},${r.description || ''}`);
      });
    } else {
      rows.push('Tidak ada data');
    }
  }

  return rows.join('\n');
};

export const exportToXLSX = (data: ExportData, type: string): Uint8Array => {
  const workbook = XLSX.utils.book_new();
  let hasData = false;

  if (type === 'all' || type === 'transactions') {
    if (data.transactions?.length) {
      const ws = XLSX.utils.json_to_sheet(data.transactions.map(t => ({
        'ID': t.id,
        'Tanggal': t.date,
        'Jenis': t.type,
        'Kategori': t.category,
        'Jumlah': t.amount,
        'Deskripsi': t.description || '',
      })));
      XLSX.utils.book_append_sheet(workbook, ws, 'Transaksi');
      hasData = true;
    }
  }

  if (type === 'all' || type === 'wallets') {
    if (data.wallets?.length) {
      const ws = XLSX.utils.json_to_sheet(data.wallets.map(w => ({
        'ID': w.id,
        'Nama': w.name,
        'Saldo': w.balance,
        'Mata Uang': w.currency,
        'Deskripsi': w.description || '',
      })));
      XLSX.utils.book_append_sheet(workbook, ws, 'Dompet');
      hasData = true;
    }
  }

  if (type === 'all' || type === 'goals') {
    if (data.goals?.length) {
      const ws = XLSX.utils.json_to_sheet(data.goals.map(g => ({
        'ID': g.id,
        'Nama': g.name,
        'Target': g.targetAmount,
        'Terkumpul': g.currentAmount,
        'Jatuh Tempo': g.deadline,
        'Deskripsi': g.description || '',
      })));
      XLSX.utils.book_append_sheet(workbook, ws, 'Target');
      hasData = true;
    }
  }

  if (type === 'all' || type === 'debts') {
    if (data.debts?.length) {
      const ws = XLSX.utils.json_to_sheet(data.debts.map(d => ({
        'ID': d.id,
        'Nama': d.name,
        'Jumlah': d.amount,
        'Tipe': d.type,
        'Status': d.status,
        'Deskripsi': d.description || '',
      })));
      XLSX.utils.book_append_sheet(workbook, ws, 'HutangPiutang');
      hasData = true;
    }
  }

  if (type === 'all' || type === 'recurring') {
    if (data.recurring?.length) {
      const ws = XLSX.utils.json_to_sheet(data.recurring.map(r => ({
        'ID': r.id,
        'Nama': r.name,
        'Jumlah': r.amount,
        'Frekuensi': r.frequency,
        'Deskripsi': r.description || '',
      })));
      XLSX.utils.book_append_sheet(workbook, ws, 'Otomatis');
      hasData = true;
    }
  }

  // If no data, add a placeholder sheet
  if (!hasData) {
    const ws = XLSX.utils.json_to_sheet([{ 'Info': 'Tidak ada data untuk diexport' }]);
    XLSX.utils.book_append_sheet(workbook, ws, 'Data');
  }

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(buffer);
};

export const exportToJSON = (data: ExportData): string => {
  return JSON.stringify(data, null, 2);
};

export const getExportFilename = (type: string, format: string): string => {
  const timestamp = new Date().toISOString().split('T')[0];
  return `equilibria_${type}_${timestamp}.${format}`;
};