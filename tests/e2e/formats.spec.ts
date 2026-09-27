import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
test('published European timestamps work without an invented timezone and match UTC', async ({ page }) => {
  await page.goto('/'); await page.getByLabel('Archivo de ejemplo').selectOption('real:solar-industrial');
  await page.getByRole('button', { name: 'Probar ejemplo' }).click();
  await expect(page.getByRole('status')).toContainText('Archivo leído');
  const reports = [];
  for (const column of ['0', '2']) {
    await page.locator('#timestamp').selectOption(column);
    await expect(page.locator('#timezone')).not.toHaveAttribute('required', '');
    await page.getByLabel('He revisado').check(); await page.getByRole('button', { name: 'Analizar archivo' }).click();
    await expect(page.getByRole('status')).toContainText('Análisis terminado');
    const downloading = page.waitForEvent('download'); await page.getByRole('button', { name: 'Descargar JSON' }).click();
    const file = await downloading; reports.push(JSON.parse(await readFile((await file.path())!, 'utf8')));
  }
  expect(reports[1].energy).toEqual(reports[0].energy);
  expect(reports[1].inferences).toEqual(reports[0].inferences);
  expect(reports[1].file.sha256).toBe(reports[0].file.sha256);
  expect(reports[1].observed.offsets).toEqual(expect.arrayContaining(['+01:00', '+02:00']));
  expect(reports[1].findings.some((f: { code: string }) => f.code === 'TS_UNSUPPORTED')).toBe(false);
});
