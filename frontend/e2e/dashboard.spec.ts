import { test, expect } from '@playwright/test'
import { loginAndGo } from './helpers/auth'

const SUMMARY = { totalIncome: 5000000, totalExpense: 2000000, netAmount: 3000000 }

const MONTHLY_TREND = [
  { year: 2026, month: 1, totalIncome: 4000000, totalExpense: 1500000 },
  { year: 2026, month: 2, totalIncome: 5000000, totalExpense: 2000000 },
]

const CATEGORY_BREAKDOWN = [
  { categoryId: 'cat-1', total: 800000, count: 5 },
  { categoryId: 'cat-2', total: 1200000, count: 8 },
]

const CATEGORIES = [
  { id: 'cat-1', name: 'Food & Dining', type: 'expense' },
  { id: 'cat-2', name: 'Transportation', type: 'expense' },
]

const BUDGETS: {
  budgetId: string
  categoryId: string
  monthlyLimit: number
  currency: string
  runningTotal: number
  usagePercentage: number
  isExceeded: boolean
}[] = [
  { budgetId: 'b1', categoryId: 'cat-1', monthlyLimit: 1000000, currency: 'USD', runningTotal: 800000, usagePercentage: 80, isExceeded: false },
  { budgetId: 'b2', categoryId: 'cat-2', monthlyLimit: 500000, currency: 'USD', runningTotal: 550000, usagePercentage: 110, isExceeded: true },
]

async function mockDashboardApis(page: import('@playwright/test').Page) {
  await page.route('**/api/dashboard', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ summary: SUMMARY, budgetHealth: BUDGETS, recentTransactions: [] }),
    }),
  )
  await page.route('**/api/transactions/monthly-trend**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MONTHLY_TREND) }),
  )
  await page.route('**/api/transactions/category-breakdown**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CATEGORY_BREAKDOWN) }),
  )
  await page.route('**/api/budgets**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(BUDGETS) }),
  )
  await page.route('**/api/categories**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CATEGORIES) }),
  )
  await page.route('**/api/users/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { id: 'u1', displayName: 'Test User', avatarUrl: null, locale: 'en-US', timezone: 'UTC', defaultCurrency: 'VND', budgetAnchorDay: 1 } }),
    }),
  )
  // Catch-all for any remaining API calls (fetch/xhr only — don't intercept Vite module loads)
  await page.route('**/api/**', (route) => {
    const type = route.request().resourceType()
    if (type === 'fetch' || type === 'xhr') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) })
    }
    return route.continue()
  })
}

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await mockDashboardApis(page)
    await loginAndGo(page, '/dashboard')
  })

  // -------------------------------------------------------------------------
  // Stat cards
  // -------------------------------------------------------------------------
  test('shows personalised greeting with display name', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Hi, Test User/ })).toBeVisible()
  })

  test('renders Total Balance stat card', async ({ page }) => {
    // 3,000,000 VND formatted
    await expect(page.getByText('Total Balance')).toBeVisible()
    // The value is rendered via formatVND — just check the card section exists
    await expect(page.locator('.bg-card').filter({ hasText: 'Total Balance' })).toBeVisible()
  })

  test('renders Income stat card', async ({ page }) => {
    await expect(page.getByText('Income')).toBeVisible()
    await expect(page.locator('.bg-card').filter({ hasText: 'Income' }).first()).toBeVisible()
  })

  test('renders Expenses stat card', async ({ page }) => {
    await expect(page.getByText('Expenses')).toBeVisible()
  })

  test('renders Savings Rate stat card', async ({ page }) => {
    await expect(page.getByText('Savings Rate')).toBeVisible()
    // 60% savings rate: (5M - 2M) / 5M * 100
    await expect(page.getByText('60.0%')).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // Charts
  // -------------------------------------------------------------------------
  test('renders Cash Flow chart section', async ({ page }) => {
    await expect(page.getByText('Cash Flow')).toBeVisible()
    await expect(page.getByText('Income vs expenses over time')).toBeVisible()
    // Canvas element should be present (Chart.js renders to canvas)
    await expect(page.locator('canvas').first()).toBeVisible()
  })

  test('renders Spending by Category donut chart section', async ({ page }) => {
    await expect(page.getByText('Spending by Category')).toBeVisible()
    await expect(page.getByText('Top categories this month')).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // Active Budgets section
  // -------------------------------------------------------------------------
  test('renders Active Budgets section when budgets exist', async ({ page }) => {
    await expect(page.getByText('Active Budgets')).toBeVisible()
    await expect(page.getByText('Budget progress this month')).toBeVisible()
  })

  test('shows on-track budget with correct label', async ({ page }) => {
    // cat-1 is 80% used → warning "⚠ 80% used"
    await expect(page.getByText(/80% used/)).toBeVisible()
  })

  test('shows over-budget indicator for exceeded budget', async ({ page }) => {
    // cat-2 is 110% → "⚠ Over budget"
    await expect(page.getByText(/Over budget/)).toBeVisible()
  })

  test('"View all" link navigates to /budget', async ({ page }) => {
    await page.getByRole('button', { name: 'View all' }).click()
    await expect(page).toHaveURL('/budget')
  })

  // -------------------------------------------------------------------------
  // Add Transaction CTA
  // -------------------------------------------------------------------------
  test('"Add Transaction" button navigates to /transactions?add=1', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Transaction' }).click()
    await expect(page).toHaveURL(/\/transactions\?add=1/)
  })

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------
  test('shows loading indicator before data arrives', async ({ page }) => {
    // Re-route with a delay — need fresh page
    await page.route('**/api/dashboard', async (route) => {
      await new Promise((r) => setTimeout(r, 300))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ summary: SUMMARY, budgetHealth: [], recentTransactions: [] }),
      })
    })
    const loadingVisible = page.getByText('Loading...')
    await page.goto('/dashboard')
    // Loading text should appear at some point before disappearing
    await expect(loadingVisible).toBeVisible({ timeout: 1000 })
  })
})
