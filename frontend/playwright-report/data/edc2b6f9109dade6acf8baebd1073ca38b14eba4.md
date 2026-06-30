# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: multi-user-isolation.spec.ts >> Multi-User API Isolation >> Unauthorized request without x-user-id returns 401
- Location: e2e\multi-user-isolation.spec.ts:75:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 401
Received: 200
```

# Test source

```ts
  1   | /**
  2   |  * Multi-User Isolation Tests
  3   |  *
  4   |  * Tests that verify user data is properly isolated between users.
  5   |  * Uses the real backend API to test multi-user scenarios.
  6   |  */
  7   | 
  8   | import { test, expect, type Page, type BrowserContext } from '@playwright/test'
  9   | import { seedAuth } from './helpers/auth'
  10  | 
  11  | // Test user configurations - real user IDs
  12  | const TEST_USERS = [
  13  |   { id: 'test-user-001', email: 'alice@test.com', name: 'Alice' },
  14  |   { id: 'test-user-002', email: 'bob@test.com', name: 'Bob' },
  15  |   { id: 'test-user-003', email: 'carol@test.com', name: 'Carol' },
  16  | ]
  17  | 
  18  | // =============================================================================
  19  | // TEST SUITE 1: Multi-User API Isolation via Direct HTTP
  20  | // =============================================================================
  21  | 
  22  | test.describe('Multi-User API Isolation', () => {
  23  | 
  24  |   test('User A and User B see different transaction lists', async ({ browser }) => {
  25  |     // Create two separate browser contexts (like two different users)
  26  |     const aliceContext = await browser.newContext()
  27  |     const bobContext = await browser.newContext()
  28  | 
  29  |     const alicePage = await aliceContext.newPage()
  30  |     const bobPage = await bobContext.newPage()
  31  | 
  32  |     // Setup Alice with her user ID
  33  |     await seedAuth(alicePage, { userId: TEST_USERS[0].id })
  34  |     await alicePage.goto('/transactions')
  35  |     await alicePage.waitForLoadState('networkidle')
  36  | 
  37  |     // Setup Bob with his user ID
  38  |     await seedAuth(bobPage, { userId: TEST_USERS[1].id })
  39  |     await bobPage.goto('/transactions')
  40  |     await bobPage.waitForLoadState('networkidle')
  41  | 
  42  |     // Both pages should load successfully
  43  |     await expect(alicePage.locator('body')).toBeVisible()
  44  |     await expect(bobPage.locator('body')).toBeVisible()
  45  | 
  46  |     // Get the page content for each user
  47  |     const aliceHasContent = await alicePage.locator('[data-testid="transaction-list"], .transaction-list, .list-group, table').count()
  48  |     const bobHasContent = await bobPage.locator('[data-testid="transaction-list"], .transaction-list, .list-group, table').count()
  49  | 
  50  |     // Both users see their own views (may be empty for new users)
  51  |     expect(aliceHasContent + bobHasContent).toBeGreaterThanOrEqual(0)
  52  | 
  53  |     await aliceContext.close()
  54  |     await bobContext.close()
  55  |   })
  56  | 
  57  |   test('Dashboard returns user-specific data', async ({ browser }) => {
  58  |     const aliceContext = await browser.newContext()
  59  |     const alicePage = await aliceContext.newPage()
  60  | 
  61  |     await seedAuth(alicePage, { userId: TEST_USERS[0].id })
  62  |     await alicePage.goto('/dashboard')
  63  |     await alicePage.waitForLoadState('networkidle')
  64  | 
  65  |     // Dashboard should load for Alice
  66  |     await expect(alicePage.locator('body')).toBeVisible()
  67  | 
  68  |     // Check if any user-specific content is visible
  69  |     const greeting = alicePage.getByText(/Hi,|Welcome|Dashboard/)
  70  |     await expect(greeting.first()).toBeVisible({ timeout: 10000 })
  71  | 
  72  |     await aliceContext.close()
  73  |   })
  74  | 
  75  |   test('Unauthorized request without x-user-id returns 401', async ({ request }) => {
  76  |     // Make a direct HTTP request without x-user-id header
  77  |     const response = await request.get('http://localhost:3000/api/dashboard', {
  78  |       headers: {
  79  |         'Content-Type': 'application/json',
  80  |       },
  81  |     })
  82  | 
  83  |     // Should get 401 Unauthorized
> 84  |     expect(response.status()).toBe(401)
      |                               ^ Error: expect(received).toBe(expected) // Object.is equality
  85  |   })
  86  | 
  87  |   test('User can only see their own categories', async ({ browser }) => {
  88  |     const aliceContext = await browser.newContext()
  89  |     const bobContext = await browser.newContext()
  90  | 
  91  |     const alicePage = await aliceContext.newPage()
  92  |     const bobPage = await bobContext.newPage()
  93  | 
  94  |     await seedAuth(alicePage, { userId: TEST_USERS[0].id })
  95  |     await seedAuth(bobPage, { userId: TEST_USERS[1].id })
  96  | 
  97  |     // Both navigate to transactions page
  98  |     await alicePage.goto('/transactions')
  99  |     await bobPage.goto('/transactions')
  100 | 
  101 |     await Promise.all([
  102 |       alicePage.waitForLoadState('networkidle'),
  103 |       bobPage.waitForLoadState('networkidle'),
  104 |     ])
  105 | 
  106 |     // Both pages should load
  107 |     await expect(alicePage.locator('body')).toBeVisible()
  108 |     await expect(bobPage.locator('body')).toBeVisible()
  109 | 
  110 |     await aliceContext.close()
  111 |     await bobContext.close()
  112 |   })
  113 | })
  114 | 
  115 | // =============================================================================
  116 | // TEST SUITE 2: Dashboard Cache Isolation
  117 | // =============================================================================
  118 | 
  119 | test.describe('Dashboard Cache Isolation', () => {
  120 | 
  121 |   test('Two users should have independent dashboard caches', async ({ browser }) => {
  122 |     const aliceContext = await browser.newContext()
  123 |     const bobContext = await browser.newContext()
  124 | 
  125 |     const alicePage = await aliceContext.newPage()
  126 |     const bobPage = await bobContext.newPage()
  127 | 
  128 |     // Alice logs in and views dashboard
  129 |     await seedAuth(alicePage, { userId: TEST_USERS[0].id })
  130 |     await alicePage.goto('/dashboard')
  131 |     await alicePage.waitForLoadState('networkidle')
  132 | 
  133 |     // Bob logs in and views dashboard
  134 |     await seedAuth(bobPage, { userId: TEST_USERS[1].id })
  135 |     await bobPage.goto('/dashboard')
  136 |     await bobPage.waitForLoadState('networkidle')
  137 | 
  138 |     // Both dashboards should load
  139 |     await expect(alicePage.locator('body')).toBeVisible()
  140 |     await expect(bobPage.locator('body')).toBeVisible()
  141 | 
  142 |     // Check page content is different (users see their own data)
  143 |     const aliceContent = await alicePage.content()
  144 |     const bobContent = await bobPage.content()
  145 | 
  146 |     // At minimum, both should load the page successfully
  147 |     expect(aliceContent).toContain('html')
  148 |     expect(bobContent).toContain('html')
  149 | 
  150 |     await aliceContext.close()
  151 |     await bobContext.close()
  152 |   })
  153 | })
  154 | 
  155 | // =============================================================================
  156 | // TEST SUITE 3: Real End-to-End User Flow
  157 | // =============================================================================
  158 | 
  159 | test.describe('Real User Flow - Multiple Sessions', () => {
  160 | 
  161 |   test('User can login and view their dashboard', async ({ browser }) => {
  162 |     const context = await browser.newContext()
  163 |     const page = await context.newPage()
  164 | 
  165 |     const userId = TEST_USERS[0].id
  166 |     await seedAuth(page, { userId })
  167 | 
  168 |     await page.goto('/dashboard')
  169 |     await page.waitForLoadState('networkidle')
  170 | 
  171 |     // Should see dashboard loaded
  172 |     await expect(page.locator('body')).toBeVisible()
  173 | 
  174 |     // Should not see login page
  175 |     await expect(page.locator('text=/login/i')).not.toBeVisible({ timeout: 3000 })
  176 | 
  177 |     await context.close()
  178 |   })
  179 | 
  180 |   test('User can navigate to transactions page', async ({ browser }) => {
  181 |     const context = await browser.newContext()
  182 |     const page = await context.newPage()
  183 | 
  184 |     await seedAuth(page, { userId: TEST_USERS[0].id })
```