import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'Equilibria Finance API',
      version: '1.0.0',
      description: 'API untuk aplikasi pencatatan keuangan pribadi Equilibria',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'Transactions', description: 'Operasi transaksi keuangan' },
      { name: 'Wallets', description: 'Operasi dompet/multi-currency' },
      { name: 'Goals', description: 'Operasi target tabungan' },
      { name: 'Debts', description: 'Operasi hutang/piutang' },
      { name: 'Recurring', description: 'Operasi jadwal otomatis' },
      { name: 'Budgets', description: 'Operasi anggaran' },
      { name: 'Reminders', description: 'Operasi pengingat' },
      { name: 'Telegram', description: 'Integrasi Telegram Bot' },
      { name: 'Export', description: 'Export data' },
    ],
    components: {
      schemas: {
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'txn_123' },
            amount: { type: 'number', example: 150000 },
            type: { type: 'string', enum: ['INCOME', 'EXPENSE'], example: 'INCOME' },
            category: { type: 'string', example: 'Gaji Utama' },
            description: { type: 'string', example: 'Gaji bulanan Juni 2026' },
            date: { type: 'string', format: 'date-time', example: '2026-06-08T00:00:00Z' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Wallet: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'wlt_123' },
            name: { type: 'string', example: 'BCA Utama' },
            balance: { type: 'number', example: 5000000 },
            currency: { type: 'string', enum: ['IDR', 'USD', 'EUR'], example: 'IDR' },
            description: { type: 'string', example: 'Rekening utama untuk transaksi harian' },
          },
        },
        Goal: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'gl_123' },
            name: { type: 'string', example: 'Dana Darurat' },
            targetAmount: { type: 'number', example: 20000000 },
            currentAmount: { type: 'number', example: 5000000 },
            deadline: { type: 'string', format: 'date', example: '2026-12-31' },
            description: { type: 'string', example: 'Dana cadangan untuk keadaan darurat' },
          },
        },
        Debt: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'dbt_123' },
            name: { type: 'string', example: 'Pinjam ke Budi' },
            amount: { type: 'number', example: 500000 },
            paidAmount: { type: 'number', example: 0 },
            type: { type: 'string', enum: ['DEBT', 'LOAN'], example: 'DEBT' },
            status: { type: 'string', enum: ['UNPAID', 'PAID'], example: 'UNPAID' },
            description: { type: 'string', example: 'Pinjam untuk modal usaha' },
            loanDate: { type: 'string', format: 'date', example: '2026-06-01' },
            dueDate: { type: 'string', format: 'date', example: '2026-07-01' },
          },
        },
        Recurring: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'rcr_123' },
            name: { type: 'string', example: 'Langganan Netflix' },
            amount: { type: 'number', example: 153000 },
            frequency: { type: 'string', enum: ['HARIAN', 'MINGGUAN', 'BULANAN', 'TAHUNAN'], example: 'BULANAN' },
            nextDate: { type: 'string', format: 'date', example: '2026-06-15' },
            description: { type: 'string', example: 'Hiburan streaming movie dan series' },
          },
        },
        Reminder: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'rmd_123' },
            title: { type: 'string', example: 'Bayar Listrik' },
            date: { type: 'string', format: 'date', example: '2026-06-10' },
            time: { type: 'string', example: '09:00' },
            amount: { type: 'number', example: 250000 },
            priority: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'], example: 'HIGH' },
            status: { type: 'string', enum: ['PENDING', 'COMPLETED'], example: 'PENDING' },
            description: { type: 'string', example: 'Pembayaran listrik bulan Juni' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Terjadi kesalahan' },
            code: { type: 'string', example: 'VALIDATION_ERROR' },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [],
  },
  apis: ['./app/api/**/route.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);