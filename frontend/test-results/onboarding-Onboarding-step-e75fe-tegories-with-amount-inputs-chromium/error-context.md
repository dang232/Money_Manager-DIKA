# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: onboarding.spec.ts >> Onboarding >> step 2 shows expense categories with amount inputs
- Location: e2e\onboarding.spec.ts:125:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByPlaceholder('0').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByPlaceholder('0').first()

```

```yaml
- heading "Set monthly budgets" [level=1]
- paragraph: "Optional: set spending limits per category"
- button "Skip"
- button "Continue"
```

# Test source

```ts
  29  |         ]),
  30  |       })
  31  |     }
  32  |   })
  33  | 
  34  |   await page.route('**/api/budgets', async (route) => {
  35  |     if (route.request().method() === 'POST') {
  36  |       await route.fulfill({ status: 201, contentType: 'application/json', body: '{}' })
  37  |     } else {
  38  |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
  39  |     }
  40  |   })
  41  | 
  42  |   await page.route('**/api/transactions', async (route) => {
  43  |     if (route.request().method() === 'POST') {
  44  |       await route.fulfill({
  45  |         status: 201,
  46  |         contentType: 'application/json',
  47  |         body: JSON.stringify({ id: 'tx-1', amount: 100000, type: 'expense', categoryId: 'cat-2', description: 'Test', date: new Date().toISOString() }),
  48  |       })
  49  |     } else {
  50  |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [], total: 0 }) })
  51  |     }
  52  |   })
  53  | 
  54  |   // Catch-all for dashboard redirect (fetch/xhr only)
  55  |   await page.route('**/api/**', (route) => {
  56  |     const type = route.request().resourceType()
  57  |     if (type === 'fetch' || type === 'xhr') {
  58  |       return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) })
  59  |     }
  60  |     return route.continue()
  61  |   })
  62  | }
  63  | 
  64  | test.describe('Onboarding', () => {
  65  |   test.beforeEach(async ({ page }) => {
  66  |     await seedAuth(page)
  67  |     await mockOnboardingApis(page)
  68  |     await page.goto('/onboarding')
  69  |     // ponytail: clear flag after navigation so localStorage is accessible
  70  |     await page.evaluate(() => localStorage.removeItem('mm-onboarded'))
  71  |   })
  72  | 
  73  |   // -------------------------------------------------------------------------
  74  |   // Step 1 — Categories
  75  |   // -------------------------------------------------------------------------
  76  |   test('renders step 1 with default category options', async ({ page }) => {
  77  |     await expect(page.getByRole('heading', { name: 'Choose your categories' })).toBeVisible()
  78  |     await expect(page.getByRole('button', { name: /Salary/ })).toBeVisible()
  79  |     await expect(page.getByRole('button', { name: /Food & Dining/ })).toBeVisible()
  80  |     await expect(page.getByRole('button', { name: /Transportation/ })).toBeVisible()
  81  |     await expect(page.getByRole('button', { name: /Shopping/ })).toBeVisible()
  82  |     await expect(page.getByRole('button', { name: /Bills & Utilities/ })).toBeVisible()
  83  |     await expect(page.getByRole('button', { name: /Entertainment/ })).toBeVisible()
  84  |     await expect(page.getByRole('button', { name: /Healthcare/ })).toBeVisible()
  85  |   })
  86  | 
  87  |   test('Continue is disabled when no category is selected', async ({ page }) => {
  88  |     // Deselect all pre-selected defaults
  89  |     for (const name of ['Salary', 'Food & Dining', 'Transportation', 'Shopping', 'Bills & Utilities']) {
  90  |       await page.getByRole('button', { name: new RegExp(name) }).click()
  91  |     }
  92  |     await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled()
  93  |   })
  94  | 
  95  |   test('can add a custom category and proceed', async ({ page }) => {
  96  |     await page.getByPlaceholder('Add custom category...').fill('Gym')
  97  |     await page.getByRole('button', { name: 'Add' }).click()
  98  |     await expect(page.getByText('Gym')).toBeVisible()
  99  |   })
  100 | 
  101 |   test('custom category can be added with Enter key', async ({ page }) => {
  102 |     await page.getByPlaceholder('Add custom category...').fill('Books')
  103 |     await page.getByPlaceholder('Add custom category...').press('Enter')
  104 |     await expect(page.getByText('Books')).toBeVisible()
  105 |   })
  106 | 
  107 |   test('step 1 Continue calls POST /categories and advances to step 2', async ({ page }) => {
  108 |     const requests: string[] = []
  109 |     page.on('request', (req) => {
  110 |       if (req.url().includes('/api/categories') && req.method() === 'POST') {
  111 |         requests.push(req.postData() ?? '')
  112 |       }
  113 |     })
  114 | 
  115 |     await page.getByRole('button', { name: 'Continue' }).click()
  116 |     // Wait for step 2 heading
  117 |     await expect(page.getByRole('heading', { name: 'Set monthly budgets' })).toBeVisible()
  118 |     // At least one POST should have fired for the pre-selected categories
  119 |     expect(requests.length).toBeGreaterThan(0)
  120 |   })
  121 | 
  122 |   // -------------------------------------------------------------------------
  123 |   // Step 2 — Budgets
  124 |   // -------------------------------------------------------------------------
  125 |   test('step 2 shows expense categories with amount inputs', async ({ page }) => {
  126 |     await page.getByRole('button', { name: 'Continue' }).click()
  127 |     await expect(page.getByRole('heading', { name: 'Set monthly budgets' })).toBeVisible()
  128 |     // Expense category inputs should be present
> 129 |     await expect(page.getByPlaceholder('0').first()).toBeVisible()
      |                                                      ^ Error: expect(locator).toBeVisible() failed
  130 |   })
  131 | 
  132 |   test('Skip on step 2 advances to step 3 without calling POST /budgets', async ({ page }) => {
  133 |     await page.getByRole('button', { name: 'Continue' }).click()
  134 |     await expect(page.getByRole('heading', { name: 'Set monthly budgets' })).toBeVisible()
  135 | 
  136 |     let budgetPostCalled = false
  137 |     page.on('request', (req) => {
  138 |       if (req.url().includes('/api/budgets') && req.method() === 'POST') budgetPostCalled = true
  139 |     })
  140 | 
  141 |     await page.getByRole('button', { name: 'Skip' }).click()
  142 |     await expect(page.getByRole('heading', { name: 'Your first transaction' })).toBeVisible()
  143 |     expect(budgetPostCalled).toBe(false)
  144 |   })
  145 | 
  146 |   test('step 2 Continue with budget amounts calls POST /budgets', async ({ page }) => {
  147 |     await page.getByRole('button', { name: 'Continue' }).click()
  148 |     await expect(page.getByRole('heading', { name: 'Set monthly budgets' })).toBeVisible()
  149 | 
  150 |     // Fill the first budget input
  151 |     const firstInput = page.getByPlaceholder('0').first()
  152 |     await firstInput.fill('500000')
  153 | 
  154 |     const budgetResponse = page.waitForResponse('**/api/budgets')
  155 |     await page.getByRole('button', { name: 'Continue' }).click()
  156 |     await budgetResponse
  157 | 
  158 |     await expect(page.getByRole('heading', { name: 'Your first transaction' })).toBeVisible()
  159 |   })
  160 | 
  161 |   // -------------------------------------------------------------------------
  162 |   // Step 3 — First Transaction
  163 |   // -------------------------------------------------------------------------
  164 |   test('step 3 shows the first transaction form', async ({ page }) => {
  165 |     await page.getByRole('button', { name: 'Continue' }).click()
  166 |     await page.getByRole('button', { name: 'Skip' }).click()
  167 |     await expect(page.getByRole('heading', { name: 'Your first transaction' })).toBeVisible()
  168 |     await expect(page.getByRole('button', { name: 'Expense' })).toBeVisible()
  169 |     await expect(page.getByRole('button', { name: 'Income' })).toBeVisible()
  170 |     await expect(page.getByPlaceholder('Amount')).toBeVisible()
  171 |     await expect(page.getByPlaceholder('Description')).toBeVisible()
  172 |   })
  173 | 
  174 |   test('Skip on step 3 navigates to /dashboard without POST /transactions', async ({ page }) => {
  175 |     await page.getByRole('button', { name: 'Continue' }).click()
  176 |     await page.getByRole('button', { name: 'Skip' }).click()
  177 |     await expect(page.getByRole('heading', { name: 'Your first transaction' })).toBeVisible()
  178 | 
  179 |     let txPostCalled = false
  180 |     page.on('request', (req) => {
  181 |       if (req.url().includes('/api/transactions') && req.method() === 'POST') txPostCalled = true
  182 |     })
  183 | 
  184 |     await page.getByRole('button', { name: 'Skip' }).click()
  185 |     await expect(page).toHaveURL('/dashboard')
  186 |     expect(txPostCalled).toBe(false)
  187 | 
  188 |     const onboarded = await page.evaluate(() => localStorage.getItem('mm-onboarded'))
  189 |     expect(onboarded).toBe('true')
  190 |   })
  191 | 
  192 |   test('step 3 Get Started calls POST /transactions and navigates to /dashboard', async ({ page }) => {
  193 |     await page.getByRole('button', { name: 'Continue' }).click()
  194 |     await page.getByRole('button', { name: 'Skip' }).click()
  195 |     await expect(page.getByRole('heading', { name: 'Your first transaction' })).toBeVisible()
  196 | 
  197 |     await page.getByPlaceholder('Amount').fill('100000')
  198 |     // Select category (first expense option)
  199 |     await page.getByRole('combobox').selectOption({ index: 1 })
  200 | 
  201 |     const txResponse = page.waitForResponse('**/api/transactions')
  202 |     await page.getByRole('button', { name: 'Get Started' }).click()
  203 |     await txResponse
  204 | 
  205 |     await expect(page).toHaveURL('/dashboard')
  206 |   })
  207 | 
  208 |   test('type toggle on step 3 filters the category dropdown', async ({ page }) => {
  209 |     await page.getByRole('button', { name: 'Continue' }).click()
  210 |     await page.getByRole('button', { name: 'Skip' }).click()
  211 | 
  212 |     // Default is expense
  213 |     await expect(page.getByRole('button', { name: 'Expense' })).toBeVisible()
  214 | 
  215 |     // Switch to income
  216 |     await page.getByRole('button', { name: 'Income' }).click()
  217 |     // The select should now only show income categories (Salary)
  218 |     const options = await page.getByRole('combobox').locator('option').allInnerTexts()
  219 |     const filtered = options.filter((o) => o !== 'Select category')
  220 |     expect(filtered.every((o) => o === 'Salary')).toBe(true)
  221 |   })
  222 | 
  223 |   // -------------------------------------------------------------------------
  224 |   // Full happy path
  225 |   // -------------------------------------------------------------------------
  226 |   test('completes all 3 steps and lands on dashboard', async ({ page }) => {
  227 |     // Step 1
  228 |     await page.getByRole('button', { name: 'Continue' }).click()
  229 |     // Step 2
```