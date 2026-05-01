import { expect, test } from '@playwright/test';

const TEMPLATE_NAME = 'Погода в Москве (Open-Meteo)';
const TIMEOUT_MS = 30_000;

test('run API report and download XLSX', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Шаблоны' })).toBeVisible();

  const templateRow = page.getByRole('row').filter({ hasText: TEMPLATE_NAME });
  await expect(templateRow).toBeVisible();

  await templateRow.getByRole('button', { name: 'Запустить' }).click();

  await expect(page.getByText('Отчёт запущен')).toBeVisible({ timeout: 5_000 });

  await page.getByRole('link', { name: 'Запуски' }).click();
  await expect(page.getByRole('heading', { name: 'Запуски' })).toBeVisible();

  const runRow = page.getByRole('row').filter({ hasText: TEMPLATE_NAME }).first();

  await expect(runRow.getByText('завершён')).toBeVisible({ timeout: TIMEOUT_MS });

  const downloadPromise = page.waitForEvent('download');
  await runRow.getByRole('link', { name: 'Скачать' }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
});
