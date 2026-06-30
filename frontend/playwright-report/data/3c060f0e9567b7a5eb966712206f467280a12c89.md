# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: real-flow.spec.ts >> Full customer journey >> 4. Login with wrong password shows error
- Location: e2e\real-flow.spec.ts:76:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('alert')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('alert')

```

```yaml
- heading "Welcome back" [level=1]
- paragraph: Sign in to your account
- text: Email
- textbox "Email":
  - /placeholder: you@example.com
- text: Password
- textbox "Password":
  - /placeholder: ••••••••
- button "Sign in"
- paragraph:
  - text: Don't have an account?
  - link "Create one":
    - /url: /register
```

# Test source

```ts
  1   | /**
  2   |  * Real E2E test — interacts with the actual running app at localhost:5173.
  3   |  * No mocks. Tests the full customer journey against real backend services.
  4   |  *
  5   |  * Prerequisites: docker compose up (all services healthy)
  6   |  * Run: npx playwright test e2e/real-flow.spec.ts --headed
  7   |  */
  8   | import { test, expect } from '@playwright/test'
  9   | 
  10  | const UNIQUE = Date.now()
  11  | const TEST_USER = {
  12  |   displayName: `E2E User ${UNIQUE}`,
  13  |   email: `e2e-${UNIQUE}@test.local`,
  14  |   password: 'StrongPass123!',
  15  | }
  16  | 
  17  | test.describe.serial('Full customer journey', () => {
  18  |   // ─── Registration ─────────────────────────────────────────────────────────
  19  |   test('1. Register a new account', async ({ page }) => {
  20  |     await page.goto('/register')
  21  | 
  22  |     // Should see the register form without any app sidebar
  23  |     await expect(page.getByRole('heading', { name: 'Create an account' })).toBeVisible()
  24  |     // No sidebar should be visible (layout fix verification)
  25  |     await expect(page.locator('nav')).not.toBeVisible()
  26  | 
  27  |     // Fill the form
  28  |     await page.getByLabel('Display name').fill(TEST_USER.displayName)
  29  |     await page.getByLabel('Email').fill(TEST_USER.email)
  30  |     await page.getByLabel('Password').fill(TEST_USER.password)
  31  | 
  32  |     // Submit
  33  |     await page.getByRole('button', { name: 'Create account' }).click()
  34  | 
  35  |     // Should navigate to dashboard after successful registration
  36  |     await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 10000 })
  37  |   })
  38  | 
  39  |   // ─── Logout ───────────────────────────────────────────────────────────────
  40  |   test('2. Logout from the app', async ({ page }) => {
  41  |     // Login first
  42  |     await page.goto('/login')
  43  |     await page.getByLabel('Email').fill(TEST_USER.email)
  44  |     await page.getByLabel('Password').fill(TEST_USER.password)
  45  |     await page.getByRole('button', { name: 'Sign in' }).click()
  46  |     await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 10000 })
  47  | 
  48  |     // Find and click logout
  49  |     const logoutBtn = page.getByRole('button', { name: 'Logout' })
  50  |     if (await logoutBtn.first().isVisible()) {
  51  |       await logoutBtn.first().click()
  52  |       // Wait for cookies to clear
  53  |       await page.waitForTimeout(2000)
  54  |       const cookies = await page.context().cookies()
  55  |       const csrfCookie = cookies.find(c => c.name === 'mm-csrf')
  56  |       expect(csrfCookie).toBeUndefined()
  57  |     }
  58  |   })
  59  | 
  60  |   // ─── Login ────────────────────────────────────────────────────────────────
  61  |   test('3. Login with existing account', async ({ page }) => {
  62  |     await page.goto('/login')
  63  | 
  64  |     await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  65  |     // No sidebar visible (layout fix)
  66  |     await expect(page.locator('nav')).not.toBeVisible()
  67  | 
  68  |     await page.getByLabel('Email').fill(TEST_USER.email)
  69  |     await page.getByLabel('Password').fill(TEST_USER.password)
  70  |     await page.getByRole('button', { name: 'Sign in' }).click()
  71  | 
  72  |     await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 10000 })
  73  |   })
  74  | 
  75  |   // ─── Login failure ────────────────────────────────────────────────────────
  76  |   test('4. Login with wrong password shows error', async ({ page }) => {
  77  |     await page.goto('/login')
  78  | 
  79  |     await page.getByLabel('Email').fill(TEST_USER.email)
  80  |     await page.getByLabel('Password').fill('WrongPassword999!')
  81  |     await page.getByRole('button', { name: 'Sign in' }).click()
  82  | 
  83  |     // Should show error message
> 84  |     await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 })
      |                                           ^ Error: expect(locator).toBeVisible() failed
  85  |     // Should stay on login page
  86  |     await expect(page).toHaveURL('/login')
  87  |   })
  88  | 
  89  |   // ─── Route guard ──────────────────────────────────────────────────────────
  90  |   test('5. Unauthenticated user gets redirected to /login', async ({ page }) => {
  91  |     // Clear cookies to simulate unauthenticated state
  92  |     await page.context().clearCookies()
  93  | 
  94  |     await page.goto('/dashboard')
  95  |     await expect(page).toHaveURL('/login', { timeout: 5000 })
  96  |   })
  97  | 
  98  |   // ─── Dashboard loads ──────────────────────────────────────────────────────
  99  |   test('6. Dashboard loads with data after login', async ({ page }) => {
  100 |     await page.goto('/login')
  101 |     await page.getByLabel('Email').fill(TEST_USER.email)
  102 |     await page.getByLabel('Password').fill(TEST_USER.password)
  103 |     await page.getByRole('button', { name: 'Sign in' }).click()
  104 |     await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 10000 })
  105 | 
  106 |     // If redirected to onboarding, skip it
  107 |     if (page.url().includes('onboarding')) {
  108 |       // Try to skip through onboarding
  109 |       const skipBtn = page.getByRole('button', { name: /skip/i })
  110 |       while (await skipBtn.isVisible().catch(() => false)) {
  111 |         await skipBtn.click()
  112 |         await page.waitForTimeout(500)
  113 |       }
  114 |       const continueBtn = page.getByRole('button', { name: /continue/i })
  115 |       while (await continueBtn.isVisible().catch(() => false)) {
  116 |         await continueBtn.click()
  117 |         await page.waitForTimeout(500)
  118 |       }
  119 |     }
  120 | 
  121 |     // Should eventually land on dashboard
  122 |     if (!page.url().includes('dashboard')) {
  123 |       await page.goto('/dashboard')
  124 |     }
  125 | 
  126 |     // Dashboard should render without crashing
  127 |     await expect(page.locator('body')).not.toHaveText(/error/i, { timeout: 5000 })
  128 |   })
  129 | 
  130 |   // ─── Navigation works ─────────────────────────────────────────────────────
  131 |   test('7. Sidebar navigation works', async ({ page }) => {
  132 |     // Login
  133 |     await page.goto('/login')
  134 |     await page.getByLabel('Email').fill(TEST_USER.email)
  135 |     await page.getByLabel('Password').fill(TEST_USER.password)
  136 |     await page.getByRole('button', { name: 'Sign in' }).click()
  137 |     await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 10000 })
  138 | 
  139 |     // Navigate to transactions
  140 |     const txnLink = page.getByRole('link', { name: /transactions/i }).first()
  141 |     if (await txnLink.isVisible()) {
  142 |       await txnLink.click()
  143 |       await expect(page).toHaveURL(/\/transactions/, { timeout: 5000 })
  144 |     }
  145 | 
  146 |     // Navigate to budgets
  147 |     const budgetLink = page.getByRole('link', { name: /budgets/i }).first()
  148 |     if (await budgetLink.isVisible()) {
  149 |       await budgetLink.click()
  150 |       await expect(page).toHaveURL(/\/budget/, { timeout: 5000 })
  151 |     }
  152 |   })
  153 | 
  154 |   // ─── Create transaction ───────────────────────────────────────────────────
  155 |   test('8. Create a transaction', async ({ page }) => {
  156 |     // Login
  157 |     await page.goto('/login')
  158 |     await page.getByLabel('Email').fill(TEST_USER.email)
  159 |     await page.getByLabel('Password').fill(TEST_USER.password)
  160 |     await page.getByRole('button', { name: 'Sign in' }).click()
  161 |     await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 10000 })
  162 | 
  163 |     // Go to transactions page
  164 |     await page.goto('/transactions')
  165 |     await page.waitForLoadState('networkidle')
  166 | 
  167 |     // Click Add Transaction
  168 |     const addBtn = page.getByRole('button', { name: /add transaction/i }).first()
  169 |     if (await addBtn.isVisible()) {
  170 |       await addBtn.click()
  171 | 
  172 |       // Fill form
  173 |       const amountInput = page.getByLabel(/amount/i)
  174 |       if (await amountInput.isVisible()) {
  175 |         await amountInput.fill('50000')
  176 |       }
  177 | 
  178 |       const descInput = page.getByLabel(/description/i)
  179 |       if (await descInput.isVisible()) {
  180 |         await descInput.fill('Playwright test expense')
  181 |       }
  182 | 
  183 |       // Try to save
  184 |       const saveBtn = page.getByRole('button', { name: /save/i })
```