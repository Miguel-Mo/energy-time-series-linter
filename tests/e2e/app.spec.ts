import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { EXAMPLES } from '../../src/examples';

test('offline analysis, JSON export, finding details and responsive layout', async ({ page, context }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/'); await expect(page.getByRole('status')).toContainText('Listo');
  await page.screenshot({ path: testInfo.outputPath('landing.png'), fullPage: true, scale: 'css' });
  const requests: string[] = []; context.on('request', r => { if (/^https?:|^wss?:/.test(r.url())) requests.push(r.url()); });
  await context.setOffline(true);
  await page.locator('#file').setInputFiles({ name: 'example.csv', mimeType: 'text/csv', buffer: Buffer.from(EXAMPLES.duplicate.text) });
  await expect(page.getByRole('status')).toContainText('Archivo leído');
  await page.getByLabel('Tipo de medición').selectOption('power-instant');
  await page.getByLabel('He revisado').check(); await page.getByRole('button', { name: 'Analizar archivo' }).click();
  await expect(page.getByRole('status')).toContainText('Análisis terminado');
  await expect(page.locator('#summary')).toContainText('1 errores');
  await page.getByLabel('Severidad').selectOption('error');
  await page.getByRole('button', { name: /TS_DUPLICATE_TIMESTAMP/ }).click();
  await expect(page.locator('#detail')).toContainText('Registros 3, 4');
  await page.screenshot({ path: testInfo.outputPath('report.png'), fullPage: true, scale: 'css' });
  await page.locator('#results').screenshot({ path: testInfo.outputPath('results-detail.png'), scale: 'css' });
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar JSON' }).click();
  const download = await downloadPromise; const json = JSON.parse(await readFile((await download.path())!, 'utf8'));
  expect(json.reportVersion).toBe('1.0.0'); expect(json.energy.totalKWh).toBeNull(); expect(json.file.sha256).toBe(createHash('sha256').update(EXAMPLES.duplicate.text).digest('hex'));
  expect(requests).toEqual([]); expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(await context.cookies()).toEqual([]);
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
  await page.getByLabel('Unidad', { exact: true }).selectOption('W');
  await expect(page.locator('#results')).toBeHidden(); await expect(page.getByLabel('He revisado')).not.toBeChecked();
});

test('empty, oversized and invalid-encoding files fail safely', async ({ page }) => {
  await page.goto('/'); await expect(page.getByRole('status')).toContainText('Listo');
  await page.locator('#file').setInputFiles({ name: 'empty.csv', mimeType: 'text/csv', buffer: Buffer.alloc(0) });
  await expect(page.getByRole('status')).toContainText('Archivo leído');
  await page.getByLabel('Tipo de medición').selectOption('power-instant');
  await page.getByLabel('Unidad', { exact: true }).selectOption('kW');
  await page.getByLabel('He revisado').check(); await page.getByRole('button', { name: 'Analizar archivo' }).click();
  await expect(page.locator('#findings')).toContainText('CSV_EMPTY');
  await page.locator('#file').setInputFiles({ name: 'large.csv', mimeType: 'text/csv', buffer: Buffer.alloc(10 * 1024 * 1024 + 1, 65) });
  await expect(page.getByRole('status')).toContainText('límite del MVP es 10 MiB');
  await expect(page.locator('#results')).toBeHidden();
  await page.locator('#file').setInputFiles({ name: 'wrong-encoding.csv', mimeType: 'text/csv', buffer: Buffer.from([0xff, 0xfe, 0x00]) });
  await expect(page.getByRole('status')).toContainText('UTF-8');
  await expect(page.locator('#results')).toBeHidden();
});

test('large analysis remains cancellable and can restart offline', async ({ page, context }) => {
  test.setTimeout(45000);
  await page.goto('/'); await expect(page.getByRole('status')).toContainText('Listo');
  await context.setOffline(true);
  const text = 'timestamp,power_kW\n' + Array.from({ length: 100000 }, (_, i) => `${new Date(Date.UTC(2024, 0, 1) + i * 900000).toISOString()},2`).join('\n');
  await page.locator('#file').setInputFiles({ name: 'large-valid.csv', mimeType: 'text/csv', buffer: Buffer.from(text) });
  await expect(page.getByRole('status')).toContainText('Archivo leído');
  await page.getByLabel('Tipo de medición').selectOption('power-instant');
  await page.getByLabel('He revisado').check(); await page.getByRole('button', { name: 'Analizar archivo' }).click();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('cancelado');
  await expect(page.locator('#results')).toBeHidden();
  await page.getByRole('button', { name: 'Probar ejemplo' }).click();
  await expect(page.getByRole('status')).toContainText('Archivo leído');
});

test('examples, energy calculation and hostile cell content stay local and inert', async ({ page }) => {
  await page.goto('/'); await expect(page.getByRole('status')).toContainText('Listo');
  await page.getByRole('button', { name: 'Probar ejemplo' }).click();
  await expect(page.getByRole('status')).toContainText('Archivo leído');
  await page.getByLabel('Tipo de medición').selectOption('power-instant');
  await page.getByLabel('He revisado').check(); await page.getByRole('button', { name: 'Analizar archivo' }).click();
  await expect(page.locator('#energy-total')).toHaveText('2 kWh · aproximada');
  await page.locator('#file').setInputFiles({ name: '<script>.csv', mimeType: 'text/csv', buffer: Buffer.from('timestamp,power_kW\n2024-01-01T00:00Z,<img src=x onerror=alert(1)>') });
  await expect(page.locator('#preview')).toContainText('<img src=x onerror=alert(1)>');
  await expect(page.locator('#preview img')).toHaveCount(0);
});
