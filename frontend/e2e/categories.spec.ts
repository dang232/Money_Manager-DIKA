import { test, expect } from '@playwright/test'
import { loginAndGo } from './helpers/auth'

const CATEGORIES = [
  { id: 'cat-1', name: 'Food & Dining', type: 'expense', icon: '🍔', color: '#ef4444' },
  { id: 'cat-2', name: 'Salary', type: 'income', icon: '💰', color: '#22c55e' },
]

async function mockCategoryApis(
  page: import('@playwright/test').Page,
  options: { categories?: typeof CATEGORIES } = {},
) {
  const catList = options.categories ?? CATEGORIES

  await page.route('**/api/categories', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: catList }) })
    } else if (route.request().method() === 'POST') {
      const body = JSON.parse(route.request().postData() ?? '{}')
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'cat-new', ...body }),
      })
    } else {
      await route.continue()
    }
  })

  await page.route('**/api/categories/*', async (route) => {
    if (route.request().method() === 'PUT') {
      const body = JSON.parse(route.request().postData() ?? '{}')
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'cat-1', ...body }) })
    } else if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    } else {
      await route.continue()
    }
  })

  // Layout API mock (must be before catch-all)
  await page.route('**/api/layout**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          layout: { categories: [], budgets: [] },
          version: 1,
          updatedAt: new Date().toISOString()
        }
      }),
    }),
  )

  // ponytail: catch-all for unhandled API calls — only intercept fetch/xhr, NOT vite module loads
  await page.route('**/api/**', (route) => {
    const type = route.request().resourceType()
    if (type === 'fetch' || type === 'xhr') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) })
    }
    return route.continue()
  })
}

