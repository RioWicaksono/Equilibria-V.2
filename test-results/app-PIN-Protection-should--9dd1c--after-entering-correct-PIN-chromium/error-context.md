# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> PIN Protection >> should allow access after entering correct PIN
- Location: tests\e2e\app.spec.ts:189:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/masukkan pin/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/masukkan pin/i)

```

# Test source

```ts
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
  189 |   test('should allow access after entering correct PIN', async ({ page }) => {
  190 |     await page.goto('/');
  191 | 
  192 |     // Should show PIN screen
> 193 |     await expect(page.getByText(/masukkan pin/i)).toBeVisible();
      |                                                   ^ Error: expect(locator).toBeVisible() failed
  194 | 
  195 |     // Enter PIN (default is 123789)
  196 |     for (const digit of '123789') {
  197 |       await page.getByRole('button', { name: digit }).click();
  198 |     }
  199 | 
  200 |     // Should show dashboard after successful auth
  201 |     await expect(page.getByText(/ringkasan/i)).toBeVisible();
  202 |   });
  203 | 
  204 |   test('should show error on wrong PIN', async ({ page }) => {
  205 |     await page.goto('/');
  206 | 
  207 |     // Enter wrong PIN
  208 |     for (const digit of '000000') {
  209 |       await page.getByRole('button', { name: digit }).click();
  210 |     }
  211 | 
  212 |     // Should show error
  213 |     await expect(page.getByText(/pin salah/i)).toBeVisible();
  214 |   });
  215 | });
```