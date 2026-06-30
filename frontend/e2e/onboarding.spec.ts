import { test, expect } from '@playwright/test'
import { seedAuth } from './helpers/auth'

// Shared mock API helper for onboarding tests
async function mockOnboardingApis(page: import('@playwright/test').Page) {
  let categoryIdCounter = 1

  await page.route('**/api/categories', async (route) => {
    if (route.request().method() === 'POST') {
      const body = JSON.parse(route.request().postData() ?? '{}')
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: `cat-${categoryIdCounter++}`,
          ...body,
        }),
      })
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'cat-1', name: 'Salary', type: 'income' },
          { id: 'cat-2', name: 'Food & Dining', type: 'expense' },
          { id: 'cat-3', name: 'Transportation', type: 'expense' },
          { id: 'cat-4', name: 'Shopping', type: 'expense' },
          { id: 'cat-5', name: 'Bills & Utilities', type: 'expense' },
        ]),
      })
    }
  })

  await page.route('**/api/budgets', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 201, contentType: 'application/json', body: '{}' })
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    }
  })

  await page.route('**/api/transactions', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'tx-1', amount: 100000, type: 'expense', categoryId: 'cat-2', description: 'Test', date: new Date().toISOString() }),
      })
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [], total: 0 }) })
    }
  })

  // Catch-all for dashboard redirect (fetch/xhr only)
  await page.route('**/api/**', (route) => {
    const type = route.request().resourceType()
    if (type === 'fetch' || type === 'xhr') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) })
    }
    return route.continue()
  })
}

