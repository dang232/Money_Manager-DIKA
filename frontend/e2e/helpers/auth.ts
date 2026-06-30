import type { Page } from '@playwright/test'

const ACCESS_TOKEN_KEY = 'mm-access-token'
const REFRESH_TOKEN_KEY = 'mm-refresh-token'

const MOCK_USER = { id: 'u1', email: 'test@test.com', displayName: 'Test User', createdAt: '2024-01-01' }

/**
 * Seeds auth cookie so the router guard allows through.
 */
export async function seedAuth(page: Page, _options?: { accessToken?: string; refreshToken?: string }) {
  await page.context().addCookies([
    { name: 'mm-csrf', value: 'test-csrf-token', domain: 'localhost', path: '/' },
  ])
}

/**
 * Clears auth tokens from localStorage.
 */
export async function clearAuth(page: Page) {
  await page.evaluate(
    ([atKey, rtKey]) => {
      localStorage.removeItem(atKey)
      localStorage.removeItem(rtKey)
    },
    [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY],
  )
}

/**
 * Seeds auth, mocks /api/auth/me (called by App.vue on mount), and navigates to path.
 */
export async function loginAndGo(page: Page, path: string, options: { accessToken?: string; refreshToken?: string } = {}) {
  await seedAuth(page, options)
  // ponytail: App.vue calls /api/auth/me on mount — mock it so pages render
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: MOCK_USER }) }),
  )
  await page.goto(path)
}
