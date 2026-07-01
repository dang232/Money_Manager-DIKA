# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: budgets.spec.ts >> Budgets >> category select only lists expense categories
- Location: e2e\budgets.spec.ts:156:3

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected value: "Food & Dining"
Received array: ["Select category"]
```

# Page snapshot

```yaml
- generic:
  - generic:
    - generic:
      - complementary:
        - generic:
          - generic:
            - img
          - generic:
            - generic: Money Manager
            - generic: Personal finance
        - navigation:
          - paragraph: Main
          - link:
            - /url: /dashboard
            - img
            - generic: Dashboard
          - link:
            - /url: /transactions
            - img
            - generic: Transactions
          - link:
            - /url: /budget
            - img
            - generic: Budgets
          - link:
            - /url: /categories
            - img
            - generic: Categories
          - link:
            - /url: /reports
            - img
            - generic: Reports
          - paragraph: Account
          - link:
            - /url: /settings
            - img
            - generic: Settings
        - generic:
          - generic:
            - heading [level=4]: Go Premium
            - paragraph: Unlimited budgets & advanced reports
            - button: Upgrade →
          - button:
            - img
            - generic: Dark
          - button:
            - img
            - generic: Collapse
          - button:
            - img
            - generic: Logout
      - generic:
        - banner:
          - generic:
            - img
            - textbox:
              - /placeholder: Search transactions, categories, budgets...
          - generic:
            - button:
              - img
            - generic: DA
        - main:
          - generic:
            - generic:
              - generic:
                - generic:
                  - heading [level=1]: Monthly Budgets
                  - paragraph: 0 active budgets
                - button:
                  - img
                  - text: New Budget
              - generic:
                - button:
                  - generic:
                    - generic:
                      - img
                    - paragraph: Create new budget
                    - paragraph: Set a spending limit by category
              - paragraph: No budgets configured. Set a budget to start tracking spending.
      - button:
        - img
      - generic:
        - button:
          - img
  - dialog "Set Budget" [ref=e2]:
    - generic [ref=e3]:
      - heading "Set Budget" [level=2] [ref=e4]
      - generic [ref=e5]:
        - generic [ref=e7]:
          - img [ref=e8]
          - generic [ref=e10]:
            - paragraph [ref=e11]: Failed to create budget
            - paragraph [ref=e12]: An unexpected error occurred
        - generic [ref=e14]:
          - img [ref=e15]
          - generic [ref=e17]:
            - paragraph [ref=e18]: No expense categories yet
            - paragraph [ref=e19]: You need at least one category to create a budget.
            - button "Go to Categories →" [active] [ref=e20] [cursor=pointer]
        - generic [ref=e21]:
          - generic [ref=e22]: Category
          - combobox "Category" [ref=e23]:
            - option "Select category" [disabled] [selected]
        - generic [ref=e24]:
          - generic [ref=e25]: Amount (VND)
          - spinbutton "Amount (VND)" [ref=e26]: "0"
        - generic [ref=e27]:
          - button "Cancel" [ref=e28] [cursor=pointer]
          - button "Save" [disabled]
    - button "Close" [ref=e29] [cursor=pointer]:
      - img [ref=e30]
      - generic [ref=e33]: Close
```

# Test source

```ts
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
  103 |     await expect(page.getByText(/2 active budgets/)).toBeVisible()
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
> 159 |     expect(options).toContain('Food & Dining')
      |                     ^ Error: expect(received).toContain(expected) // indexOf
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
  204 |     await expect(page.getByRole('heading', { name: 'Set Budget' })).not.toBeVisible()
  205 |   })
  206 | 
  207 |   test.skip('POST /budgets payload includes categoryId, monthlyLimit, currency, year, month', async ({ page }) => {
  208 |     // Skipped: requires mock to properly intercept POST request
  209 |     await page.getByRole('button', { name: 'New Budget', exact: true }).click()
  210 |     await page.getByLabel('Category').selectOption('cat-1')
  211 |     await page.getByLabel('Amount (VND)').fill('600000')
  212 | 
  213 |     let capturedBody: Record<string, unknown> = {}
  214 |     page.on('request', (req) => {
  215 |       if (req.url().includes('/api/budgets') && req.method() === 'POST') {
  216 |         capturedBody = JSON.parse(req.postData() ?? '{}')
  217 |       }
  218 |     })
  219 | 
  220 |     await page.getByRole('button', { name: 'Save' }).click()
  221 |     await page.waitForResponse((res) => res.url().includes('/api/budgets') && res.request().method() === 'POST')
  222 | 
  223 |     expect(capturedBody.categoryId).toBe('cat-1')
  224 |     expect(capturedBody.monthlyLimit).toBe(600000)
  225 |     expect(capturedBody.currency).toBe('VND')
  226 |     expect(capturedBody.year).toBeDefined()
  227 |     expect(capturedBody.month).toBeDefined()
  228 |   })
  229 | 
  230 |   // -------------------------------------------------------------------------
  231 |   // Edit budget
  232 |   // -------------------------------------------------------------------------
  233 |   test('"Edit" button on a card opens the modal pre-filled with that category', async ({ page }) => {
  234 |     // Hover to reveal the Edit button on the first card
  235 |     const firstCard = page.locator('.bg-card.rounded-2xl').first()
  236 |     await firstCard.getByRole('button', { name: 'Edit' }).click()
  237 |     await expect(page.getByRole('heading', { name: 'Set Budget' })).toBeVisible()
  238 |     // The category should be pre-selected
  239 |     const selectedValue = await page.getByLabel('Category').inputValue()
  240 |     expect(selectedValue).toBe('cat-1')
  241 |   })
  242 | 
  243 |   // -------------------------------------------------------------------------
  244 |   // Cancel / dismiss
  245 |   // -------------------------------------------------------------------------
  246 |   test('Cancel button closes the modal without posting', async ({ page }) => {
  247 |     await page.getByRole('button', { name: 'New Budget', exact: true }).click()
  248 |     await expect(page.getByRole('heading', { name: 'Set Budget' })).toBeVisible()
  249 |     await page.getByRole('button', { name: 'Cancel' }).click()
  250 |     await expect(page.getByRole('heading', { name: 'Set Budget' })).not.toBeVisible()
  251 |   })
  252 | 
  253 |   test('clicking backdrop closes the budget modal', async ({ page }) => {
  254 |     await page.getByRole('button', { name: 'New Budget', exact: true }).click()
  255 |     await expect(page.getByRole('heading', { name: 'Set Budget' })).toBeVisible()
  256 |     await page.locator('.fixed.inset-0').click({ position: { x: 10, y: 10 } })
  257 |     await expect(page.getByRole('heading', { name: 'Set Budget' })).not.toBeVisible()
  258 |   })
  259 | 
```