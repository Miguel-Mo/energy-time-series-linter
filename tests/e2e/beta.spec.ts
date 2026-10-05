import { test, expect } from '@playwright/test';

test('beta help exposes shipped instructions and separate licenses', async ({ page, request }) => {
  await page.goto('/');
  await page.getByText('Beta experimental · Ayuda y licencias', { exact: true }).click();
  await expect(page.locator('#beta-help')).toContainText('no envía incidencias automáticamente');
  for (const [name, text] of [
    ['Guía de la beta', '0.9.0'],
    ['Plantilla para comunicar un fallo', 'Caso mínimo sintético'],
    ['Licencia del código', 'MIT License'],
    ['Fuentes y licencias de los datos', 'CC BY 4.0'],
    ['Licencias de dependencias', 'papaparse'],
  ]) {
    const href = await page.getByRole('link', { name, exact: true }).getAttribute('href');
    const response = await request.get(new URL(href!, page.url()).href);
    expect(response.status()).toBe(200); expect(await response.text()).toContain(text);
  }
  await page.getByRole('link', { name: 'Fuentes y licencias de los datos', exact: true }).focus();
  await expect(page.getByRole('link', { name: 'Fuentes y licencias de los datos', exact: true })).toBeFocused();
});
