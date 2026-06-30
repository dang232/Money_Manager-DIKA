import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
await page.fill('#email', 'test2@test.com');
await page.fill('#password', 'Test1234!');
await page.click('button[type=submit]');
await page.waitForURL('**/dashboard', { timeout: 10000 });
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2000);
await page.screenshot({ path: 'screenshots/01-dashboard.png', fullPage: true });
console.log('1. Dashboard OK');

// Logout
await page.locator('button', { hasText: 'Logout' }).click();
await page.waitForURL('**/login', { timeout: 5000 });
await page.screenshot({ path: 'screenshots/02-after-logout.png' });
console.log('2. Logout OK');

// Re-login
await page.fill('#email', 'test2@test.com');
await page.fill('#password', 'Test1234!');
await page.click('button[type=submit]');
await page.waitForURL('**/dashboard', { timeout: 10000 });
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2000);
await page.screenshot({ path: 'screenshots/03-re-login.png', fullPage: true });
console.log('3. Re-login OK');

// Navigate pages
await page.click('a[href="/transactions"]');
await page.waitForTimeout(2000);
await page.screenshot({ path: 'screenshots/04-transactions.png', fullPage: true });
console.log('4. Transactions OK');

await page.click('a[href="/budget"]');
await page.waitForTimeout(2000);
await page.screenshot({ path: 'screenshots/05-budget.png', fullPage: true });
console.log('5. Budget OK');

await page.click('a[href="/categories"]');
await page.waitForTimeout(2000);
await page.screenshot({ path: 'screenshots/06-categories.png', fullPage: true });
console.log('6. Categories OK');

await page.click('a[href="/reports"]');
await page.waitForTimeout(2000);
await page.screenshot({ path: 'screenshots/07-reports.png', fullPage: true });
console.log('7. Reports OK');

await browser.close();
console.log('All done!');
