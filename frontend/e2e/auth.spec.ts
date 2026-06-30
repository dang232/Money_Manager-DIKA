import { test, expect } from '@playwright/test'

// ponytail: smoke tests for core navigation and UI rendering

test.describe('Auth Flow', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /create one/i })).toBeVisible()
  })

  test('login shows error on empty submit', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page.getByRole('alert')).toContainText('Please fill in all fields')
  })

  test('login shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('bad@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 })
  })

  test('register page is accessible from login', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: /create one/i }).click()
    await expect(page).toHaveURL(/\/register/)
  })
})
