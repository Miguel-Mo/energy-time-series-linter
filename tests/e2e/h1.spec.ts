import { disconnectNetwork } from './network';
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
const manifest = JSON.parse(readFileSync('examples/real/manifest.json', 'utf8'));

for (const fixture of manifest.cases) {
  test(`H1 internal walkthrough: ${fixture.file}`, async ({ page, context }, testInfo) => {
    await page.goto('/'); await expect(page.getByRole('status')).toContainText('Listo');
    await disconnectNetwork(context);
    const requests: string[] = []; context.on('request', r => { if (/^https?:/.test(r.url())) requests.push(r.url()); });
    await page.getByLabel('Archivo de ejemplo').selectOption('real:' + fixture.file.replace('.csv', ''));
    await page.getByRole('button', { name: 'Probar ejemplo' }).click();
    await expect(page.getByRole('status')).toContainText('Archivo leído');
    await expect(page.locator('#example-help')).toContainText('La fuente rellenó algunos huecos');
    await expect(page.locator('#measurement')).toHaveValue('counter'); await expect(page.locator('#unit')).toHaveValue('kWh');
    await expect(page.locator('#confirm')).not.toBeChecked();
    await page.getByRole('button', { name: 'Analizar archivo' }).click();
    await expect(page.locator('#form-errors')).toContainText('Confirma que has revisado');
    await page.getByLabel('He revisado').check(); await page.getByRole('button', { name: 'Analizar archivo' }).click();
    await expect(page.getByRole('status')).toContainText('Análisis terminado');
    await expect(page.locator('#export-help')).toContainText('muestras de celdas');
    const downloading = page.waitForEvent('download'); await page.getByRole('button', { name: 'Descargar JSON' }).click();
    const download = await downloading;
    const report = JSON.parse(await readFile((await download.path())!, 'utf8'));
    expect(report.file.sha256).toBe(fixture.sha256); expect(report.observed.rows).toBe(fixture.rows);
    expect(report.values.missing).toBe(fixture.missingValues);
    expect(report.inferences.temporalCompletenessPercent).toBe(100);
    expect(report.inferences.usableCompletenessPercent).toBeCloseTo((fixture.rows - fixture.missingValues) / fixture.rows * 100);
    expect(report.configuration.measurement).toBe('counter'); expect(requests).toEqual([]);
    if (fixture.missingValues) {
      await page.locator('#preview').focus(); await expect(page.locator('#preview')).toBeFocused();
      await page.keyboard.press('ArrowRight');
      await expect.poll(() => page.locator('#preview').evaluate(e => e.scrollLeft)).toBeGreaterThan(0);
      await page.getByRole('button', { name: /VALUE_MISSING/ }).click();
      expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
      await page.locator('#setup').screenshot({ path: testInfo.outputPath('real-guidance.png'), scale: 'css' });
    }
    // An arbitrary file must not inherit the known example's semantic preset.
    await page.locator('#file').setInputFiles({ name: 'unknown.csv', mimeType: 'text/csv', buffer: Buffer.from('timestamp,power_kW\n2024-01-01T00:00Z,2') });
    await expect(page.getByRole('status')).toContainText('Archivo leído');
    await expect(page.locator('#example-help')).toBeHidden(); await expect(page.locator('#measurement')).toHaveValue('');
    await expect(page.locator('#cadence')).toHaveValue(''); await expect(page.locator('#confirm')).not.toBeChecked();
  });
}
