import { disconnectNetwork } from './network';
import { test, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';

test('explicit timestamps produce identical reports across browser timezone settings', async ({ browser }, testInfo) => {
  test.setTimeout(60000);
  const runs: string[][] = [];
  for (const timezoneId of ['America/Los_Angeles', 'Asia/Tokyo']) {
    const context = await browser.newContext({ timezoneId });
    try {
      const page = await context.newPage(); await page.goto('http://127.0.0.1:43871/');
      await expect(page.getByRole('status')).toContainText('Listo'); await disconnectNetwork(context);
      const reports: string[] = [];
      for (const example of ['correct-15min', 'real:solar-industrial']) {
        await page.getByLabel('Archivo de ejemplo').selectOption(example); await page.getByRole('button', { name: 'Probar ejemplo' }).click();
        await expect(page.getByRole('status')).toContainText('Archivo leído');
        if (example === 'correct-15min') await page.getByLabel('Tipo de medición').selectOption('power-instant');
        await page.getByLabel('He revisado').check(); await page.getByRole('button', { name: 'Analizar archivo' }).click();
        await expect(page.getByRole('status')).toContainText('Análisis terminado');
        const downloading = page.waitForEvent('download'); await page.getByRole('button', { name: 'Descargar JSON' }).click();
        const file = await downloading; reports.push(await readFile((await file.path())!, 'utf8'));
      }
      runs.push(reports);
    } finally { await context.close(); }
  }
  expect(runs[1]).toEqual(runs[0]);
  await writeFile(testInfo.outputPath('reproducibility.json'), JSON.stringify(runs[0]));
  await writeFile(testInfo.outputPath('browser-version.json'), JSON.stringify({ project: testInfo.project.name, browserVersion: browser.version(), timezoneSettings: ['America/Los_Angeles', 'Asia/Tokyo'] }, null, 2));
});