test.describe('Categories', () => {
  test.beforeEach(async ({ page }) => {
    await mockCategoryApis(page)
    await loginAndGo(page, '/categories')
  })

  // -------------------------------------------------------------------------
  // List view
  // -------------------------------------------------------------------------
  test('renders the Categories page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Categories' })).toBeVisible()
  })

  test('displays existing categories as cards', async ({ page }) => {
    await expect(page.getByText('Food & Dining')).toBeVisible()
    await expect(page.getByText('Salary')).toBeVisible()
  })

  test('shows category type label on each card', async ({ page }) => {
    await expect(page.getByText('expense')).toBeVisible()
    await expect(page.getByText('income')).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // Create
  // -------------------------------------------------------------------------
  test('"New Category" button opens the create modal', async ({ page }) => {
    await page.getByRole('button', { name: 'New Category' }).click()
    await expect(page.getByRole('heading', { name: 'New Category' })).toBeVisible()
  })

  test('create modal has Name, Type toggle, and Color fields', async ({ page }) => {
    await page.getByRole('button', { name: 'New Category' }).click()
    await expect(page.getByLabel('Name')).toBeVisible()
    await expect(page.getByRole('button', { name: /Expense/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Income/ })).toBeVisible()
    await expect(page.getByLabel('Color')).toBeVisible()
  })

  test('Save is blocked when name is empty', async ({ page }) => {
    await page.getByRole('button', { name: 'New Category' }).click()
    let postCalled = false
    page.on('request', (req) => {
      if (req.url().includes('/api/categories') && req.method() === 'POST') postCalled = true
    })
    await page.getByRole('button', { name: 'Save' }).click()
    // Modal should remain open; no POST
    await expect(page.getByRole('heading', { name: 'New Category' })).toBeVisible()
    expect(postCalled).toBe(false)
  })

  test('submitting a valid create form calls POST /categories and closes modal', async ({ page }) => {
    await page.getByRole('button', { name: 'New Category' }).click()
    await page.getByLabel('Name').fill('Gym')

    const catResponse = page.waitForResponse(
      (res) => res.url().includes('/api/categories') && res.request().method() === 'POST',
    )
    await page.getByRole('button', { name: 'Save' }).click()
    await catResponse

    await expect(page.getByRole('heading', { name: 'New Category' })).not.toBeVisible()
  })

  test('POST /categories payload includes name and type', async ({ page }) => {
    await page.getByRole('button', { name: 'New Category' }).click()
    await page.getByLabel('Name').fill('Entertainment')
    // Switch to income type
    await page.locator('.grid.grid-cols-2').getByRole('button', { name: /Income/ }).click()

    let capturedBody: Record<string, unknown> = {}
    page.on('request', (req) => {
      if (req.url().includes('/api/categories') && req.method() === 'POST') {
        capturedBody = JSON.parse(req.postData() ?? '{}')
      }
    })

    await page.getByRole('button', { name: 'Save' }).click()
    await page.waitForResponse(
      (res) => res.url().includes('/api/categories') && res.request().method() === 'POST',
    )

    expect(capturedBody.name).toBe('Entertainment')
    expect(capturedBody.type).toBe('income')
  })

  test('type defaults to expense in the create form', async ({ page }) => {
    await page.getByRole('button', { name: 'New Category' }).click()
    await page.getByLabel('Name').fill('Utilities')

    let capturedBody: Record<string, unknown> = {}
    page.on('request', (req) => {
      if (req.url().includes('/api/categories') && req.method() === 'POST') {
        capturedBody = JSON.parse(req.postData() ?? '{}')
      }
    })

    await page.getByRole('button', { name: 'Save' }).click()
    await page.waitForResponse(
      (res) => res.url().includes('/api/categories') && res.request().method() === 'POST',
    )

    expect(capturedBody.type).toBe('expense')
  })

  // -------------------------------------------------------------------------
  // Edit
  // -------------------------------------------------------------------------
  test('clicking a category card opens the edit modal', async ({ page }) => {
    await page.getByText('Food & Dining').click()
    await expect(page.getByRole('heading', { name: 'Edit Category' })).toBeVisible()
  })

  test('edit modal is pre-filled with existing values', async ({ page }) => {
    await page.getByText('Food & Dining').click()
    await expect(page.getByLabel('Name')).toHaveValue('Food & Dining')
  })

  test('editing a category calls PUT /categories/:id and closes modal', async ({ page }) => {
    // Click on the card (not the hover Delete button)
    await page.locator('.bg-card.rounded-2xl').filter({ hasText: 'Food & Dining' }).click()
    await expect(page.getByRole('heading', { name: 'Edit Category' })).toBeVisible()

    await page.getByLabel('Name').fill('Food & Drinks')

    const putResponse = page.waitForResponse(
      (res) => res.url().includes('/api/categories/cat-1') && res.request().method() === 'PUT',
    )
    await page.getByRole('button', { name: 'Save' }).click()
    await putResponse

    await expect(page.getByRole('heading', { name: 'Edit Category' })).not.toBeVisible()
  })

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------
  test('hovering a card reveals the Delete button', async ({ page }) => {
    const card = page.locator('.bg-card.rounded-2xl').filter({ hasText: 'Food & Dining' })
    await card.hover()
    await expect(card.getByRole('button', { name: 'Delete' })).toBeVisible()
  })

  test('clicking Delete calls DELETE /categories/:id', async ({ page }) => {
    const card = page.locator('.bg-card.rounded-2xl').filter({ hasText: 'Food & Dining' })
    await card.hover()

    const deleteResponse = page.waitForResponse(
      (res) => res.url().includes('/api/categories/cat-1') && res.request().method() === 'DELETE',
    )
    await card.getByRole('button', { name: 'Delete' }).click()
    await deleteResponse
  })

  // -------------------------------------------------------------------------
  // Cancel / dismiss
  // -------------------------------------------------------------------------
  test('Cancel button closes the form modal', async ({ page }) => {
    await page.getByRole('button', { name: 'New Category' }).click()
    await expect(page.getByRole('heading', { name: 'New Category' })).toBeVisible()
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('heading', { name: 'New Category' })).not.toBeVisible()
  })

  test('clicking backdrop closes the form modal', async ({ page }) => {
    await page.getByRole('button', { name: 'New Category' }).click()
    await page.locator('.fixed.inset-0').click({ position: { x: 10, y: 10 } })
    await expect(page.getByRole('heading', { name: 'New Category' })).not.toBeVisible()
  })

  // -------------------------------------------------------------------------
  // Empty state
  // -------------------------------------------------------------------------
  test('shows empty state message when no categories exist', async ({ page }) => {
    await mockCategoryApis(page, { categories: [] })
    await page.reload()
    await expect(page.getByText('No categories yet. Create one to start organizing.')).toBeVisible()
  })
})
