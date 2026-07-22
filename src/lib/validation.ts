import { z } from 'zod';

// Transaction validation schemas
export const TransactionTypeSchema = z.enum(['INCOME', 'EXPENSE']);

export const CreateTransactionSchema = z.object({
  amount: z.number().positive('Jumlah harus lebih dari 0').finite('Jumlah tidak valid'),
  type: TransactionTypeSchema,
  category: z.string().min(1, 'Kategori wajib diisi').max(100, 'Kategori maksimal 100 karakter'),
  description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional(),
  date: z.string().refine(val => !isNaN(Date.parse(val)), 'Format tanggal tidak valid'),
  walletId: z.string().optional(),
});

export const UpdateTransactionSchema = CreateTransactionSchema.partial().extend({
  id: z.string().min(1, 'ID transaksi wajib ada'),
});

// Wallet validation schemas
export const CurrencySchema = z.enum(['IDR', 'USD', 'EUR', 'SGD', 'MYR', 'JPY']);

export const CreateWalletSchema = z.object({
  name: z.string().min(1, 'Nama dompet wajib diisi').max(50, 'Nama maksimal 50 karakter'),
  balance: z.number().finite('Saldo tidak valid').default(0),
  currency: CurrencySchema.default('IDR'),
  description: z.string().max(200, 'Deskripsi maksimal 200 karakter').optional(),
});

export const UpdateWalletSchema = CreateWalletSchema.partial().extend({
  id: z.string().min(1, 'ID dompet wajib ada'),
});

// Goal validation schemas
export const CreateGoalSchema = z.object({
  name: z.string().min(1, 'Nama target wajib diisi').max(100, 'Nama maksimal 100 karakter'),
  targetAmount: z.number().positive('Target harus lebih dari 0').finite('Target tidak valid'),
  currentAmount: z.number().min(0).finite('Saldo tidak valid').default(0),
  deadline: z.string().refine(val => !isNaN(Date.parse(val)), 'Format tanggal tidak valid'),
  description: z.string().max(300, 'Deskripsi maksimal 300 karakter').optional(),
});

export const UpdateGoalSchema = CreateGoalSchema.partial().extend({
  id: z.string().min(1, 'ID target wajib ada'),
});

// Debt validation schemas
export const DebtTypeSchema = z.enum(['DEBT', 'LOAN']);
export const DebtStatusSchema = z.enum(['UNPAID', 'PAID']);

export const CreateDebtSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(100, 'Nama maksimal 100 karakter'),
  amount: z.number().positive('Jumlah harus lebih dari 0').finite('Jumlah tidak valid'),
  type: DebtTypeSchema,
  description: z.string().max(300, 'Deskripsi maksimal 300 karakter').optional(),
  loanDate: z.string().refine(val => !isNaN(Date.parse(val)), 'Format tanggal peminjaman tidak valid').optional().or(z.literal('')),
  dueDate: z.string().refine(val => !isNaN(Date.parse(val)), 'Format tanggal jatuh tempo tidak valid').optional().or(z.literal('')),
});

export const UpdateDebtSchema = CreateDebtSchema.partial().extend({
  id: z.string().min(1, 'ID wajib ada'),
  paidAmount: z.number().min(0).optional(),
  status: DebtStatusSchema.optional(),
});

// Recurring validation schemas
export const FrequencySchema = z.enum(['HARIAN', 'MINGGUAN', 'BULANAN', 'TAHUNAN', 'Harian', 'Mingguan', 'Bulanan', 'Tahunan']);

export const CreateRecurringSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi').max(100, 'Nama maksimal 100 karakter'),
  amount: z.number().positive('Jumlah harus lebih dari 0').finite('Jumlah tidak valid'),
  frequency: FrequencySchema,
  nextDate: z.string().refine(val => !isNaN(Date.parse(val)), 'Format tanggal tidak valid'),
  description: z.string().max(300, 'Deskripsi maksimal 300 karakter').optional(),
});

export const UpdateRecurringSchema = CreateRecurringSchema.partial().extend({
  id: z.string().min(1, 'ID wajib ada'),
});

