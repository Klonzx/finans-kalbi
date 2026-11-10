import { test, expect, type Page } from '@playwright/test';
import { setLoginInfo, defaultMocks, tradeMocks } from './helpers';

// The KPI/market/JARVIS section sits above the widget grid, so grid widgets are
// below the fold on load. Scroll each one into view before asserting viewport presence.
async function expectInView(page: Page, selector: string) {
  const header = page.locator('.drag-header', { hasText: selector });
  await header.scrollIntoViewIfNeeded();
  await expect(header).toBeInViewport();
}

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await defaultMocks(page);
    await tradeMocks(page);
    await setLoginInfo(page);
  });
  test('Dashboard Page', async ({ page }) => {
    await Promise.all([
      page.goto('/dashboard'),
      page.waitForResponse('**/status'),
      page.waitForResponse('**/profit'),
      page.waitForResponse('**/balance'),
      // page.waitForResponse('**/trades'),
      page.waitForResponse('**/whitelist'),
      page.waitForResponse('**/blacklist'),
      page.waitForResponse('**/locks'),
    ]);
    await expect(page.locator('.drag-header', { hasText: 'Bot comparison' })).toBeVisible();
    await expectInView(page, 'Bot comparison');
    await expect(page.locator('.drag-header', { hasText: 'Profit over time' })).toBeVisible();
    await expectInView(page, 'Profit over time');
    await expect(page.locator('.drag-header', { hasText: 'Open trades' })).toBeVisible();
    await expectInView(page, 'Open trades');
    await expect(page.locator('.drag-header', { hasText: 'Cumulative Profit' })).toBeVisible();
    await expectInView(page, 'Cumulative Profit');

    await expect(page.locator('span').filter({ hasText: /^TestBot$/ })).toBeVisible();
    await expect(page.locator('span', { hasText: 'Summary' })).toBeVisible();
    // Scroll to bottom
    await page.locator('.drag-header', { hasText: 'Trades Log' }).scrollIntoViewIfNeeded();
    await expect(page.locator('.drag-header', { hasText: 'Closed Trades' })).toBeInViewport();
    await expect(page.locator('.drag-header', { hasText: 'Profit Distribution' })).toBeInViewport();

    await expect(page.locator('.drag-header', { hasText: 'Trades Log' })).toBeInViewport();
  });

  test('Dashboard Page - mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await Promise.all([
      page.goto('/dashboard'),
      page.waitForResponse('**/status'),
      page.waitForResponse('**/profit'),
      page.waitForResponse('**/balance'),
      page.waitForResponse('**/whitelist'),
      page.waitForResponse('**/blacklist'),
      page.waitForResponse('**/locks'),
    ]);
    await expect(page.locator('.drag-header', { hasText: 'Bot comparison' })).toBeVisible();

    const viewportWidth = page.viewportSize()?.width ?? 0;
    // Grid cards must not be wider than the screen - otherwise most columns
    // are rendered off-screen and are unreachable on a phone.
    const cardWidths = await page
      .locator('.vue-grid-item:not(.vue-grid-placeholder)')
      .evaluateAll((elements) => elements.map((el) => el.getBoundingClientRect().width));

    expect(cardWidths.length).toBeGreaterThan(0);
    for (const cardWidth of cardWidths) {
      expect(cardWidth).toBeLessThanOrEqual(viewportWidth);
    }
    await expect(page.getByText('Open Trades')).toBeVisible();
    await page.getByText('Open Trades').scrollIntoViewIfNeeded();
    await expect(page.getByText('Open Trades')).toBeInViewport();
  });
});
