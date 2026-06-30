# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: multi-user-isolation.spec.ts >> Security - Access Control >> GET /dashboard without auth header returns 401
- Location: e2e\multi-user-isolation.spec.ts:254:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 401
Received: 200
```

# Test source

```ts
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
  185 | 
  186 |     await page.goto('/transactions')
  187 |     await page.waitForLoadState('networkidle')
  188 | 
  189 |     await expect(page.locator('body')).toBeVisible()
  190 | 
  191 |     await context.close()
  192 |   })
  193 | 
  194 |   test('User can navigate to budgets page', async ({ browser }) => {
  195 |     const context = await browser.newContext()
  196 |     const page = await context.newPage()
  197 | 
  198 |     await seedAuth(page, { userId: TEST_USERS[0].id })
  199 | 
  200 |     await page.goto('/budget')
  201 |     await page.waitForLoadState('networkidle')
  202 | 
  203 |     await expect(page.locator('body')).toBeVisible()
  204 | 
  205 |     await context.close()
  206 |   })
  207 | })
  208 | 
  209 | // =============================================================================
  210 | // TEST SUITE 4: Security - Cross-User Access Prevention
  211 | // =============================================================================
  212 | 
  213 | test.describe('Security - Access Control', () => {
  214 | 
  215 |   test('Cannot access other user transaction by ID', async ({ request }) => {
  216 |     const user1Id = TEST_USERS[0].id
  217 |     const user2Id = TEST_USERS[1].id
  218 | 
  219 |     // Create a transaction as user 1
  220 |     const createResponse = await request.post('http://localhost:3000/api/transactions', {
  221 |       headers: {
  222 |         'Content-Type': 'application/json',
  223 |         'x-user-id': user1Id,
  224 |       },
  225 |       data: {
  226 |         amount: 100000,
  227 |         currency: 'VND',
  228 |         type: 'EXPENSE',
  229 |         categoryId: 'test-cat',
  230 |         description: 'Test Transaction',
  231 |         date: new Date().toISOString(),
  232 |       },
  233 |     })
  234 |     const createData = await createResponse.json()
  235 |     const txId = createData.data?.id
  236 | 
  237 |     if (!txId) {
  238 |       // Transaction creation might fail in test env, skip this part
  239 |       console.log('Could not create transaction for ID access test')
  240 |       return
  241 |     }
  242 | 
  243 |     // Try to access it as user 2
  244 |     const accessResponse = await request.get(`http://localhost:3000/api/transactions/${txId}`, {
  245 |       headers: {
  246 |         'x-user-id': user2Id, // Different user!
  247 |       },
  248 |     })
  249 | 
  250 |     // Should get 403 Forbidden (access denied)
  251 |     expect(accessResponse.status()).toBe(403)
  252 |   })
  253 | 
  254 |   test('GET /dashboard without auth header returns 401', async ({ request }) => {
  255 |     const response = await request.get('http://localhost:3000/api/dashboard', {
  256 |       headers: {
  257 |         'Content-Type': 'application/json',
  258 |       },
  259 |     })
  260 | 
> 261 |     expect(response.status()).toBe(401)
      |                               ^ Error: expect(received).toBe(expected) // Object.is equality
  262 |   })
  263 | })
  264 | 
```