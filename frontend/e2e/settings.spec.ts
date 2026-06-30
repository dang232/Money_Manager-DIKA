import { test, expect } from '@playwright/test'
import { loginAndGo } from './helpers/auth'

const PROFILE = {
  id: 'u1',
  displayName: 'Test User',
  avatarUrl: null,
  locale: 'en-US',
  timezone: 'UTC',
  defaultCurrency: 'VND',
  budgetAnchorDay: 1,
  notificationPrefs: {},
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
}

async function mockSettingsApis(page: import('@playwright/test').Page) {
  await page.route('**/api/users/me', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: PROFILE }),
      })
    } else if (route.request().method() === 'PUT') {
      const body = JSON.parse(route.request().postData() ?? '{}')
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { ...PROFILE, ...body } }),
      })
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

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await mockSettingsApis(page)
    await loginAndGo(page, '/settings')
  })

  // -------------------------------------------------------------------------
  // Page structure
  // -------------------------------------------------------------------------
  test('renders the Settings page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  })

  test('shows the sidebar section tabs', async ({ page }) => {
    for (const section of ['Profile', 'Accounts', 'Categories', 'Notifications', 'Security', 'Currency', 'Export Data']) {
      await expect(page.getByRole('button', { name: section })).toBeVisible()
    }
  })

  test('Profile section is active by default', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Profile Information' })).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // Profile form — pre-population
  // -------------------------------------------------------------------------
  test('Display Name field is pre-filled from fetched profile', async ({ page }) => {
    await expect(page.getByLabel('Display Name')).toHaveValue('Test User')
  })

  test('Currency select is pre-filled from fetched profile', async ({ page }) => {
    await expect(page.getByLabel('Currency')).toHaveValue('VND')
  })

  test('Language select is pre-filled from fetched profile', async ({ page }) => {
    await expect(page.getByLabel('Language')).toHaveValue('en-US')
  })

  test('Timezone select is pre-filled from fetched profile', async ({ page }) => {
    await expect(page.getByLabel('Timezone')).toHaveValue('UTC')
  })

  test('Budget Anchor Day field is pre-filled from fetched profile', async ({ page }) => {
    await expect(page.getByLabel(/Budget Anchor Day/)).toHaveValue('1')
  })

  // -------------------------------------------------------------------------
  // Profile form — field interactions
  // -------------------------------------------------------------------------
  test('can update display name', async ({ page }) => {
    await page.getByLabel('Display Name').fill('Updated Name')
    await expect(page.getByLabel('Display Name')).toHaveValue('Updated Name')
  })

  test('can change currency', async ({ page }) => {
    await page.getByLabel('Currency').selectOption('USD')
    await expect(page.getByLabel('Currency')).toHaveValue('USD')
  })

  test('can change language', async ({ page }) => {
    await page.getByLabel('Language').selectOption('vi-VN')
    await expect(page.getByLabel('Language')).toHaveValue('vi-VN')
  })

  test('can change timezone', async ({ page }) => {
    await page.getByLabel('Timezone').selectOption('Asia/Ho_Chi_Minh')
    await expect(page.getByLabel('Timezone')).toHaveValue('Asia/Ho_Chi_Minh')
  })

  test('budget anchor day enforces min 1, max 28', async ({ page }) => {
    const input = page.getByLabel(/Budget Anchor Day/)
    // HTML min/max attributes should be present
    await expect(input).toHaveAttribute('min', '1')
    await expect(input).toHaveAttribute('max', '28')
  })

  // -------------------------------------------------------------------------
  // Save
  // -------------------------------------------------------------------------
  test('"Save Changes" button calls PUT /users/me with updated values', async ({ page }) => {
    await page.getByLabel('Display Name').fill('New Name')
    await page.getByLabel('Currency').selectOption('USD')

    let capturedBody: Record<string, unknown> = {}
    page.on('request', (req) => {
      if (req.url().includes('/api/users/me') && req.method() === 'PUT') {
        capturedBody = JSON.parse(req.postData() ?? '{}')
      }
    })

    const putResponse = page.waitForResponse(
      (res) => res.url().includes('/api/users/me') && res.request().method() === 'PUT',
    )
    await page.getByRole('button', { name: 'Save Changes' }).click()
    await putResponse

    expect(capturedBody.displayName).toBe('New Name')
    expect(capturedBody.defaultCurrency).toBe('USD')
  })

  test('shows "Settings saved" success message after successful save', async ({ page }) => {
    const putResponse = page.waitForResponse(
      (res) => res.url().includes('/api/users/me') && res.request().method() === 'PUT',
    )
    await page.getByRole('button', { name: 'Save Changes' }).click()
    await putResponse

    await expect(page.getByRole('status')).toContainText('Settings saved')
  })

  test('"Settings saved" message disappears after ~3 seconds', async ({ page }) => {
    const putResponse = page.waitForResponse(
      (res) => res.url().includes('/api/users/me') && res.request().method() === 'PUT',
    )
    await page.getByRole('button', { name: 'Save Changes' }).click()
    await putResponse

    await expect(page.getByRole('status')).toContainText('Settings saved')
    // Message auto-clears after 3s — wait up to 4s for it to disappear
    await expect(page.getByRole('status')).not.toBeVisible({ timeout: 4000 })
  })

  test('PUT /users/me payload includes all five profile fields', async ({ page }) => {
    let capturedBody: Record<string, unknown> = {}
    page.on('request', (req) => {
      if (req.url().includes('/api/users/me') && req.method() === 'PUT') {
        capturedBody = JSON.parse(req.postData() ?? '{}')
      }
    })

    await page.getByRole('button', { name: 'Save Changes' }).click()
    await page.waitForResponse(
      (res) => res.url().includes('/api/users/me') && res.request().method() === 'PUT',
    )

    expect(capturedBody).toHaveProperty('displayName')
    expect(capturedBody).toHaveProperty('defaultCurrency')
    expect(capturedBody).toHaveProperty('locale')
    expect(capturedBody).toHaveProperty('timezone')
    expect(capturedBody).toHaveProperty('budgetAnchorDay')
  })

  test('shows spinner text while save is in progress', async ({ page }) => {
    await page.route('**/api/users/me', async (route) => {
      if (route.request().method() === 'PUT') {
        await new Promise((r) => setTimeout(r, 300))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: PROFILE }),
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: PROFILE }),
        })
      }
    })

    await page.getByRole('button', { name: 'Save Changes' }).click()
    await expect(page.getByRole('button', { name: /Saving\.\.\./ })).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // Cancel
  // -------------------------------------------------------------------------
  test('"Cancel" button re-fetches profile and discards local edits', async ({ page }) => {
    await page.getByLabel('Display Name').fill('Temporary Edit')
    await expect(page.getByLabel('Display Name')).toHaveValue('Temporary Edit')

    const refetchResponse = page.waitForResponse(
      (res) => res.url().includes('/api/users/me') && res.request().method() === 'GET',
    )
    await page.getByRole('button', { name: 'Cancel' }).click()
    await refetchResponse

    // Value should revert to the mocked profile value
    await expect(page.getByLabel('Display Name')).toHaveValue('Test User')
  })

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------
  test('shows error message when save fails', async ({ page }) => {
    await page.route('**/api/users/me', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Internal server error' }),
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: PROFILE }),
        })
      }
    })

    await page.getByRole('button', { name: 'Save Changes' }).click()
    await page.waitForResponse((res) => res.url().includes('/api/users/me') && res.request().method() === 'PUT')

    await expect(page.getByRole('alert')).toBeVisible()
  })

  // -------------------------------------------------------------------------
  // Loading skeleton
  // -------------------------------------------------------------------------
  test('shows loading skeleton while profile is fetching', async ({ page }) => {
    // Use a fresh page with delayed response
    await page.route('**/api/users/me', async (route) => {
      await new Promise((r) => setTimeout(r, 400))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: PROFILE }),
      })
    })
    await page.goto('/settings')
    await expect(page.locator('[aria-busy="true"]')).toBeVisible({ timeout: 1000 })
  })
})