test.describe('Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page)
    await mockOnboardingApis(page)
    await page.goto('/onboarding')
    // ponytail: clear flag after navigation so localStorage is accessible
    await page.evaluate(() => localStorage.removeItem('mm-onboarded'))
  })

  // -------------------------------------------------------------------------
  // Step 1 — Categories
  // -------------------------------------------------------------------------
  test('renders step 1 with default category options', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Choose your categories' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Salary/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Food & Dining/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Transportation/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Shopping/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Bills & Utilities/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Entertainment/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Healthcare/ })).toBeVisible()
  })

  test('Continue is disabled when no category is selected', async ({ page }) => {
    // Deselect all pre-selected defaults
    for (const name of ['Salary', 'Food & Dining', 'Transportation', 'Shopping', 'Bills & Utilities']) {
      await page.getByRole('button', { name: new RegExp(name) }).click()
    }
    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled()
  })

  test('can add a custom category and proceed', async ({ page }) => {
    await page.getByPlaceholder('Add custom category...').fill('Gym')
    await page.getByRole('button', { name: 'Add' }).click()
    await expect(page.getByText('Gym')).toBeVisible()
  })

  test('custom category can be added with Enter key', async ({ page }) => {
    await page.getByPlaceholder('Add custom category...').fill('Books')
    await page.getByPlaceholder('Add custom category...').press('Enter')
    await expect(page.getByText('Books')).toBeVisible()
  })

  test('step 1 Continue calls POST /categories and advances to step 2', async ({ page }) => {
    const requests: string[] = []
    page.on('request', (req) => {
      if (req.url().includes('/api/categories') && req.method() === 'POST') {
        requests.push(req.postData() ?? '')
      }
    })

    await page.getByRole('button', { name: 'Continue' }).click()
    // Wait for step 2 heading
    await expect(page.getByRole('heading', { name: 'Set monthly budgets' })).toBeVisible()
    // At least one POST should have fired for the pre-selected categories
    expect(requests.length).toBeGreaterThan(0)
  })

  // -------------------------------------------------------------------------
  // Step 2 — Budgets
  // -------------------------------------------------------------------------
  test('step 2 shows expense categories with amount inputs', async ({ page }) => {
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByRole('heading', { name: 'Set monthly budgets' })).toBeVisible()
    // Expense category inputs should be present
    await expect(page.getByPlaceholder('0').first()).toBeVisible()
  })

  test('Skip on step 2 advances to step 3 without calling POST /budgets', async ({ page }) => {
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByRole('heading', { name: 'Set monthly budgets' })).toBeVisible()

    let budgetPostCalled = false
    page.on('request', (req) => {
      if (req.url().includes('/api/budgets') && req.method() === 'POST') budgetPostCalled = true
    })

    await page.getByRole('button', { name: 'Skip' }).click()
    await expect(page.getByRole('heading', { name: 'Your first transaction' })).toBeVisible()
    expect(budgetPostCalled).toBe(false)
  })

  test('step 2 Continue with budget amounts calls POST /budgets', async ({ page }) => {
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByRole('heading', { name: 'Set monthly budgets' })).toBeVisible()

    // Fill the first budget input
    const firstInput = page.getByPlaceholder('0').first()
    await firstInput.fill('500000')

    const budgetResponse = page.waitForResponse('**/api/budgets')
    await page.getByRole('button', { name: 'Continue' }).click()
    await budgetResponse

    await expect(page.getByRole('heading', { name: 'Your first transaction' })).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // Step 3 — First Transaction
  // -------------------------------------------------------------------------
  test('step 3 shows the first transaction form', async ({ page }) => {
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: 'Skip' }).click()
    await expect(page.getByRole('heading', { name: 'Your first transaction' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Expense' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Income' })).toBeVisible()
    await expect(page.getByPlaceholder('Amount')).toBeVisible()
    await expect(page.getByPlaceholder('Description')).toBeVisible()
  })

  test('Skip on step 3 navigates to /dashboard without POST /transactions', async ({ page }) => {
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: 'Skip' }).click()
    await expect(page.getByRole('heading', { name: 'Your first transaction' })).toBeVisible()

    let txPostCalled = false
    page.on('request', (req) => {
      if (req.url().includes('/api/transactions') && req.method() === 'POST') txPostCalled = true
    })

    await page.getByRole('button', { name: 'Skip' }).click()
    await expect(page).toHaveURL('/dashboard')
    expect(txPostCalled).toBe(false)

    const onboarded = await page.evaluate(() => localStorage.getItem('mm-onboarded'))
    expect(onboarded).toBe('true')
  })

  test('step 3 Get Started calls POST /transactions and navigates to /dashboard', async ({ page }) => {
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: 'Skip' }).click()
    await expect(page.getByRole('heading', { name: 'Your first transaction' })).toBeVisible()

    await page.getByPlaceholder('Amount').fill('100000')
    // Select category (first expense option)
    await page.getByRole('combobox').selectOption({ index: 1 })

    const txResponse = page.waitForResponse('**/api/transactions')
    await page.getByRole('button', { name: 'Get Started' }).click()
    await txResponse

    await expect(page).toHaveURL('/dashboard')
  })

  test('type toggle on step 3 filters the category dropdown', async ({ page }) => {
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: 'Skip' }).click()

    // Default is expense
    await expect(page.getByRole('button', { name: 'Expense' })).toBeVisible()

    // Switch to income
    await page.getByRole('button', { name: 'Income' }).click()
    // The select should now only show income categories (Salary)
    const options = await page.getByRole('combobox').locator('option').allInnerTexts()
    const filtered = options.filter((o) => o !== 'Select category')
    expect(filtered.every((o) => o === 'Salary')).toBe(true)
  })

  // -------------------------------------------------------------------------
  // Full happy path
  // -------------------------------------------------------------------------
  test('completes all 3 steps and lands on dashboard', async ({ page }) => {
    // Step 1
    await page.getByRole('button', { name: 'Continue' }).click()
    // Step 2
    await expect(page.getByRole('heading', { name: 'Set monthly budgets' })).toBeVisible()
    await page.getByRole('button', { name: 'Skip' }).click()
    // Step 3
    await expect(page.getByRole('heading', { name: 'Your first transaction' })).toBeVisible()
    await page.getByRole('button', { name: 'Skip' }).click()

    await expect(page).toHaveURL('/dashboard')
  })
})
