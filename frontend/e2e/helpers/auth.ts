import type { Page } from '@playwright/test'

const ACCESS_TOKEN_KEY = 'mm-access-token'
const REFRESH_TOKEN_KEY = 'mm-refresh-token'

const MOCK_USER = { id: 'u1', email: 'test@test.com', displayName: 'Test User', createdAt: '2024-01-01' }

// Base64 encode a minimal JWT-like token (for gateway dev mode)
function createDevToken(userId: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ sub: userId, iat: Math.floor(Date.now() / 1000) })).toString('base64url')
  const signature = 'dev-signature'
  return `${header}.${payload}.${signature}`
}

/**
 * Seeds auth cookie and intercepts API calls to inject x-user-id header.
 */
export async function seedAuth(page: Page, options?: { userId?: string; accessToken?: string }) {
  const userId = options?.userId ?? MOCK_USER.id
  const jwtToken = options?.accessToken ?? createDevToken(userId)

  await page.context().addCookies([
    { name: 'mm-csrf', value: 'test-csrf-token', domain: 'localhost', path: '/' },
    { name: 'mm-at', value: jwtToken, domain: 'localhost', path: '/' },
  ])

  // Intercept all API requests to inject x-user-id header
  // This simulates what the gateway's JWT middleware does
  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const method = request.method()
    if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const headers = { ...request.headers(), 'x-user-id': userId }
      await route.continue({ headers })
    } else {
      await route.continue()
    }
  })
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
 * For single-user tests.
 */
export async function loginAndGo(page: Page, path: string, options: { userId?: string } = {}) {
  await seedAuth(page, options)
  // App.vue calls /api/auth/me on mount — mock it so pages render
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: MOCK_USER }) }),
  )
  await page.goto(path)
}
