const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots', 'qa-run');
const BASE_URL = 'http://localhost:5173';
const TEST_USER = {
  name: 'QA Tester',
  email: `qa_test_${Date.now()}@test.com`,
  password: 'TestPass123!'
};

// Ensure screenshot directory exists
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function screenshot(page, name, mobile = false) {
  const suffix = mobile ? '_mobile' : '_desktop';
  const filepath = path.join(SCREENSHOT_DIR, `${name}${suffix}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`  [SCREENSHOT] ${name}${suffix}.png`);
  return filepath;
}

async function testWithViewport(page, context, isMobile) {
  const label = isMobile ? 'MOBILE' : 'DESKTOP';
  const viewport = isMobile ? { width: 375, height: 812 } : { width: 1440, height: 900 };
  await page.setViewportSize(viewport);
  console.log(`\n=== Testing ${label} (${viewport.width}x${viewport.height}) ===\n`);

  // 1. Landing/Login page
  console.log('[TEST] Landing/Login Page');
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);
  await screenshot(page, '01_landing', isMobile);

  // Check what page we're on
  const url = page.url();
  console.log(`  Current URL: ${url}`);

  // 2. Navigate to register if available
  console.log('[TEST] Registration Page');
  try {
    const registerLink = await page.locator('a[href*="register"], button:has-text("Register"), a:has-text("Register"), a:has-text("Sign up"), button:has-text("Sign up")').first();
    if (await registerLink.isVisible({ timeout: 3000 })) {
      await registerLink.click();
      await page.waitForTimeout(1000);
    } else {
      await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle', timeout: 10000 });
      await page.waitForTimeout(1000);
    }
  } catch {
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1000);
  }
  await screenshot(page, '02_register', isMobile);

  // 3. Try to register (only on desktop pass to avoid duplicate)
  if (!isMobile) {
    console.log('[TEST] Registration Flow');
    try {
      // Fill registration form
      const nameInput = await page.locator('input[name="name"], input[placeholder*="name" i], input[type="text"]').first();
      const emailInput = await page.locator('input[name="email"], input[type="email"], input[placeholder*="email" i]').first();
      const passwordInput = await page.locator('input[name="password"], input[type="password"]').first();

      if (await nameInput.isVisible({ timeout: 3000 })) {
        await nameInput.fill(TEST_USER.name);
      }
      if (await emailInput.isVisible({ timeout: 3000 })) {
        await emailInput.fill(TEST_USER.email);
      }
      if (await passwordInput.isVisible({ timeout: 3000 })) {
        await passwordInput.fill(TEST_USER.password);
      }

      // Check for confirm password
      const confirmPassword = await page.locator('input[name="confirmPassword"], input[name="password_confirm"], input[placeholder*="confirm" i]').first();
      if (await confirmPassword.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmPassword.fill(TEST_USER.password);
      }

      await screenshot(page, '03_register_filled', isMobile);

      // Submit registration
      const submitBtn = await page.locator('button[type="submit"], button:has-text("Register"), button:has-text("Sign up"), button:has-text("Create")').first();
      if (await submitBtn.isVisible({ timeout: 3000 })) {
        await submitBtn.click();
        await page.waitForTimeout(3000);
      }
      await screenshot(page, '04_after_register', isMobile);
      console.log(`  After registration URL: ${page.url()}`);
    } catch (e) {
      console.log(`  Registration failed: ${e.message}`);
      await screenshot(page, '04_register_error', isMobile);
    }
  }

  // 4. Login flow
  console.log('[TEST] Login Page');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(1000);
  await screenshot(page, '05_login', isMobile);

  if (!isMobile) {
    console.log('[TEST] Login Flow');
    try {
      const emailInput = await page.locator('input[name="email"], input[type="email"], input[placeholder*="email" i]').first();
      const passwordInput = await page.locator('input[name="password"], input[type="password"]').first();

      if (await emailInput.isVisible({ timeout: 3000 })) {
        await emailInput.fill(TEST_USER.email);
      }
      if (await passwordInput.isVisible({ timeout: 3000 })) {
        await passwordInput.fill(TEST_USER.password);
      }

      await screenshot(page, '06_login_filled', isMobile);

      const submitBtn = await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in"), button:has-text("Log in")').first();
      if (await submitBtn.isVisible({ timeout: 3000 })) {
        await submitBtn.click();
        await page.waitForTimeout(3000);
      }
      await screenshot(page, '07_after_login', isMobile);
      console.log(`  After login URL: ${page.url()}`);
    } catch (e) {
      console.log(`  Login failed: ${e.message}`);
      await screenshot(page, '07_login_error', isMobile);
    }
  } else {
    // For mobile, just login with same credentials
    try {
      const emailInput = await page.locator('input[name="email"], input[type="email"], input[placeholder*="email" i]').first();
      const passwordInput = await page.locator('input[name="password"], input[type="password"]').first();
      if (await emailInput.isVisible({ timeout: 3000 })) {
        await emailInput.fill(TEST_USER.email);
      }
      if (await passwordInput.isVisible({ timeout: 3000 })) {
        await passwordInput.fill(TEST_USER.password);
      }
      const submitBtn = await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in"), button:has-text("Log in")').first();
      if (await submitBtn.isVisible({ timeout: 3000 })) {
        await submitBtn.click();
        await page.waitForTimeout(3000);
      }
    } catch (e) {
      console.log(`  Mobile login: ${e.message}`);
    }
  }

  // 5. Dashboard
  console.log('[TEST] Dashboard');
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(2000);
  await screenshot(page, '08_dashboard', isMobile);
  console.log(`  Dashboard URL: ${page.url()}`);

  // 6. Transactions page
  console.log('[TEST] Transactions Page');
  await page.goto(`${BASE_URL}/transactions`, { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(1500);
  await screenshot(page, '09_transactions', isMobile);

  // Try to open add transaction modal
  try {
    const addBtn = await page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("+"), [data-testid*="add"]').first();
    if (await addBtn.isVisible({ timeout: 3000 })) {
      await addBtn.click();
      await page.waitForTimeout(1000);
      await screenshot(page, '10_add_transaction_modal', isMobile);
      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  } catch (e) {
    console.log(`  Add transaction modal: ${e.message}`);
  }

  // 7. Budgets page
  console.log('[TEST] Budgets Page');
  await page.goto(`${BASE_URL}/budgets`, { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(1500);
  await screenshot(page, '11_budgets', isMobile);

  // 8. Reports/Analytics page
  console.log('[TEST] Reports/Analytics Page');
  await page.goto(`${BASE_URL}/reports`, { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(1500);
  await screenshot(page, '12_reports', isMobile);

  // Try analytics too
  await page.goto(`${BASE_URL}/analytics`, { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(1500);
  await screenshot(page, '13_analytics', isMobile);

  // 9. Settings page
  console.log('[TEST] Settings Page');
  await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(1500);
  await screenshot(page, '14_settings', isMobile);

  // 10. Profile page
  console.log('[TEST] Profile Page');
  await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(1500);
  await screenshot(page, '15_profile', isMobile);

  // 11. Check sidebar/navigation
  console.log('[TEST] Navigation/Sidebar');
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(1000);

  if (isMobile) {
    // Try to open mobile menu
    try {
      const menuBtn = await page.locator('button[aria-label*="menu" i], button:has-text("☰"), .hamburger, [data-testid*="menu"]').first();
      if (await menuBtn.isVisible({ timeout: 3000 })) {
        await menuBtn.click();
        await page.waitForTimeout(800);
        await screenshot(page, '16_mobile_menu', isMobile);
      }
    } catch (e) {
      console.log(`  Mobile menu: ${e.message}`);
    }
  }

  // 12. Test hover states and interactions (desktop only)
  if (!isMobile) {
    console.log('[TEST] Interaction States');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1000);

    // Hover over nav items
    try {
      const navLinks = await page.locator('nav a, aside a, .sidebar a').all();
      if (navLinks.length > 0) {
        await navLinks[0].hover();
        await page.waitForTimeout(300);
        await screenshot(page, '17_nav_hover', isMobile);
      }
    } catch (e) {
      console.log(`  Nav hover: ${e.message}`);
    }

    // Check for empty states
    console.log('[TEST] Empty States');
    await page.goto(`${BASE_URL}/transactions`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1500);
    await screenshot(page, '18_empty_state', isMobile);
  }

  // 13. Test 404/error page
  console.log('[TEST] 404 Page');
  await page.goto(`${BASE_URL}/nonexistent-page-xyz`, { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(1000);
  await screenshot(page, '19_404_page', isMobile);

  // 14. Onboarding (if available)
  console.log('[TEST] Onboarding Page');
  await page.goto(`${BASE_URL}/onboarding`, { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(1500);
  await screenshot(page, '20_onboarding', isMobile);
}

async function run() {
  console.log('Starting QA Full App Test...');
  console.log(`Test user: ${TEST_USER.email}`);
  console.log(`Screenshots: ${SCREENSHOT_DIR}\n`);

  const browser = await chromium.launch({ headless: true });

  try {
    // Desktop test
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const desktopPage = await desktopContext.newPage();
    await testWithViewport(desktopPage, desktopContext, false);
    await desktopContext.close();

    // Mobile test
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();
    await testWithViewport(mobilePage, mobileContext, true);
    await mobileContext.close();

  } finally {
    await browser.close();
    console.log('\n=== Test Complete ===');
    console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);
  }
}

run().catch(e => {
  console.error('Test failed:', e);
  process.exit(1);
});
