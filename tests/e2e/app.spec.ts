import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { EXAMPLES } from '../../src/examples';
import AxeBuilder from '@axe-core/playwright';

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
  expect(json.reportVersion).toBe('2.0.0'); expect(json.energy.totalKWh).toBeNull(); expect(json.file.sha256).toBe(createHash('sha256').update(EXAMPLES.duplicate.text).digest('hex'));
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

test('guided configuration, linked errors and expected-period summary', async ({ page }, testInfo) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Probar ejemplo' }).click();
  await expect(page.getByRole('status')).toContainText('Archivo leído');
  await expect(page.locator('#interval')).toBeHidden();
  await page.getByLabel('Tipo de medición').selectOption('power-mean');
  await expect(page.locator('#interval')).toBeVisible();
  await expect(page.locator('#measurement-help')).toContainText('0,5 kWh');
  await page.getByLabel('He revisado').check(); await page.getByRole('button', { name: 'Analizar archivo' }).click();
  await expect(page.locator('#form-errors')).toBeFocused();
  await expect(page.locator('#interval')).toHaveAttribute('aria-invalid', 'true');
  await page.getByRole('link', { name: 'Indica cuántos minutos abarca cada medición.' }).click();
  await expect(page.locator('#interval')).toBeFocused();
  await page.locator('#interval').fill('10'); await page.getByLabel('Cadencia esperada (min)', { exact: true }).fill('15');
  await page.getByText('Periodo esperado · opcional', { exact: true }).click();
  await page.locator('#expected-start').fill('2023-12-31T23:45Z'); await page.locator('#expected-end').fill('2024-01-01T01:15Z');
  await page.getByLabel('He revisado').check(); await page.getByRole('button', { name: 'Analizar archivo' }).click();
  await expect(page.getByRole('status')).toContainText('Análisis terminado');
  await expect(page.locator('#summary')).toContainText('5 instantes presentes / 7 esperados');
  await expect(page.locator('#summary')).toContainText('Valores interpretables');
  await expect(page.locator('#completeness-explanation')).toContainText('Ausencias en los extremos: 2');
  await expect(page.locator('#energy-total')).toContainText('1,6667 kWh');
  await page.locator('#results').screenshot({ path: testInfo.outputPath('guided-report.png'), scale: 'css' });
});

test('local timestamps require a timezone and hidden duration is not reused', async ({ page }) => {
  await page.goto('/'); await page.locator('#file').setInputFiles({ name: 'local.csv', mimeType: 'text/csv', buffer: Buffer.from(EXAMPLES['correct-15min'].text.replaceAll('Z', '')) });
  await expect(page.getByRole('status')).toContainText('Archivo leído');
  await page.getByLabel('Tipo de medición').selectOption('power-mean'); await page.locator('#interval').fill('60');
  await page.getByLabel('Tipo de medición').selectOption('power-instant');
  await page.getByLabel('He revisado').check(); await page.getByRole('button', { name: 'Analizar archivo' }).click();
  await expect(page.locator('#timezone')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#timezone').fill('Europe/Madrid'); await page.getByLabel('He revisado').check();
  await page.getByRole('button', { name: 'Analizar archivo' }).click();
  await expect(page.locator('#energy-total')).toHaveText('2 kWh · aproximada');
});

test('keyboard, accessible errors, contrast and narrow-screen reflow', async ({ page }) => {
  await page.goto('/'); await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toBeFocused();
  await page.keyboard.press('Enter'); await expect(page.locator('#main')).toBeFocused();
  await page.getByRole('button', { name: 'Probar ejemplo' }).click(); await expect(page.getByRole('status')).toContainText('Archivo leído');
  await page.getByRole('button', { name: 'Analizar archivo' }).click();
  await expect(page.locator('#form-errors')).toBeFocused();
  let result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(result.violations).toEqual([]);
  await page.getByRole('link', { name: 'Selecciona qué representa la medición.' }).focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#measurement')).toBeFocused();
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('Tab');
  await page.locator('#confirm').focus(); await page.keyboard.press('Space');
  await page.keyboard.press('Tab'); await page.keyboard.press('Enter');
  await expect(page.locator('#results-title')).toBeFocused();
  result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(result.violations).toEqual([]);
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
