# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: budgets.spec.ts >> Budgets >> "Edit" button on a card opens the modal pre-filled with that category
- Location: e2e\budgets.spec.ts:233:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('.bg-card.rounded-2xl').first().getByRole('button', { name: 'Edit' })

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e5]:
      - img [ref=e7]
      - generic [ref=e9]:
        - generic [ref=e10]: Money Manager
        - generic [ref=e11]: Personal finance
    - navigation [ref=e12]:
      - paragraph [ref=e13]: Main
      - link "Dashboard" [ref=e14] [cursor=pointer]:
        - /url: /dashboard
        - img [ref=e15]
        - generic [ref=e20]: Dashboard
      - link "Transactions" [ref=e21] [cursor=pointer]:
        - /url: /transactions
        - img [ref=e22]
        - generic [ref=e25]: Transactions
      - link "Budgets" [ref=e26] [cursor=pointer]:
        - /url: /budget
        - img [ref=e27]
        - generic [ref=e31]: Budgets
      - link "Categories" [ref=e32] [cursor=pointer]:
        - /url: /categories
        - img [ref=e33]
        - generic [ref=e36]: Categories
      - link "Reports" [ref=e37] [cursor=pointer]:
        - /url: /reports
        - img [ref=e38]
        - generic [ref=e40]: Reports
      - paragraph [ref=e41]: Account
      - link "Settings" [ref=e42] [cursor=pointer]:
        - /url: /settings
        - img [ref=e43]
        - generic [ref=e46]: Settings
    - generic [ref=e47]:
      - generic [ref=e48]:
        - heading "Go Premium" [level=4] [ref=e49]
        - paragraph [ref=e50]: Unlimited budgets & advanced reports
        - button "Upgrade →" [ref=e51] [cursor=pointer]
      - button "Dark" [ref=e52] [cursor=pointer]:
        - img [ref=e53]
        - generic [ref=e55]: Dark
      - button "Collapse" [ref=e56] [cursor=pointer]:
        - img [ref=e57]
        - generic [ref=e59]: Collapse
      - button "Logout" [ref=e60] [cursor=pointer]:
        - img [ref=e61]
        - generic [ref=e64]: Logout
  - generic [ref=e65]:
    - banner [ref=e66]:
      - generic [ref=e67]:
        - img [ref=e68]
        - textbox "Search transactions, categories, budgets..." [ref=e71]
      - generic [ref=e72]:
        - button [ref=e73] [cursor=pointer]:
          - img [ref=e74]
        - generic [ref=e78] [cursor=pointer]: DA
    - main [ref=e79]:
      - generic [ref=e81]:
        - generic [ref=e82]:
          - generic [ref=e83]:
            - heading "Monthly Budgets" [level=1] [ref=e84]
            - paragraph [ref=e85]: 0 active budgets
          - button "New Budget" [ref=e86] [cursor=pointer]:
            - img [ref=e87]
            - text: New Budget
        - button "Create new budget Set a spending limit by category" [ref=e89] [cursor=pointer]:
          - generic [ref=e90]:
            - img [ref=e92]
            - paragraph [ref=e93]: Create new budget
            - paragraph [ref=e94]: Set a spending limit by category
        - paragraph [ref=e95]: No budgets configured. Set a budget to start tracking spending.
  - button "Add Transaction" [ref=e96] [cursor=pointer]:
    - img [ref=e97]
  - button "Toggle AI chat" [ref=e99] [cursor=pointer]:
    - img [ref=e100]
```

# Test source

```ts
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
> 236 |     await firstCard.getByRole('button', { name: 'Edit' }).click()
      |                                                           ^ Error: locator.click: Test timeout of 30000ms exceeded.
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
  260 |   // -------------------------------------------------------------------------
  261 |   // Empty state
  262 |   // -------------------------------------------------------------------------
  263 |   test('shows empty state message when no budgets exist', async ({ page }) => {
  264 |     await mockBudgetApis(page, { budgets: [] })
  265 |     await page.reload()
  266 |     await expect(page.getByText('No budgets configured. Set a budget to start tracking spending.')).toBeVisible()
  267 |   })
  268 | })
  269 | 
```