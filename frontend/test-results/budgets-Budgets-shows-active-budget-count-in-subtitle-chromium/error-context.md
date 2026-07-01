# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: budgets.spec.ts >> Budgets >> shows active budget count in subtitle
- Location: e2e\budgets.spec.ts:102:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/2 active budgets/)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/2 active budgets/)

```

```yaml
- complementary:
  - img
  - text: Money Manager Personal finance
  - navigation:
    - paragraph: Main
    - link "Dashboard":
      - /url: /dashboard
      - img
      - text: Dashboard
    - link "Transactions":
      - /url: /transactions
      - img
      - text: Transactions
    - link "Budgets":
      - /url: /budget
      - img
      - text: Budgets
    - link "Categories":
      - /url: /categories
      - img
      - text: Categories
    - link "Reports":
      - /url: /reports
      - img
      - text: Reports
    - paragraph: Account
    - link "Settings":
      - /url: /settings
      - img
      - text: Settings
  - heading "Go Premium" [level=4]
  - paragraph: Unlimited budgets & advanced reports
  - button "Upgrade →"
  - button "Dark":
    - img
    - text: Dark
  - button "Collapse":
    - img
    - text: Collapse
  - button "Logout":
    - img
    - text: Logout
- banner:
  - img
  - textbox "Search transactions, categories, budgets..."
  - button:
    - img
  - text: DA
- main:
  - heading "Monthly Budgets" [level=1]
  - paragraph: 0 active budgets
  - button "New Budget":
    - img
    - text: New Budget
  - button "Create new budget Set a spending limit by category":
    - img
    - paragraph: Create new budget
    - paragraph: Set a spending limit by category
  - paragraph: No budgets configured. Set a budget to start tracking spending.
- button "Add Transaction":
  - img
