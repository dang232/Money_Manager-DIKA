import { test } from '@playwright/test'

const DIR = 'screenshots'

test('Capture all pages', async ({ page }) => {
  const id = Date.now()
  // Register
  await page.goto('/register')
  await page.getByLabel('Display name').fill(`SS User ${id}`)
  await page.getByLabel('Email').fill(`ss-${id}@test.local`)
  await page.getByLabel('Password').fill('StrongPass123!')
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 10000 })

  // Dashboard desktop
  await page.goto('/dashboard')
  await page.waitForTimeout(3000)
  await page.screenshot({ path: `${DIR}/01-dashboard.png`, fullPage: true })

  // Dashboard mobile
  await page.setViewportSize({ width: 375, height: 812 })
  await page.waitForTimeout(1000)
  await page.screenshot({ path: `${DIR}/01-dashboard-mobile.png`, fullPage: true })

  // Transactions mobile
  await page.goto('/transactions')
  await page.waitForTimeout(2000)
  await page.screenshot({ path: `${DIR}/02-transactions-mobile.png`, fullPage: true })

  // Back to desktop
  await page.setViewportSize({ width: 1440, height: 900 })

  // Transactions desktop
  await page.goto('/transactions')
  await page.waitForTimeout(2000)
  await page.screenshot({ path: `${DIR}/02-transactions.png`, fullPage: true })

  // Budget
  await page.goto('/budget')
  await page.waitForTimeout(2000)
  await page.screenshot({ path: `${DIR}/03-budget.png`, fullPage: true })

  // Categories
  await page.goto('/categories')
  await page.waitForTimeout(2000)
  await page.screenshot({ path: `${DIR}/04-categories.png`, fullPage: true })

  // Settings
  await page.goto('/settings')
  await page.waitForTimeout(2000)
  await page.screenshot({ path: `${DIR}/05-settings.png`, fullPage: true })

  // Login page (logout first)
  await page.goto('/login')
  await page.waitForTimeout(1000)
  await page.screenshot({ path: `${DIR}/06-login.png`, fullPage: true })

  // Login mobile
  await page.setViewportSize({ width: 375, height: 812 })
  await page.waitForTimeout(1000)
  await page.screenshot({ path: `${DIR}/06-login-mobile.png`, fullPage: true })
})
