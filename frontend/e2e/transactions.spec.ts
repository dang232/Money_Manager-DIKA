import { test, expect } from '@playwright/test'
import { loginAndGo } from './helpers/auth'

const CATEGORIES = [
  { id: 'cat-1', name: 'Food & Dining', type: 'expense' },
  { id: 'cat-2', name: 'Transportation', type: 'expense' },
  { id: 'cat-3', name: 'Salary', type: 'income' },
]

const TRANSACTIONS = [
  {
    id: 'tx-1',
    amount: 150000,
    type: 'expense',
    categoryId: 'cat-1',
    categoryName: 'Food & Dining',
    description: 'Lunch at cafe',
    date: '2026-06-20T00:00:00.000Z',
    createdAt: '2026-06-20T10:00:00.000Z',
  },
  {
    id: 'tx-2',
    amount: 5000000,
    type: 'income',
    categoryId: 'cat-3',
    categoryName: 'Salary',
    description: 'Monthly salary',
    date: '2026-06-15T00:00:00.000Z',
    createdAt: '2026-06-15T09:00:00.000Z',
  },
]

async function mockTransactionApis(
  page: import('@playwright/test').Page,
  options: { transactions?: typeof TRANSACTIONS } = {},
) {
  const txList = options.transactions ?? TRANSACTIONS

  await page.route('**/api/categories**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CATEGORIES) }),
  )

  await page.route('**/api/transactions', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: txList, total: txList.length }),
      })
    } else if (route.request().method() === 'POST') {
      const body = JSON.parse(route.request().postData() ?? '{}')
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'tx-new', ...body, categoryName: CATEGORIES.find((c) => c.id === body.categoryId)?.name }),
      })
    } else {
      await route.continue()
    }
  })

  await page.route('**/api/transactions/*', async (route) => {
    if (route.request().method() === 'PUT') {
      const body = JSON.parse(route.request().postData() ?? '{}')
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'tx-1', ...body }) })
    } else if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    } else {
      await route.continue()
    }
  })

  await page.route('**/api/**', (route) => {
    const type = route.request().resourceType()
    if (type === 'fetch' || type === 'xhr') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) })
    }
    return route.continue()
  })
}

