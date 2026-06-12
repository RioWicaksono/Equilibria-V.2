# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> Transactions >> should filter transactions by date
- Location: tests\e2e\app.spec.ts:84:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByLabel(/tanggal/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByLabel(/tanggal/i)

```

```yaml
- text: Internal Server Error
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | // Helper to skip PIN authentication in tests
  4   | test.beforeEach(async ({ page }) => {
  5   |   await page.goto('/');
  6   |   // Bypass PIN by setting session storage
  7   |   await page.evaluate(() => {
  8   |     sessionStorage.setItem('equilibria_auth', 'true');
  9   |   });
  10  |   await page.reload();
  11  | });
  12  | 
  13  | test.describe('Dashboard', () => {
  14  |   test('should display dashboard with summary cards', async ({ page }) => {
  15  |     await page.goto('/');
  16  | 
  17  |     // Check for summary section
  18  |     await expect(page.getByText(/Ringkasan/i)).toBeVisible();
  19  |   });
  20  | 
  21  |   test('should show navigation menu', async ({ page }) => {
  22  |     await page.goto('/');
  23  | 
  24  |     // Desktop sidebar
  25  |     const sidebar = page.locator('aside').first();
  26  |     await expect(sidebar).toBeVisible();
  27  |   });
  28  | 
  29  |   test('should navigate to transactions page', async ({ page }) => {
  30  |     await page.goto('/');
  31  | 
  32  |     // Click transactions link
  33  |     await page.getByRole('link', { name: /transaksi/i }).click();
  34  |     await expect(page).toHaveURL(/\/transactions/);
  35  |   });
  36  | });
  37  | 
  38  | test.describe('Transactions', () => {
  39  |   test('should display transactions page', async ({ page }) => {
  40  |     await page.goto('/transactions');
  41  | 
  42  |     await expect(page.getByRole('heading', { name: /transaksi/i })).toBeVisible();
  43  |   });
  44  | 
  45  |   test('should open add transaction modal', async ({ page }) => {
  46  |     await page.goto('/transactions');
  47  | 
  48  |     // Click add button
  49  |     const addButton = page.getByRole('button', { name: /tambah transaksi/i });
  50  |     await expect(addButton).toBeVisible();
  51  |     await addButton.click();
  52  | 
  53  |     // Modal should open
  54  |     await expect(page.getByRole('heading', { name: /catat transaksi/i })).toBeVisible();
  55  |   });
  56  | 
  57  |   test('should close transaction modal', async ({ page }) => {
  58  |     await page.goto('/transactions');
  59  | 
  60  |     // Open modal
  61  |     await page.getByRole('button', { name: /tambah transaksi/i }).click();
  62  |     await expect(page.getByRole('heading', { name: /catat transaksi/i })).toBeVisible();
  63  | 
  64  |     // Close modal
  65  |     await page.getByRole('button', { name: /close/i, exact: true }).first().click();
  66  |     await expect(page.getByRole('heading', { name: /catat transaksi/i })).not.toBeVisible();
  67  |   });
  68  | 
  69  |   test('should toggle transaction type between income and expense', async ({ page }) => {
  70  |     await page.goto('/transactions');
  71  | 
  72  |     // Open modal
  73  |     await page.getByRole('button', { name: /tambah transaksi/i }).click();
  74  | 
  75  |     // Default should be expense
  76  |     const expenseButton = page.getByRole('button', { name: /pengeluaran/i });
  77  |     await expect(expenseButton).toHaveClass(/bg-rose/);
  78  | 
  79  |     // Click income
  80  |     await page.getByRole('button', { name: /pemasukan/i }).click();
  81  |     await expect(page.getByRole('button', { name: /pemasukan/i })).toHaveClass(/bg-emerald/);
  82  |   });
  83  | 
  84  |   test('should filter transactions by date', async ({ page }) => {
  85  |     await page.goto('/transactions');
  86  | 
  87  |     // Check filter controls exist
> 88  |     await expect(page.getByLabel(/tanggal/i)).toBeVisible();
      |                                               ^ Error: expect(locator).toBeVisible() failed
  89  |     await expect(page.getByLabel(/tipe/i)).toBeVisible();
  90  |     await expect(page.getByLabel(/kategori/i)).toBeVisible();
  91  |   });
  92  | });
  93  | 
  94  | test.describe('Budgets', () => {
  95  |   test('should display budgets page', async ({ page }) => {
  96  |     await page.goto('/budgets');
  97  | 
  98  |     await expect(page.getByRole('heading', { name: /budget/i })).toBeVisible();
  99  |   });
  100 | 
  101 |   test('should open add budget modal', async ({ page }) => {
  102 |     await page.goto('/budgets');
  103 | 
  104 |     const addButton = page.getByRole('button', { name: /tambah budget/i });
  105 |     await expect(addButton).toBeVisible();
  106 |     await addButton.click();
  107 | 
  108 |     await expect(page.getByRole('heading', { name: /tambah budget/i })).toBeVisible();
  109 |   });
  110 | });
  111 | 
  112 | test.describe('Goals', () => {
  113 |   test('should display goals page', async ({ page }) => {
  114 |     await page.goto('/goals');
  115 | 
  116 |     await expect(page.getByRole('heading', { name: /target/i })).toBeVisible();
  117 |   });
  118 | 
  119 |   test('should show progress bars for goals', async ({ page }) => {
  120 |     await page.goto('/goals');
  121 | 
  122 |     // Check for progress indicators
  123 |     const progressBars = page.locator('[class*="bg-teal-500"]');
  124 |     await expect(progressBars.first()).toBeVisible();
  125 |   });
  126 | });
  127 | 
  128 | test.describe('Wallets', () => {
  129 |   test('should display wallets page', async ({ page }) => {
  130 |     await page.goto('/wallets');
  131 | 
  132 |     await expect(page.getByRole('heading', { name: /dompet/i })).toBeVisible();
  133 |   });
  134 | 
  135 |   test('should show wallet balance', async ({ page }) => {
  136 |     await page.goto('/wallets');
  137 | 
  138 |     // Should show currency formatting
  139 |     await expect(page.getByText(/BCA/i).or(page.getByText(/Rp/i))).toBeVisible();
  140 |   });
  141 | });
  142 | 
  143 | test.describe('Settings', () => {
  144 |   test('should display settings page', async ({ page }) => {
  145 |     await page.goto('/settings');
  146 | 
  147 |     await expect(page.getByRole('heading', { name: /pengaturan/i })).toBeVisible();
  148 |   });
  149 | 
  150 |   test('should show theme toggle', async ({ page }) => {
  151 |     await page.goto('/settings');
  152 | 
  153 |     await expect(page.getByText(/tema/i)).toBeVisible();
  154 |     await expect(page.getByText(/dark/i)).toBeVisible();
  155 |     await expect(page.getByText(/light/i)).toBeVisible();
  156 |   });
  157 | });
  158 | 
  159 | test.describe('Responsive Design', () => {
  160 |   test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE
  161 | 
  162 |   test('should show mobile navigation on small screens', async ({ page }) => {
  163 |     await page.goto('/');
  164 | 
  165 |     // Mobile bottom nav should be visible
  166 |     const mobileNav = page.locator('nav').last();
  167 |     await expect(mobileNav).toBeVisible();
  168 |   });
  169 | 
  170 |   test('should hide desktop sidebar on mobile', async ({ page }) => {
  171 |     await page.goto('/');
  172 | 
  173 |     // Desktop sidebar should be hidden
  174 |     const sidebar = page.locator('aside').first();
  175 |     await expect(sidebar).toBeHidden();
  176 |   });
  177 | });
  178 | 
  179 | test.describe('PIN Protection', () => {
  180 |   test('should show PIN entry screen when not authenticated', async ({ page }) => {
  181 |     // Clear authentication
  182 |     await page.evaluate(() => sessionStorage.removeItem('equilibria_auth'));
  183 |     await page.goto('/');
  184 | 
  185 |     // Should show PIN input
  186 |     await expect(page.getByText(/masukkan pin/i)).toBeVisible();
  187 |   });
  188 | 
```