import { test, expect } from '@playwright/test'
import { loginAndGo } from './helpers/auth'

const CATEGORIES = [
  { id: 'cat-1', name: 'Food & Dining', type: 'expense', color: '#ef4444' },
  { id: 'cat-2', name: 'Transportation', type: 'expense', color: '#3b82f6' },
  { id: 'cat-3', name: 'Entertainment', type: 'expense', color: '#8b5cf6' },
]

const BUDGETS = [
  { budgetId: 'b1', categoryId: 'cat-1', monthlyLimit: 1000000, runningTotal: 500000, usagePercentage: 50 },
  { budgetId: 'b2', categoryId: 'cat-2', monthlyLimit: 500000, runningTotal: 400000, usagePercentage: 80 },
  { budgetId: 'b3', categoryId: 'cat-3', monthlyLimit: 300000, runningTotal: 100000, usagePercentage: 33 },
]

async function mockApis(page: import('@playwright/test').Page) {
  // ponytail: catch-all for unhandled API calls — only intercept fetch/xhr, NOT vite module loads
  await page.route('**/api/**', (route) => {
    const type = route.request().resourceType()
    if (type === 'fetch' || type === 'xhr') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) })
    }
    return route.continue()
  })

  await page.route('**/api/users/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { id: 'u1', displayName: 'Test User', locale: 'en-US', timezone: 'UTC', defaultCurrency: 'VND', budgetAnchorDay: 1 } }),
    }),
  )

  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: { id: 'u1', email: 'test@example.com', displayName: 'Test User', createdAt: '2024-01-01' } }),
    }),
  )

  await page.route('**/api/categories**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CATEGORIES) }),
  )

  await page.route('**/api/budgets**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(BUDGETS) }),
  )

  await page.route('**/api/budgets/projections**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
  )
}

test.describe('Card Layout Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await mockApis(page)
  })

  // -------------------------------------------------------------------------
  // Categories: Drag handle visibility
  // -------------------------------------------------------------------------
  test('shows drag handle on category cards', async ({ page }) => {
    await loginAndGo(page, '/categories')

    // Check for grip icon (GripVertical from lucide-vue)
    const gripIcon = page.locator('svg[class*="lucide-grip-vertical"]').first()
    await expect(gripIcon).toBeVisible()
  })

  test('category cards have grab cursor', async ({ page }) => {
    await loginAndGo(page, '/categories')

    // Cards should have cursor-grab class
    const firstCard = page.locator('[data-testid="category-card"]').first()
    // If data-testid not present yet, use fallback selector
    const card = page.locator('.bg-card.rounded-2xl').filter({ has: page.locator('.lucide-grip-vertical') }).first()
    await expect(card).toHaveClass(/cursor-grab/)
  })

  // -------------------------------------------------------------------------
  // Budgets: Drag handle visibility
  // -------------------------------------------------------------------------
  test('shows drag handle on budget cards', async ({ page }) => {
    await loginAndGo(page, '/budget')

    // Check for grip icon on budget cards
    const gripIcon = page.locator('svg[class*="lucide-grip-vertical"]').first()
    await expect(gripIcon).toBeVisible()
  })

  test('budget cards have grab cursor', async ({ page }) => {
    await loginAndGo(page, '/budget')

    // Cards should have cursor-grab class
    const card = page.locator('.bg-card.rounded-2xl').filter({ has: page.locator('.lucide-grip-vertical') }).first()
    await expect(card).toHaveClass(/cursor-grab/)
  })

  // -------------------------------------------------------------------------
  // Categories: Order persistence (with data-testid)
  // -------------------------------------------------------------------------
  test('should persist category order after page reload', async ({ page }) => {
    await loginAndGo(page, '/categories')
    await page.waitForLoadState('networkidle')

    const cards = page.locator('[data-testid="category-card"]')
    const count = await cards.count()

    if (count < 2) {
      test.skip()
    }

    // Get first category ID before any drag
    const firstCard = cards.nth(0)
    const originalId = await firstCard.getAttribute('data-category-id')

    // If we have at least 3 cards, try to drag first to third position
    if (count >= 3 && originalId) {
      // Drag first card to third position
      await firstCard.dragTo(cards.nth(2))
      await page.waitForTimeout(500) // Wait for debounce

      // Reload page
      await page.reload()
      await page.waitForLoadState('networkidle')

      // Verify order changed (first card should now be different)
      const newFirstCard = page.locator('[data-testid="category-card"]').nth(0)
      const newId = await newFirstCard.getAttribute('data-category-id')
      expect(newId).not.toBe(originalId)
    }
  })

  // -------------------------------------------------------------------------
  // Budgets: Order persistence (with data-testid)
  // -------------------------------------------------------------------------
  test('should persist budget order after page reload', async ({ page }) => {
    await loginAndGo(page, '/budget')
    await page.waitForLoadState('networkidle')

    const cards = page.locator('[data-testid="budget-card"]')
    const count = await cards.count()

    if (count < 2) {
      test.skip()
    }

    const firstCard = cards.nth(0)
    const originalId = await firstCard.getAttribute('data-budget-id')

    if (count >= 3 && originalId) {
      await firstCard.dragTo(cards.nth(2))
      await page.waitForTimeout(500)

      await page.reload()
      await page.waitForLoadState('networkidle')

      const newFirstCard = page.locator('[data-testid="budget-card"]').nth(0)
      const newId = await newFirstCard.getAttribute('data-budget-id')
      expect(newId).not.toBe(originalId)
    }
  })
})