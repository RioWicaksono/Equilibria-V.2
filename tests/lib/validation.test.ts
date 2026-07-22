import { describe, it, expect } from 'vitest';
import {
  CreateTransactionSchema,
  CreateWalletSchema,
  CreateGoalSchema,
  CreateDebtSchema,
  CreateRecurringSchema,
  CreateReminderSchema,
  ExportQuerySchema,
  TransactionTypeSchema,
  DebtTypeSchema,
  FrequencySchema,
  UpdateSettingsSchema,
  UpdateSettingsPinSchema,
  VerifyPinSchema,
} from '@/lib/validation';

describe('Transaction Validation', () => {
  describe('CreateTransactionSchema', () => {
    it('should validate valid transaction data', () => {
      const validData = {
        amount: 150000,
        type: 'INCOME',
        category: 'Gaji Utama',
        description: 'Gaji bulanan Juni 2026',
        date: '2026-06-08T00:00:00Z',
      };

      const result = CreateTransactionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject negative amount', () => {
      const invalidData = {
        amount: -50000,
        type: 'EXPENSE',
        category: 'Makan',
        date: '2026-06-08',
      };

      const result = CreateTransactionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid transaction type', () => {
      const invalidData = {
        amount: 100000,
        type: 'INVALID_TYPE',
        category: 'Test',
        date: '2026-06-08',
      };

      const result = CreateTransactionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty category', () => {
      const invalidData = {
        amount: 100000,
        type: 'INCOME',
        category: '',
        date: '2026-06-08',
      };

      const result = CreateTransactionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid date format', () => {
      const invalidData = {
        amount: 100000,
        type: 'INCOME',
        category: 'Test',
        date: 'invalid-date',
      };

      const result = CreateTransactionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject description over 500 characters', () => {
      const invalidData = {
        amount: 100000,
        type: 'INCOME',
        category: 'Test',
        date: '2026-06-08',
        description: 'a'.repeat(501),
      };

      const result = CreateTransactionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept transaction without optional fields', () => {
      const validData = {
        amount: 100000,
        type: 'EXPENSE',
        category: 'Transportasi',
        date: '2026-06-08',
      };

      const result = CreateTransactionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('TransactionTypeSchema', () => {
    it('should accept INCOME type', () => {
      const result = TransactionTypeSchema.safeParse('INCOME');
      expect(result.success).toBe(true);
    });

    it('should accept EXPENSE type', () => {
      const result = TransactionTypeSchema.safeParse('EXPENSE');
      expect(result.success).toBe(true);
    });

    it('should reject invalid type', () => {
      const result = TransactionTypeSchema.safeParse('INVALID');
      expect(result.success).toBe(false);
    });
  });
});

describe('Wallet Validation', () => {
  describe('CreateWalletSchema', () => {
    it('should validate valid wallet data', () => {
      const validData = {
        name: 'BCA Utama',
        balance: 5000000,
        currency: 'IDR',
        description: 'Rekening utama',
      };

      const result = CreateWalletSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const invalidData = {
        name: '',
        balance: 1000000,
        currency: 'IDR',
      };

      const result = CreateWalletSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject name over 50 characters', () => {
      const invalidData = {
        name: 'a'.repeat(51),
        balance: 1000000,
        currency: 'IDR',
      };

      const result = CreateWalletSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept valid currency codes', () => {
      const currencies = ['IDR', 'USD', 'EUR', 'SGD', 'MYR', 'JPY'];
      currencies.forEach(currency => {
        const result = CreateWalletSchema.safeParse({
          name: 'Test Wallet',
          balance: 1000,
          currency,
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid currency', () => {
      const result = CreateWalletSchema.safeParse({
        name: 'Test Wallet',
        balance: 1000,
        currency: 'INVALID',
      });
      expect(result.success).toBe(false);
    });

    it('should set default currency to IDR', () => {
      const result = CreateWalletSchema.safeParse({
        name: 'Test Wallet',
        balance: 1000,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currency).toBe('IDR');
      }
    });
  });
});

describe('Goal Validation', () => {
  describe('CreateGoalSchema', () => {
    it('should validate valid goal data', () => {
      const validData = {
        name: 'Dana Darurat',
        targetAmount: 20000000,
        currentAmount: 5000000,
        deadline: '2026-12-31',
        description: 'Dana cadangan untuk keadaan darurat',
      };

      const result = CreateGoalSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject zero target amount', () => {
      const invalidData = {
        name: 'Test Goal',
        targetAmount: 0,
        deadline: '2026-12-31',
      };

      const result = CreateGoalSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative current amount', () => {
      const invalidData = {
        name: 'Test Goal',
        targetAmount: 10000000,
        currentAmount: -1000,
        deadline: '2026-12-31',
      };

      const result = CreateGoalSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid deadline format', () => {
      const invalidData = {
        name: 'Test Goal',
        targetAmount: 10000000,
        deadline: 'invalid-date',
      };

      const result = CreateGoalSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should set default currentAmount to 0', () => {
      const result = CreateGoalSchema.safeParse({
        name: 'Test Goal',
        targetAmount: 10000000,
        deadline: '2026-12-31',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currentAmount).toBe(0);
      }
    });
  });
});

describe('Debt Validation', () => {
  describe('CreateDebtSchema', () => {
    it('should validate valid debt data', () => {
      const validData = {
        name: 'Pinjam ke Budi',
        amount: 500000,
        type: 'DEBT',
        description: 'Pinjam untuk modal usaha',
        loanDate: '2026-06-01',
        dueDate: '2026-07-01',
      };

      const result = CreateDebtSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept empty loanDate and dueDate', () => {
      const validData = {
        name: 'Test Debt',
        amount: 500000,
        type: 'LOAN',
      };

      const result = CreateDebtSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid debt type', () => {
      const invalidData = {
        name: 'Test Debt',
        amount: 500000,
        type: 'INVALID',
      };

      const result = CreateDebtSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept both DEBT and LOAN types', () => {
      const debtResult = CreateDebtSchema.safeParse({
        name: 'Test',
        amount: 500000,
        type: 'DEBT',
      });
      const loanResult = CreateDebtSchema.safeParse({
        name: 'Test',
        amount: 500000,
        type: 'LOAN',
      });
      expect(debtResult.success).toBe(true);
      expect(loanResult.success).toBe(true);
    });
  });
});

describe('Recurring Validation', () => {
  describe('CreateRecurringSchema', () => {
    it('should validate valid recurring data', () => {
      const validData = {
        name: 'Langganan Netflix',
        amount: 153000,
        frequency: 'BULANAN',
        nextDate: '2026-06-15',
        description: 'Hiburan streaming',
      };

      const result = CreateRecurringSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept various frequency values', () => {
      const frequencies = ['HARIAN', 'MINGGUAN', 'BULANAN', 'TAHUNAN', 'Harian', 'Mingguan'];
      frequencies.forEach(freq => {
        const result = CreateRecurringSchema.safeParse({
          name: 'Test',
          amount: 100000,
          frequency: freq,
          nextDate: '2026-06-15',
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid frequency', () => {
      const result = CreateRecurringSchema.safeParse({
        name: 'Test',
        amount: 100000,
        frequency: 'INVALID_FREQ',
        nextDate: '2026-06-15',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Reminder Validation', () => {
  describe('CreateReminderSchema', () => {
    it('should validate valid reminder data', () => {
      const validData = {
        title: 'Bayar Listrik',
        date: '2026-06-10',
        time: '09:00',
        amount: 250000,
        priority: 'HIGH',
        status: 'PENDING',
        description: 'Pembayaran listrik bulan Juni',
      };

      const result = CreateReminderSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty title', () => {
      const invalidData = {
        title: '',
        date: '2026-06-10',
      };

      const result = CreateReminderSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject title over 200 characters', () => {
      const invalidData = {
        title: 'a'.repeat(201),
        date: '2026-06-10',
      };

      const result = CreateReminderSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid time format', () => {
      const invalidData = {
        title: 'Test Reminder',
        date: '2026-06-10',
        time: '9:00', // Should be 09:00
      };

      const result = CreateReminderSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should set default priority to MEDIUM', () => {
      const result = CreateReminderSchema.safeParse({
        title: 'Test Reminder',
        date: '2026-06-10',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe('MEDIUM');
      }
    });

    it('should set default status to PENDING', () => {
      const result = CreateReminderSchema.safeParse({
        title: 'Test Reminder',
        date: '2026-06-10',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('PENDING');
      }
    });
  });
});

describe('Export Validation', () => {
  describe('ExportQuerySchema', () => {
    it('should validate valid export query', () => {
      const validQuery = {
        format: 'xlsx',
        type: 'transactions',
        startDate: '2026-01-01',
        endDate: '2026-06-30',
      };

      const result = ExportQuerySchema.safeParse(validQuery);
      expect(result.success).toBe(true);
    });

    it('should use default values when not provided', () => {
      const result = ExportQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.format).toBe('csv');
        expect(result.data.type).toBe('all');
      }
    });

    it('should reject invalid format', () => {
      const result = ExportQuerySchema.safeParse({ format: 'pdf' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid type', () => {
      const result = ExportQuerySchema.safeParse({ type: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('should accept all valid formats', () => {
      const formats = ['csv', 'xlsx', 'json'];
      formats.forEach(format => {
        const result = ExportQuerySchema.safeParse({ format });
        expect(result.success).toBe(true);
      });
    });

    it('should accept all valid types', () => {
      const types = ['transactions', 'wallets', 'goals', 'debts', 'recurring', 'all'];
      types.forEach(type => {
        const result = ExportQuerySchema.safeParse({ type });
        expect(result.success).toBe(true);
      });
    });
  });
});

describe('Settings Validation', () => {
  describe('UpdateSettingsSchema', () => {
    it('should validate valid settings update', () => {
      const validData = {
        theme: 'dark',
        language: 'id',
        currency: 'IDR',
        autoLockTimeout: 10,
      };

      const result = UpdateSettingsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept valid theme values', () => {
      const themes = ['light', 'dark', 'system'];
      themes.forEach(theme => {
        const result = UpdateSettingsSchema.safeParse({ theme });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid theme', () => {
      const result = UpdateSettingsSchema.safeParse({ theme: 'blue' });
      expect(result.success).toBe(false);
    });

    it('should accept valid language values', () => {
      const languages = ['id', 'en'];
      languages.forEach(lang => {
        const result = UpdateSettingsSchema.safeParse({ language: lang });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid language', () => {
      const result = UpdateSettingsSchema.safeParse({ language: 'fr' });
      expect(result.success).toBe(false);
    });

    it('should accept valid currency values', () => {
      const currencies = ['IDR', 'USD', 'EUR', 'SGD', 'MYR', 'JPY'];
      currencies.forEach(currency => {
        const result = UpdateSettingsSchema.safeParse({ currency });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid currency', () => {
      const result = UpdateSettingsSchema.safeParse({ currency: 'BTC' });
      expect(result.success).toBe(false);
    });

    it('should accept valid autoLockTimeout range', () => {
      const timeouts = [1, 5, 30, 60, 1440];
      timeouts.forEach(timeout => {
        const result = UpdateSettingsSchema.safeParse({ autoLockTimeout: timeout });
        expect(result.success).toBe(true);
      });
    });

    it('should reject autoLockTimeout below minimum', () => {
      const result = UpdateSettingsSchema.safeParse({ autoLockTimeout: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject autoLockTimeout above maximum', () => {
      const result = UpdateSettingsSchema.safeParse({ autoLockTimeout: 1441 });
      expect(result.success).toBe(false);
    });

    it('should accept valid telegram token', () => {
      const result = UpdateSettingsSchema.safeParse({
        telegramToken: '123456789:AABBCCDDEEFFaabbccddeeffaabbccddeeffaabb',
      });
      expect(result.success).toBe(true);
    });

    it('should accept null telegram token', () => {
      const result = UpdateSettingsSchema.safeParse({ telegramToken: null });
      expect(result.success).toBe(true);
    });

    it('should accept isPinEnabled boolean', () => {
      const trueResult = UpdateSettingsSchema.safeParse({ isPinEnabled: true });
      const falseResult = UpdateSettingsSchema.safeParse({ isPinEnabled: false });
      expect(trueResult.success).toBe(true);
      expect(falseResult.success).toBe(true);
    });

    it('should accept valid failedAttempts', () => {
      const attempts = [0, 1, 5, 10];
      attempts.forEach(attempt => {
        const result = UpdateSettingsSchema.safeParse({ failedAttempts: attempt });
        expect(result.success).toBe(true);
      });
    });

    it('should reject failedAttempts above maximum', () => {
      const result = UpdateSettingsSchema.safeParse({ failedAttempts: 11 });
      expect(result.success).toBe(false);
    });

    it('should accept valid lockoutUntil datetime', () => {
      const result = UpdateSettingsSchema.safeParse({
        lockoutUntil: '2026-07-22T12:00:00.000Z',
      });
      expect(result.success).toBe(true);
    });

    it('should reject unknown fields with strict mode', () => {
      const result = UpdateSettingsSchema.safeParse({
        theme: 'dark',
        unknownField: 'value',
      });
      expect(result.success).toBe(false);
    });

    it('should allow partial updates', () => {
      const result = UpdateSettingsSchema.safeParse({ theme: 'light' });
      expect(result.success).toBe(true);
    });
  });

  describe('UpdateSettingsPinSchema', () => {
    it('should validate valid PIN (4 digits)', () => {
      const result = UpdateSettingsPinSchema.safeParse({ pin: '1234' });
      expect(result.success).toBe(true);
    });

    it('should validate valid PIN (8 digits)', () => {
      const result = UpdateSettingsPinSchema.safeParse({ pin: '12345678' });
      expect(result.success).toBe(true);
    });

    it('should reject PIN below minimum length', () => {
      const result = UpdateSettingsPinSchema.safeParse({ pin: '123' });
      expect(result.success).toBe(false);
    });

    it('should reject PIN above maximum length', () => {
      const result = UpdateSettingsPinSchema.safeParse({ pin: '123456789' });
      expect(result.success).toBe(false);
    });

    it('should reject PIN with non-numeric characters', () => {
      const result = UpdateSettingsPinSchema.safeParse({ pin: '1234a' });
      expect(result.success).toBe(false);
    });

    it('should reject PIN with special characters', () => {
      const result = UpdateSettingsPinSchema.safeParse({ pin: '1234!' });
      expect(result.success).toBe(false);
    });

    it('should reject empty PIN', () => {
      const result = UpdateSettingsPinSchema.safeParse({ pin: '' });
      expect(result.success).toBe(false);
    });

    it('should reject unknown fields', () => {
      const result = UpdateSettingsPinSchema.safeParse({
        pin: '1234',
        unknownField: 'value',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('VerifyPinSchema', () => {
    it('should validate valid PIN for verification', () => {
      const result = VerifyPinSchema.safeParse({ pin: '5678' });
      expect(result.success).toBe(true);
    });

    it('should accept PIN within valid length range', () => {
      const result = VerifyPinSchema.safeParse({ pin: '123456' });
      expect(result.success).toBe(true);
    });

    it('should reject non-numeric PIN', () => {
      const result = VerifyPinSchema.safeParse({ pin: 'abcd' });
      expect(result.success).toBe(false);
    });
  });
});