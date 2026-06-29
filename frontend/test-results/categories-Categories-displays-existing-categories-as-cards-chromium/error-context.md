# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: categories.spec.ts >> Categories >> displays existing categories as cards
- Location: e2e\categories.spec.ts:79:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Food & Dining')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Food & Dining')

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
  - heading "Categories" [level=1]
  - paragraph: Organize your transactions by category
  - button "New Category":
    - img
    - text: New Category
  - paragraph: No categories yet. Create one to start organizing.
- button "Add Transaction":
  - img
- button "Toggle AI chat"
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | import { loginAndGo } from './helpers/auth'
  3   | 
  4   | const CATEGORIES = [
  5   |   { id: 'cat-1', name: 'Food & Dining', type: 'expense', icon: '🍔', color: '#ef4444' },
  6   |   { id: 'cat-2', name: 'Salary', type: 'income', icon: '💰', color: '#22c55e' },
  7   | ]
  8   | 
  9   | async function mockCategoryApis(
  10  |   page: import('@playwright/test').Page,
  11  |   options: { categories?: typeof CATEGORIES } = {},
  12  | ) {
  13  |   const catList = options.categories ?? CATEGORIES
  14  | 
  15  |   await page.route('**/api/categories', async (route) => {
  16  |     if (route.request().method() === 'GET') {
  17  |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: catList }) })
  18  |     } else if (route.request().method() === 'POST') {
  19  |       const body = JSON.parse(route.request().postData() ?? '{}')
  20  |       await route.fulfill({
  21  |         status: 201,
  22  |         contentType: 'application/json',
  23  |         body: JSON.stringify({ id: 'cat-new', ...body }),
  24  |       })
  25  |     } else {
  26  |       await route.continue()
  27  |     }
  28  |   })
  29  | 
  30  |   await page.route('**/api/categories/*', async (route) => {
  31  |     if (route.request().method() === 'PUT') {
  32  |       const body = JSON.parse(route.request().postData() ?? '{}')
  33  |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'cat-1', ...body }) })
  34  |     } else if (route.request().method() === 'DELETE') {
  35  |       await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  36  |     } else {
  37  |       await route.continue()
  38  |     }
  39  |   })
  40  | 
  41  |   // Layout API mock (must be before catch-all)
  42  |   await page.route('**/api/layout**', (route) =>
  43  |     route.fulfill({
  44  |       status: 200,
  45  |       contentType: 'application/json',
  46  |       body: JSON.stringify({
  47  |         data: {
  48  |           layout: { categories: [], budgets: [] },
  49  |           version: 1,
  50  |           updatedAt: new Date().toISOString()
  51  |         }
  52  |       }),
  53  |     }),
  54  |   )
  55  | 
  56  |   // ponytail: catch-all for unhandled API calls — only intercept fetch/xhr, NOT vite module loads
  57  |   await page.route('**/api/**', (route) => {
  58  |     const type = route.request().resourceType()
  59  |     if (type === 'fetch' || type === 'xhr') {
  60  |       return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) })
  61  |     }
  62  |     return route.continue()
  63  |   })
  64  | }
  65  | 
  66  | test.describe('Categories', () => {
  67  |   test.beforeEach(async ({ page }) => {
  68  |     await mockCategoryApis(page)
  69  |     await loginAndGo(page, '/categories')
  70  |   })
  71  | 
  72  |   // -------------------------------------------------------------------------
  73  |   // List view
  74  |   // -------------------------------------------------------------------------
  75  |   test('renders the Categories page heading', async ({ page }) => {
  76  |     await expect(page.getByRole('heading', { name: 'Categories' })).toBeVisible()
  77  |   })
  78  | 
  79  |   test('displays existing categories as cards', async ({ page }) => {
> 80  |     await expect(page.getByText('Food & Dining')).toBeVisible()
      |                                                   ^ Error: expect(locator).toBeVisible() failed
  81  |     await expect(page.getByText('Salary')).toBeVisible()
  82  |   })
  83  | 
  84  |   test('shows category type label on each card', async ({ page }) => {
  85  |     await expect(page.getByText('expense')).toBeVisible()
  86  |     await expect(page.getByText('income')).toBeVisible()
  87  |   })
  88  | 
  89  |   // -------------------------------------------------------------------------
  90  |   // Create
  91  |   // -------------------------------------------------------------------------
  92  |   test('"New Category" button opens the create modal', async ({ page }) => {
  93  |     await page.getByRole('button', { name: 'New Category' }).click()
  94  |     await expect(page.getByRole('heading', { name: 'New Category' })).toBeVisible()
  95  |   })
  96  | 
  97  |   test('create modal has Name, Type toggle, and Color fields', async ({ page }) => {
  98  |     await page.getByRole('button', { name: 'New Category' }).click()
  99  |     await expect(page.getByLabel('Name')).toBeVisible()
  100 |     await expect(page.getByRole('button', { name: /Expense/ })).toBeVisible()
  101 |     await expect(page.getByRole('button', { name: /Income/ })).toBeVisible()
  102 |     await expect(page.getByLabel('Color')).toBeVisible()
  103 |   })
  104 | 
  105 |   test('Save is blocked when name is empty', async ({ page }) => {
  106 |     await page.getByRole('button', { name: 'New Category' }).click()
  107 |     let postCalled = false
  108 |     page.on('request', (req) => {
  109 |       if (req.url().includes('/api/categories') && req.method() === 'POST') postCalled = true
  110 |     })
  111 |     await page.getByRole('button', { name: 'Save' }).click()
  112 |     // Modal should remain open; no POST
  113 |     await expect(page.getByRole('heading', { name: 'New Category' })).toBeVisible()
  114 |     expect(postCalled).toBe(false)
  115 |   })
  116 | 
  117 |   test('submitting a valid create form calls POST /categories and closes modal', async ({ page }) => {
  118 |     await page.getByRole('button', { name: 'New Category' }).click()
  119 |     await page.getByLabel('Name').fill('Gym')
  120 | 
  121 |     const catResponse = page.waitForResponse(
  122 |       (res) => res.url().includes('/api/categories') && res.request().method() === 'POST',
  123 |     )
  124 |     await page.getByRole('button', { name: 'Save' }).click()
  125 |     await catResponse
  126 | 
  127 |     await expect(page.getByRole('heading', { name: 'New Category' })).not.toBeVisible()
  128 |   })
  129 | 
  130 |   test('POST /categories payload includes name and type', async ({ page }) => {
  131 |     await page.getByRole('button', { name: 'New Category' }).click()
  132 |     await page.getByLabel('Name').fill('Entertainment')
  133 |     // Switch to income type
  134 |     await page.locator('.grid.grid-cols-2').getByRole('button', { name: /Income/ }).click()
  135 | 
  136 |     let capturedBody: Record<string, unknown> = {}
  137 |     page.on('request', (req) => {
  138 |       if (req.url().includes('/api/categories') && req.method() === 'POST') {
  139 |         capturedBody = JSON.parse(req.postData() ?? '{}')
  140 |       }
  141 |     })
  142 | 
  143 |     await page.getByRole('button', { name: 'Save' }).click()
  144 |     await page.waitForResponse(
  145 |       (res) => res.url().includes('/api/categories') && res.request().method() === 'POST',
  146 |     )
  147 | 
  148 |     expect(capturedBody.name).toBe('Entertainment')
  149 |     expect(capturedBody.type).toBe('income')
  150 |   })
  151 | 
  152 |   test('type defaults to expense in the create form', async ({ page }) => {
  153 |     await page.getByRole('button', { name: 'New Category' }).click()
  154 |     await page.getByLabel('Name').fill('Utilities')
  155 | 
  156 |     let capturedBody: Record<string, unknown> = {}
  157 |     page.on('request', (req) => {
  158 |       if (req.url().includes('/api/categories') && req.method() === 'POST') {
  159 |         capturedBody = JSON.parse(req.postData() ?? '{}')
  160 |       }
  161 |     })
  162 | 
  163 |     await page.getByRole('button', { name: 'Save' }).click()
  164 |     await page.waitForResponse(
  165 |       (res) => res.url().includes('/api/categories') && res.request().method() === 'POST',
  166 |     )
  167 | 
  168 |     expect(capturedBody.type).toBe('expense')
  169 |   })
  170 | 
  171 |   // -------------------------------------------------------------------------
  172 |   // Edit
  173 |   // -------------------------------------------------------------------------
  174 |   test('clicking a category card opens the edit modal', async ({ page }) => {
  175 |     await page.getByText('Food & Dining').click()
  176 |     await expect(page.getByRole('heading', { name: 'Edit Category' })).toBeVisible()
  177 |   })
  178 | 
  179 |   test('edit modal is pre-filled with existing values', async ({ page }) => {
  180 |     await page.getByText('Food & Dining').click()
```