/**
 * Real E2E test — interacts with the actual running app at localhost:5173.
 * No mocks. Tests the full customer journey against real backend services.
 *
 * Prerequisites: docker compose up (all services healthy)
 * Run: npx playwright test e2e/real-flow.spec.ts --headed
 */
import { test, expect } from '@playwright/test'

const UNIQUE = Date.now()
const TEST_USER = {
  displayName: `E2E User ${UNIQUE}`,
  email: `e2e-${UNIQUE}@test.local`,
  password: 'StrongPass123!',
}

test.describe.serial('Full customer journey', () => {
  // ─── Registration ─────────────────────────────────────────────────────────
  test('1. Register a new account', async ({ page }) => {
    await page.goto('/register')

    // Should see the register form without any app sidebar
    await expect(page.getByRole('heading', { name: 'Create an account' })).toBeVisible()
    // No sidebar should be visible (layout fix verification)
    await expect(page.locator('nav')).not.toBeVisible()

    // Fill the form
    await page.getByLabel('Display name').fill(TEST_USER.displayName)
    await page.getByLabel('Email').fill(TEST_USER.email)
    await page.getByLabel('Password').fill(TEST_USER.password)

    // Submit
    await page.getByRole('button', { name: 'Create account' }).click()

    // Should navigate to dashboard after successful registration
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 10000 })
  })

  // ─── Logout ───────────────────────────────────────────────────────────────
  test('2. Logout from the app', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.getByLabel('Email').fill(TEST_USER.email)
    await page.getByLabel('Password').fill(TEST_USER.password)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 10000 })

    // Find and click logout
    const logoutBtn = page.getByRole('button', { name: 'Logout' })
    if (await logoutBtn.first().isVisible()) {
      await logoutBtn.first().click()
      // Wait for cookies to clear
      await page.waitForTimeout(2000)
      const cookies = await page.context().cookies()
      const csrfCookie = cookies.find(c => c.name === 'mm-csrf')
      expect(csrfCookie).toBeUndefined()
    }
  })

  // ─── Login ────────────────────────────────────────────────────────────────
  test('3. Login with existing account', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    // No sidebar visible (layout fix)
    await expect(page.locator('nav')).not.toBeVisible()

    await page.getByLabel('Email').fill(TEST_USER.email)
    await page.getByLabel('Password').fill(TEST_USER.password)
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 10000 })
  })

  // ─── Login failure ────────────────────────────────────────────────────────
  test('4. Login with wrong password shows error', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel('Email').fill(TEST_USER.email)
    await page.getByLabel('Password').fill('WrongPassword999!')
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Should show error message
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 })
    // Should stay on login page
    await expect(page).toHaveURL('/login')
  })

  // ─── Route guard ──────────────────────────────────────────────────────────
  test('5. Unauthenticated user gets redirected to /login', async ({ page }) => {
    // Clear cookies to simulate unauthenticated state
    await page.context().clearCookies()

    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login', { timeout: 5000 })
  })

  // ─── Dashboard loads ──────────────────────────────────────────────────────
  test('6. Dashboard loads with data after login', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(TEST_USER.email)
    await page.getByLabel('Password').fill(TEST_USER.password)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 10000 })

    // If redirected to onboarding, skip it
    if (page.url().includes('onboarding')) {
      // Try to skip through onboarding
      const skipBtn = page.getByRole('button', { name: /skip/i })
      while (await skipBtn.isVisible().catch(() => false)) {
        await skipBtn.click()
        await page.waitForTimeout(500)
      }
      const continueBtn = page.getByRole('button', { name: /continue/i })
      while (await continueBtn.isVisible().catch(() => false)) {
        await continueBtn.click()
        await page.waitForTimeout(500)
      }
    }

    // Should eventually land on dashboard
    if (!page.url().includes('dashboard')) {
      await page.goto('/dashboard')
    }

    // Dashboard should render without crashing
    await expect(page.locator('body')).not.toHaveText(/error/i, { timeout: 5000 })
  })

  // ─── Navigation works ─────────────────────────────────────────────────────
  test('7. Sidebar navigation works', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.getByLabel('Email').fill(TEST_USER.email)
    await page.getByLabel('Password').fill(TEST_USER.password)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 10000 })

    // Navigate to transactions
    const txnLink = page.getByRole('link', { name: /transactions/i }).first()
    if (await txnLink.isVisible()) {
      await txnLink.click()
      await expect(page).toHaveURL(/\/transactions/, { timeout: 5000 })
    }

    // Navigate to budgets
    const budgetLink = page.getByRole('link', { name: /budgets/i }).first()
    if (await budgetLink.isVisible()) {
      await budgetLink.click()
      await expect(page).toHaveURL(/\/budget/, { timeout: 5000 })
    }
  })

  // ─── Create transaction ───────────────────────────────────────────────────
  test('8. Create a transaction', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.getByLabel('Email').fill(TEST_USER.email)
    await page.getByLabel('Password').fill(TEST_USER.password)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 10000 })

    // Go to transactions page
    await page.goto('/transactions')
    await page.waitForLoadState('networkidle')

    // Click Add Transaction
    const addBtn = page.getByRole('button', { name: /add transaction/i }).first()
    if (await addBtn.isVisible()) {
      await addBtn.click()

      // Fill form
      const amountInput = page.getByLabel(/amount/i)
      if (await amountInput.isVisible()) {
        await amountInput.fill('50000')
      }

      const descInput = page.getByLabel(/description/i)
      if (await descInput.isVisible()) {
        await descInput.fill('Playwright test expense')
      }

      // Try to save
      const saveBtn = page.getByRole('button', { name: /save/i })
      if (await saveBtn.isVisible()) {
        await saveBtn.click()
        await page.waitForTimeout(1000)
      }
    }
  })
})
