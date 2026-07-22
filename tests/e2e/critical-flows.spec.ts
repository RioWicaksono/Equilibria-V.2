import { test, expect } from '@playwright/test';

// Helper to skip PIN authentication in tests
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    sessionStorage.setItem('equilibria_auth', 'true');
  });
  await page.reload();
});

test.describe('Critical User Flows', () => {
  test.describe('Add Transaction Flow', () => {
    test('should complete add expense transaction flow', async ({ page }) => {
      await page.goto('/transactions');

      // Open modal
      await page.getByRole('button', { name: /tambah transaksi/i }).click();
      await expect(page.getByRole('heading', { name: /catat transaksi/i })).toBeVisible();

      // Fill form
      await page.getByPlaceholder(/jumlah/i).fill('50000');
      await page.getByPlaceholder(/deskripsi/i).fill('Test expense transaction');

      // Submit
      await page.getByRole('button', { name: /simpan/i }).click();

      // Modal should close and transaction should appear
      await expect(page.getByRole('heading', { name: /catat transaksi/i })).not.toBeVisible();
    });

    test('should complete add income transaction flow', async ({ page }) => {
      await page.goto('/transactions');

      // Open modal
      await page.getByRole('button', { name: /tambah transaksi/i }).click();

      // Switch to income
      await page.getByRole('button', { name: /pemasukan/i }).click();

      // Fill form
      await page.getByPlaceholder(/jumlah/i).fill('1000000');
      await page.getByPlaceholder(/deskripsi/i).fill('Test income transaction');

      // Submit
      await page.getByRole('button', { name: /simpan/i }).click();

      // Modal should close
      await expect(page.getByRole('heading', { name: /catat transaksi/i })).not.toBeVisible();
    });

    test('should show validation error for empty amount', async ({ page }) => {
      await page.goto('/transactions');

      // Open modal
      await page.getByRole('button', { name: /tambah transaksi/i }).click();

      // Try to submit without amount
      await page.getByRole('button', { name: /simpan/i }).click();

      // Should show error
      await expect(page.getByText(/jumlah tidak valid/i)).toBeVisible();
    });
  });

  test.describe('Budget Management Flow', () => {
    test('should navigate to budget page', async ({ page }) => {
      await page.goto('/budgets');

      await expect(page.getByRole('heading', { name: /budget/i })).toBeVisible();
    });

    test('should display budget cards', async ({ page }) => {
      await page.goto('/budgets');

      // Should show some content (even if empty state)
      await expect(page.locator('body')).not.toBeEmpty();
    });
  });

  test.describe('Export Data Flow', () => {
    test('should navigate to export page', async ({ page }) => {
      await page.goto('/transactions');

      // Look for export button
      const exportButton = page.getByRole('button', { name: /ekspor/i });
      if (await exportButton.isVisible()) {
        await exportButton.click();
        await expect(page.getByRole('heading', { name: /ekspor/i })).toBeVisible();
      }
    });
  });

  test.describe('Navigation Flow', () => {
    test('should navigate through main menu items', async ({ page }) => {
      await page.goto('/');

      // Dashboard
      await page.getByRole('link', { name: /dashboard/i }).click();
      await expect(page).toHaveURL(/\/$/);

      // Transactions
      await page.getByRole('link', { name: /transaksi/i }).click();
      await expect(page).toHaveURL(/\/transactions/);

      // Budgets
      await page.getByRole('link', { name: /budget/i }).click();
      await expect(page).toHaveURL(/\/budgets/);

      // Goals
      await page.getByRole('link', { name: /target/i }).click();
      await expect(page).toHaveURL(/\/goals/);

      // Debts
      await page.getByRole('link', { name: /hutang/i }).click();
      await expect(page).toHaveURL(/\/debts/);
    });

    test('should navigate to settings', async ({ page }) => {
      await page.goto('/');

      // Click settings in sidebar
      await page.getByRole('link', { name: /pengaturan/i }).click();
      await expect(page).toHaveURL(/\/settings/);
    });
  });

  test.describe('Mobile Navigation Flow', () => {
    test('should show mobile menu on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Should see hamburger menu
      const menuButton = page.getByRole('button', { name: /menu/i }).or(page.locator('[aria-label="menu"]'));
      await expect(menuButton).toBeVisible();
    });
  });
});
