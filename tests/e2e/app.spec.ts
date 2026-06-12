import { test, expect } from '@playwright/test';

// Helper to skip PIN authentication in tests
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // Bypass PIN by setting session storage
  await page.evaluate(() => {
    sessionStorage.setItem('equilibria_auth', 'true');
  });
  await page.reload();
});

test.describe('Dashboard', () => {
  test('should display dashboard with summary cards', async ({ page }) => {
    await page.goto('/');

    // Check for summary section
    await expect(page.getByText(/Ringkasan/i)).toBeVisible();
  });

  test('should show navigation menu', async ({ page }) => {
    await page.goto('/');

    // Desktop sidebar
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();
  });

  test('should navigate to transactions page', async ({ page }) => {
    await page.goto('/');

    // Click transactions link
    await page.getByRole('link', { name: /transaksi/i }).click();
    await expect(page).toHaveURL(/\/transactions/);
  });
});

test.describe('Transactions', () => {
  test('should display transactions page', async ({ page }) => {
    await page.goto('/transactions');

    await expect(page.getByRole('heading', { name: /transaksi/i })).toBeVisible();
  });

  test('should open add transaction modal', async ({ page }) => {
    await page.goto('/transactions');

    // Click add button
    const addButton = page.getByRole('button', { name: /tambah transaksi/i });
    await expect(addButton).toBeVisible();
    await addButton.click();

    // Modal should open
    await expect(page.getByRole('heading', { name: /catat transaksi/i })).toBeVisible();
  });

  test('should close transaction modal', async ({ page }) => {
    await page.goto('/transactions');

    // Open modal
    await page.getByRole('button', { name: /tambah transaksi/i }).click();
    await expect(page.getByRole('heading', { name: /catat transaksi/i })).toBeVisible();

    // Close modal
    await page.getByRole('button', { name: /close/i, exact: true }).first().click();
    await expect(page.getByRole('heading', { name: /catat transaksi/i })).not.toBeVisible();
  });

  test('should toggle transaction type between income and expense', async ({ page }) => {
    await page.goto('/transactions');

    // Open modal
    await page.getByRole('button', { name: /tambah transaksi/i }).click();

    // Default should be expense
    const expenseButton = page.getByRole('button', { name: /pengeluaran/i });
    await expect(expenseButton).toHaveClass(/bg-rose/);

    // Click income
    await page.getByRole('button', { name: /pemasukan/i }).click();
    await expect(page.getByRole('button', { name: /pemasukan/i })).toHaveClass(/bg-emerald/);
  });

  test('should filter transactions by date', async ({ page }) => {
    await page.goto('/transactions');

    // Check filter controls exist
    await expect(page.getByLabel(/tanggal/i)).toBeVisible();
    await expect(page.getByLabel(/tipe/i)).toBeVisible();
    await expect(page.getByLabel(/kategori/i)).toBeVisible();
  });
});

test.describe('Budgets', () => {
  test('should display budgets page', async ({ page }) => {
    await page.goto('/budgets');

    await expect(page.getByRole('heading', { name: /budget/i })).toBeVisible();
  });

  test('should open add budget modal', async ({ page }) => {
    await page.goto('/budgets');

    const addButton = page.getByRole('button', { name: /tambah budget/i });
    await expect(addButton).toBeVisible();
    await addButton.click();

    await expect(page.getByRole('heading', { name: /tambah budget/i })).toBeVisible();
  });
});

test.describe('Goals', () => {
  test('should display goals page', async ({ page }) => {
    await page.goto('/goals');

    await expect(page.getByRole('heading', { name: /target/i })).toBeVisible();
  });

  test('should show progress bars for goals', async ({ page }) => {
    await page.goto('/goals');

    // Check for progress indicators
    const progressBars = page.locator('[class*="bg-teal-500"]');
    await expect(progressBars.first()).toBeVisible();
  });
});

test.describe('Wallets', () => {
  test('should display wallets page', async ({ page }) => {
    await page.goto('/wallets');

    await expect(page.getByRole('heading', { name: /dompet/i })).toBeVisible();
  });

  test('should show wallet balance', async ({ page }) => {
    await page.goto('/wallets');

    // Should show currency formatting
    await expect(page.getByText(/BCA/i).or(page.getByText(/Rp/i))).toBeVisible();
  });
});

test.describe('Settings', () => {
  test('should display settings page', async ({ page }) => {
    await page.goto('/settings');

    await expect(page.getByRole('heading', { name: /pengaturan/i })).toBeVisible();
  });

  test('should show theme toggle', async ({ page }) => {
    await page.goto('/settings');

    await expect(page.getByText(/tema/i)).toBeVisible();
    await expect(page.getByText(/dark/i)).toBeVisible();
    await expect(page.getByText(/light/i)).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('should show mobile navigation on small screens', async ({ page }) => {
    await page.goto('/');

    // Mobile bottom nav should be visible
    const mobileNav = page.locator('nav').last();
    await expect(mobileNav).toBeVisible();
  });

  test('should hide desktop sidebar on mobile', async ({ page }) => {
    await page.goto('/');

    // Desktop sidebar should be hidden
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeHidden();
  });
});

test.describe('PIN Protection', () => {
  test('should show PIN entry screen when not authenticated', async ({ page }) => {
    // Clear authentication
    await page.evaluate(() => sessionStorage.removeItem('equilibria_auth'));
    await page.goto('/');

    // Should show PIN input
    await expect(page.getByText(/masukkan pin/i)).toBeVisible();
  });

  test('should allow access after entering correct PIN', async ({ page }) => {
    await page.goto('/');

    // Should show PIN screen
    await expect(page.getByText(/masukkan pin/i)).toBeVisible();

    // Enter PIN (default is 123789)
    for (const digit of '123789') {
      await page.getByRole('button', { name: digit }).click();
    }

    // Should show dashboard after successful auth
    await expect(page.getByText(/ringkasan/i)).toBeVisible();
  });

  test('should show error on wrong PIN', async ({ page }) => {
    await page.goto('/');

    // Enter wrong PIN
    for (const digit of '000000') {
      await page.getByRole('button', { name: digit }).click();
    }

    // Should show error
    await expect(page.getByText(/pin salah/i)).toBeVisible();
  });
});