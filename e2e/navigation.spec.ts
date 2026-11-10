import { test, expect } from '@playwright/test';

import { setLoginInfo, defaultMocks, tradeMocks } from './helpers';

test.describe('Finans Kalbi navigation - desktop sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await defaultMocks(page);
    await tradeMocks(page);
    await setLoginInfo(page);
  });

  test('sidebar lists the sections and routes to their pages', async ({ page }) => {
    await page.goto('/dashboard');
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    for (const label of ['GENEL', 'İŞLEM MERKEZİ', 'ANALİZ', 'YAKINDA']) {
      await expect(sidebar.getByText(label, { exact: true })).toBeVisible();
    }

    const dashboardLink = sidebar.locator('a', { hasText: 'Dashboard' });
    await expect(dashboardLink).toHaveClass(/sidebar-link-active/);

    await sidebar.locator('a', { hasText: 'Açık Pozisyonlar' }).click();
    await expect(page).toHaveURL(/open_trades/);
    await expect(sidebar.locator('a', { hasText: 'Açık Pozisyonlar' })).toHaveClass(
      /sidebar-link-active/,
    );
    await expect(dashboardLink).not.toHaveClass(/sidebar-link-active/);

    await sidebar.locator('a', { hasText: 'Portföy' }).click();
    await expect(page).toHaveURL(/balance/);

    await sidebar.locator('a', { hasText: 'Piyasalar' }).click();
    await expect(page).toHaveURL(/pairlist/);
  });

  test('coming-soon items are shown but not clickable links', async ({ page }) => {
    await page.goto('/dashboard');
    const sidebar = page.locator('aside');
    await expect(sidebar.locator('a', { hasText: 'JARVIS AI' })).toHaveCount(0);
    await expect(sidebar.getByText('JARVIS AI', { exact: true })).toBeVisible();
  });
});

test.describe('Finans Kalbi navigation - mobile footer', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await defaultMocks(page);
    await tradeMocks(page);
    await setLoginInfo(page);
  });

  test('desktop sidebar is hidden and the bottom bar navigates', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('aside')).toBeHidden();

    const footer = page.locator('footer');
    for (const label of ['Trades', 'History', 'Pairlist', 'Balance', 'Dashboard']) {
      await expect(footer.getByText(label, { exact: true })).toBeVisible();
    }

    await footer.getByText('Balance', { exact: true }).click();
    await expect(page).toHaveURL(/balance/);

    await footer.getByText('Dashboard', { exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);
  });
});