test.describe('Transactions', () => {
  test.beforeEach(async ({ page }) => {
    await mockTransactionApis(page)
    await loginAndGo(page, '/transactions')
  })

  // -------------------------------------------------------------------------
  // List view
  // -------------------------------------------------------------------------
  test('renders the transactions page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible()
  })

  test('shows total count in subtitle', async ({ page }) => {
    await expect(page.getByText(/2 transactions/)).toBeVisible()
  })

  test('lists transactions grouped by date', async ({ page }) => {
    await expect(page.getByText('Lunch at cafe')).toBeVisible()
    await expect(page.getByText('Monthly salary')).toBeVisible()
  })

  test('expense amounts are prefixed with minus', async ({ page }) => {
    // Food & Dining 150,000 expense
    await expect(page.getByText(/-.*150/)).toBeVisible()
  })

  test('income amounts are prefixed with plus', async ({ page }) => {
    await expect(page.getByText(/\+.*5\.000\.000|5,000,000|\+/)).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // Filters
  // -------------------------------------------------------------------------
  test('clicking Income filter calls GET /transactions with type=income', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/transactions') && res.url().includes('type=income'),
    )
    await page.getByRole('button', { name: 'Income' }).click()
    await responsePromise
  })

  test('clicking Expenses filter calls GET /transactions with type=expense', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/transactions') && res.url().includes('type=expense'),
    )
    await page.getByRole('button', { name: 'Expenses' }).click()
    await responsePromise
  })

  test('selecting a category filter calls GET /transactions with categoryId', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/transactions') && res.url().includes('categoryId='),
    )
    await page.getByRole('combobox').selectOption('cat-1')
    await responsePromise
  })

  test('Clear button appears after applying a filter and resets it', async ({ page }) => {
    await page.getByRole('button', { name: 'Income' }).click()
    const clearButton = page.getByRole('button', { name: 'Clear' })
    await expect(clearButton).toBeVisible()
    await clearButton.click()
    await expect(clearButton).not.toBeVisible()
  })

  // -------------------------------------------------------------------------
  // ?add=1 auto-opens create form
  // -------------------------------------------------------------------------
  test('?add=1 query param opens the TransactionForm modal on load', async ({ page }) => {
    await loginAndGo(page, '/transactions?add=1')
    await expect(page.getByRole('heading', { name: 'New Transaction' })).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // Create
  // -------------------------------------------------------------------------
  test('clicking Add Transaction opens the create modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Transaction' }).click()
    await expect(page.getByRole('heading', { name: 'New Transaction' })).toBeVisible()
  })

  test('create form has type toggle, amount, category, description, date fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Transaction' }).click()
    await expect(page.getByRole('button', { name: /Expense/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Income/ })).toBeVisible()
    await expect(page.getByLabel('Amount')).toBeVisible()
    await expect(page.getByLabel('Category')).toBeVisible()
    await expect(page.getByLabel('Description')).toBeVisible()
    await expect(page.getByLabel('Date')).toBeVisible()
  })

  test('create form shows validation error when amount is 0', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Transaction' }).click()
    await page.getByRole('button', { name: 'Save Transaction' }).click()
    await expect(page.getByText('Amount must be greater than 0')).toBeVisible()
  })

  test('create form shows validation error when category is not selected', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Transaction' }).click()
    await page.getByLabel('Amount').fill('100000')
    await page.getByRole('button', { name: 'Save Transaction' }).click()
    await expect(page.getByText('Category is required')).toBeVisible()
  })

  test('submitting create form calls POST /transactions and closes modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Transaction' }).click()

    await page.getByLabel('Amount').fill('200000')
    await page.getByLabel('Category').selectOption('cat-1')
    await page.getByLabel('Description').fill('Test expense')

    const txResponse = page.waitForResponse(
      (res) => res.url().includes('/api/transactions') && res.request().method() === 'POST',
    )
    await page.getByRole('button', { name: 'Save Transaction' }).click()
    await txResponse

    await expect(page.getByRole('heading', { name: 'New Transaction' })).not.toBeVisible()
  })

  test('income type toggle filters category dropdown to income categories', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Transaction' }).click()
    // Switch to income
    await page.locator('.grid.grid-cols-2').getByRole('button', { name: /Income/ }).click()
    const options = await page.getByLabel('Category').locator('option').allInnerTexts()
    const filtered = options.filter((o) => o !== 'Select category')
    expect(filtered).toContain('Salary')
    expect(filtered).not.toContain('Food & Dining')
  })

  test('Cancel button in create form closes the modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Transaction' }).click()
    await expect(page.getByRole('heading', { name: 'New Transaction' })).toBeVisible()
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('heading', { name: 'New Transaction' })).not.toBeVisible()
  })

  test('clicking backdrop closes the create modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Transaction' }).click()
    await expect(page.getByRole('heading', { name: 'New Transaction' })).toBeVisible()
    // Click the backdrop (fixed overlay, outside the dialog card)
    await page.locator('.fixed.inset-0').click({ position: { x: 10, y: 10 } })
    await expect(page.getByRole('heading', { name: 'New Transaction' })).not.toBeVisible()
  })

  // -------------------------------------------------------------------------
  // Edit
  // -------------------------------------------------------------------------
  test('clicking a transaction row opens the edit modal pre-populated', async ({ page }) => {
    await page.getByText('Lunch at cafe').click()
    await expect(page.getByRole('heading', { name: 'Edit Transaction' })).toBeVisible()
    // Amount should be pre-filled
    await expect(page.getByLabel('Amount')).toHaveValue('150000')
    await expect(page.getByLabel('Description')).toHaveValue('Lunch at cafe')
  })

  test('editing a transaction calls PUT /transactions/:id', async ({ page }) => {
    await page.getByText('Lunch at cafe').click()
    await expect(page.getByRole('heading', { name: 'Edit Transaction' })).toBeVisible()

    await page.getByLabel('Description').fill('Updated description')

    const putResponse = page.waitForResponse(
      (res) => res.url().includes('/api/transactions/tx-1') && res.request().method() === 'PUT',
    )
    await page.getByRole('button', { name: 'Save Transaction' }).click()
    await putResponse
  })

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------
  test('hovering a row reveals the Delete button', async ({ page }) => {
    const row = page.locator('.grid.grid-cols-\\[44px_1fr_auto_auto\\]').filter({ hasText: 'Lunch at cafe' })
    await row.hover()
    await expect(row.getByRole('button', { name: 'Delete' })).toBeVisible()
  })

  test('clicking Delete calls DELETE /transactions/:id', async ({ page }) => {
    const row = page.locator('.grid.grid-cols-\\[44px_1fr_auto_auto\\]').filter({ hasText: 'Lunch at cafe' })
    await row.hover()

    const deleteResponse = page.waitForResponse(
      (res) => res.url().includes('/api/transactions/tx-1') && res.request().method() === 'DELETE',
    )
    await row.getByRole('button', { name: 'Delete' }).click()
    await deleteResponse
  })

  // -------------------------------------------------------------------------
  // Empty state
  // -------------------------------------------------------------------------
  test('shows empty state when no transactions exist', async ({ page }) => {
    await page.route('**/api/transactions', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [], total: 0 }) }),
    )
    await page.reload()
    await expect(page.getByText('No transactions found')).toBeVisible()
  })
})