// Budget validation schemas
export const CreateBudgetSchema = z.object({
  category: z.string().min(1, 'Kategori wajib diisi').max(100, 'Kategori maksimal 100 karakter'),
  limit: z.number().positive('Limit harus lebih dari 0').finite('Limit tidak valid'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Format bulan harus YYYY-MM'),
  year: z.number().int().min(2020).max(2100).optional(),
});

export const UpdateBudgetSchema = CreateBudgetSchema.partial().extend({
  id: z.string().min(1, 'ID budget wajib ada'),
});

// Reminder validation schemas
export const PrioritySchema = z.enum(['HIGH', 'MEDIUM', 'LOW']);
export const ReminderStatusSchema = z.enum(['PENDING', 'COMPLETED']);

export const CreateReminderSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi').max(200, 'Judul maksimal 200 karakter'),
  date: z.string().refine(val => !isNaN(Date.parse(val)), 'Format tanggal tidak valid'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Format waktu harus HH:mm').optional(),
  amount: z.number().min(0).finite().optional(),
  priority: PrioritySchema.default('MEDIUM'),
  status: ReminderStatusSchema.default('PENDING'),
  description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional(),
});

export const UpdateReminderSchema = CreateReminderSchema.partial().extend({
  id: z.string().min(1, 'ID reminder wajib ada'),
});

// Telegram validation
export const TelegramTokenSchema = z.object({
  token: z.string().regex(/^\d+:[A-Za-z0-9_-]+$/, 'Format token tidak valid'),
});

// Export query schema
export const ExportQuerySchema = z.object({
  format: z.enum(['csv', 'xlsx', 'json']).default('csv'),
  type: z.enum(['transactions', 'wallets', 'goals', 'debts', 'recurring', 'all']).default('all'),
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), 'Format tanggal tidak valid').optional(),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), 'Format tanggal tidak valid').optional(),
});

// Pagination schema
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// Settings validation schemas
const ThemeSchema = z.enum(['light', 'dark', 'auto']).default('dark');
const LanguageSchema = z.enum(['id', 'en']).default('id');
const CurrencySchema2 = z.enum(['IDR', 'USD', 'EUR', 'SGD', 'MYR', 'JPY']).default('IDR');

export const UpdateSettingsSchema = z.object({
  theme: ThemeSchema.optional(),
  language: LanguageSchema.optional(),
  currency: CurrencySchema2.optional(),
  autoLockTimeout: z.number().int().min(1).max(1440).default(5).optional(),
  telegramToken: z.string().max(200).optional(),
  isPinEnabled: z.boolean().optional(),
  pinHash: z.string().max(255).optional().nullable(),
  pinSalt: z.string().max(255).optional().nullable(),
  failedAttempts: z.number().int().min(0).max(10).optional(),
  lockoutUntil: z.string().datetime().nullable().optional(),
}).strict(); // Reject unknown keys

export const UpdateSettingsPinSchema = z.object({
  pin: z.string().min(4, 'PIN minimal 4 digit').max(8, 'PIN maksimal 8 digit').regex(/^\d+$/, 'PIN harus angka'),
}).strict();

export const VerifyPinSchema = z.object({
  pin: z.string().min(4).max(8).regex(/^\d+$/, 'PIN harus angka'),
}).strict();

// Type exports
export type CreateTransaction = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransaction = z.infer<typeof UpdateTransactionSchema>;
export type CreateWallet = z.infer<typeof CreateWalletSchema>;
export type UpdateWallet = z.infer<typeof UpdateWalletSchema>;
export type CreateGoal = z.infer<typeof CreateGoalSchema>;
export type UpdateGoal = z.infer<typeof UpdateGoalSchema>;
export type CreateDebt = z.infer<typeof CreateDebtSchema>;
export type UpdateDebt = z.infer<typeof UpdateDebtSchema>;
export type CreateRecurring = z.infer<typeof CreateRecurringSchema>;
export type UpdateRecurring = z.infer<typeof UpdateRecurringSchema>;
export type CreateBudget = z.infer<typeof CreateBudgetSchema>;
export type UpdateBudget = z.infer<typeof UpdateBudgetSchema>;
export type CreateReminder = z.infer<typeof CreateReminderSchema>;
export type UpdateReminder = z.infer<typeof UpdateReminderSchema>;
export type ExportQuery = z.infer<typeof ExportQuerySchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type UpdateSettings = z.infer<typeof UpdateSettingsSchema>;
export type UpdateSettingsPin = z.infer<typeof UpdateSettingsPinSchema>;
export type VerifyPin = z.infer<typeof VerifyPinSchema>;