- button "Toggle AI chat"
```

# Test source

```ts
  3   | 
  4   | const CATEGORIES = [
  5   |   { id: 'cat-1', name: 'Food & Dining', type: 'expense' },
  6   |   { id: 'cat-2', name: 'Transportation', type: 'expense' },
  7   |   { id: 'cat-3', name: 'Salary', type: 'income' },
  8   | ]
  9   | 
  10  | const BUDGETS = [
  11  |   {
  12  |     budgetId: 'b1',
  13  |     categoryId: 'cat-1',
  14  |     monthlyLimit: 1000000,
  15  |     currency: 'VND',
  16  |     runningTotal: 500000,
  17  |     usagePercentage: 50,
  18  |     isExceeded: false,
  19  |   },
  20  |   {
  21  |     budgetId: 'b2',
  22  |     categoryId: 'cat-2',
  23  |     monthlyLimit: 500000,
  24  |     currency: 'VND',
  25  |     runningTotal: 400000,
  26  |     usagePercentage: 80,
  27  |     isExceeded: false,
  28  |   },
  29  | ]
  30  | 
  31  | const OVER_BUDGET = [
  32  |   {
  33  |     budgetId: 'b3',
  34  |     categoryId: 'cat-1',
  35  |     monthlyLimit: 300000,
  36  |     currency: 'VND',
  37  |     runningTotal: 450000,
  38  |     usagePercentage: 150,
  39  |     isExceeded: true,
  40  |   },
  41  | ]
  42  | 
  43  | async function mockBudgetApis(
  44  |   page: import('@playwright/test').Page,
  45  |   options: { budgets?: typeof BUDGETS } = {},
  46  | ) {
  47  |   const budgetList = options.budgets ?? BUDGETS
  48  | 
  49  |   // Mock ALL API endpoints directly with string patterns
  50  |   await page.route('**/api/users/me', (route) =>
  51  |     route.fulfill({
  52  |       status: 200,
  53  |       contentType: 'application/json',
  54  |       body: JSON.stringify({ data: { id: 'u1', displayName: 'Test User', locale: 'en-US', timezone: 'UTC', defaultCurrency: 'VND', budgetAnchorDay: 1 } }),
  55  |     }),
  56  |   )
  57  | 
  58  |   await page.route('**/api/categories**', (route) =>
  59  |     route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: CATEGORIES, meta: { timestamp: new Date().toISOString(), version: '1.0' } }) }),
  60  |   )
  61  | 
  62  |   await page.route('**/api/budgets/projections**', (route) =>
  63  |     route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [], meta: { timestamp: new Date().toISOString(), version: '1.0' } }) }),
  64  |   )
  65  | 
  66  |   await page.route('**/api/layout**', (route) =>
  67  |     route.fulfill({
  68  |       status: 200,
  69  |       contentType: 'application/json',
  70  |       body: JSON.stringify({ layout: { categories: ['cat-1', 'cat-2', 'cat-3'], budgets: ['cat-1', 'cat-2'] }, version: 1, updatedAt: new Date().toISOString() }),
  71  |     }),
  72  |   )
  73  | 
  74  |   await page.route('**/api/budgets**', async (route) => {
  75  |     if (route.request().method() === 'POST') {
  76  |       await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true, data: {}, meta: { timestamp: new Date().toISOString(), version: '1.0' } }) })
  77  |     } else {
  78  |       await route.fulfill({
  79  |         status: 200,
  80  |         contentType: 'application/json',
  81  |         body: JSON.stringify({ success: true, data: budgetList, meta: { timestamp: new Date().toISOString(), version: '1.0' } }),
  82  |       })
  83  |     }
  84  |   })
  85  | }
  86  | 
  87  | test.describe('Budgets', () => {
  88  |   test.beforeEach(async ({ page }) => {
  89  |     await mockBudgetApis(page)
  90  |     await loginAndGo(page, '/budget')
  91  |     // Wait for page heading to ensure navigation completed
  92  |     await expect(page.getByRole('heading', { name: 'Monthly Budgets' })).toBeVisible({ timeout: 10000 })
  93  |   })
  94  | 
  95  |   // -------------------------------------------------------------------------
  96  |   // List view
  97  |   // -------------------------------------------------------------------------
  98  |   test('renders the Monthly Budgets page heading', async ({ page }) => {
  99  |     await expect(page.getByRole('heading', { name: 'Monthly Budgets' })).toBeVisible()
  100 |   })
  101 | 
  102 |   test('shows active budget count in subtitle', async ({ page }) => {
> 103 |     await expect(page.getByText(/2 active budgets/)).toBeVisible()
      |                                                      ^ Error: expect(locator).toBeVisible() failed
  104 |   })
  105 | 
  106 |   test('renders budget cards with spent and limit amounts', async ({ page }) => {
  107 |     // Both category IDs are shown (category name lookup may fall back to ID)
  108 |     await expect(page.locator('.bg-card.rounded-2xl').first()).toBeVisible()
  109 |     // Progress bars should be present
  110 |     await expect(page.locator('.h-2.bg-muted.rounded-full').first()).toBeVisible()
  111 |   })
  112 | 
  113 |   test('on-track budget shows On track badge', async ({ page }) => {
  114 |     // cat-1 at 50% should be on track
  115 |     await expect(page.getByText('On track').first()).toBeVisible()
  116 |   })
  117 | 
  118 |   test('warning budget (>70%) shows warning badge', async ({ page }) => {
  119 |     // cat-2 at 80% should show warning
  120 |     await expect(page.getByText(/80% used/)).toBeVisible()
  121 |   })
  122 | 
  123 |   test('dashed placeholder card exists to create a new budget', async ({ page }) => {
  124 |     await expect(page.getByText('Create new budget')).toBeVisible()
  125 |     await expect(page.getByText('Set a spending limit by category')).toBeVisible()
  126 |   })
  127 | 
  128 |   // -------------------------------------------------------------------------
  129 |   // Over-budget visual state
  130 |   // -------------------------------------------------------------------------
  131 |   test('over-budget card shows ⚠ Over by... badge', async ({ page }) => {
  132 |     await mockBudgetApis(page, { budgets: OVER_BUDGET })
  133 |     await page.reload()
  134 |     await expect(page.getByText(/Over by/)).toBeVisible()
  135 |   })
  136 | 
  137 |   // -------------------------------------------------------------------------
  138 |   // Create budget
  139 |   // -------------------------------------------------------------------------
  140 |   test('"New Budget" button opens the Set Budget modal', async ({ page }) => {
  141 |     await page.getByRole('button', { name: 'New Budget', exact: true }).click()
  142 |     await expect(page.getByRole('heading', { name: 'Set Budget' })).toBeVisible()
  143 |   })
  144 | 
  145 |   test('clicking the dashed placeholder also opens the modal', async ({ page }) => {
  146 |     await page.getByText('Create new budget').click()
  147 |     await expect(page.getByRole('heading', { name: 'Set Budget' })).toBeVisible()
  148 |   })
  149 | 
  150 |   test('budget modal shows Category select and Amount input', async ({ page }) => {
  151 |     await page.getByRole('button', { name: 'New Budget', exact: true }).click()
  152 |     await expect(page.getByLabel('Category')).toBeVisible()
  153 |     await expect(page.getByLabel('Amount (VND)')).toBeVisible()
  154 |   })
  155 | 
  156 |   test('category select only lists expense categories', async ({ page }) => {
  157 |     await page.getByRole('button', { name: 'New Budget', exact: true }).click()
  158 |     const options = await page.getByLabel('Category').locator('option').allInnerTexts()
  159 |     expect(options).toContain('Food & Dining')
  160 |     expect(options).toContain('Transportation')
  161 |     // Income categories should NOT appear
  162 |     expect(options).not.toContain('Salary')
  163 |   })
  164 | 
  165 |   test('Save is blocked when no category is selected', async ({ page }) => {
  166 |     await page.getByRole('button', { name: 'New Budget', exact: true }).click()
  167 |     // Amount > 0 but no category
  168 |     await page.getByLabel('Amount (VND)').fill('500000')
  169 |     // The handleSetBudget guard checks categoryId and amount > 0
  170 |     let postCalled = false
  171 |     page.on('request', (req) => {
  172 |       if (req.url().includes('/api/budgets') && req.method() === 'POST') postCalled = true
  173 |     })
  174 |     await page.getByRole('button', { name: 'Save' }).click()
  175 |     // Modal should still be open — no POST fired
  176 |     await expect(page.getByRole('heading', { name: 'Set Budget' })).toBeVisible()
  177 |     expect(postCalled).toBe(false)
  178 |   })
  179 | 
  180 |   test('Save is blocked when amount is 0', async ({ page }) => {
  181 |     await page.getByRole('button', { name: 'New Budget', exact: true }).click()
  182 |     await page.getByLabel('Category').selectOption('cat-1')
  183 |     // Leave amount at 0 (default)
  184 |     let postCalled = false
  185 |     page.on('request', (req) => {
  186 |       if (req.url().includes('/api/budgets') && req.method() === 'POST') postCalled = true
  187 |     })
  188 |     await page.getByRole('button', { name: 'Save' }).click()
  189 |     await expect(page.getByRole('heading', { name: 'Set Budget' })).toBeVisible()
  190 |     expect(postCalled).toBe(false)
  191 |   })
  192 | 
  193 |   test('submitting valid budget form calls POST /budgets and closes modal', async ({ page }) => {
  194 |     await page.getByRole('button', { name: 'New Budget', exact: true }).click()
  195 |     await page.getByLabel('Category').selectOption('cat-1')
  196 |     await page.getByLabel('Amount (VND)').fill('800000')
  197 | 
  198 |     const budgetResponse = page.waitForResponse(
  199 |       (res) => res.url().includes('/api/budgets') && res.request().method() === 'POST',
  200 |     )
  201 |     await page.getByRole('button', { name: 'Save' }).click()
  202 |     await budgetResponse
  203 | 
```