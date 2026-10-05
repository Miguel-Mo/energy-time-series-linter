import { expect, type Page } from '@playwright/test';

export async function expectNarrowReflow(page: Page) {
  // Resizing can precede the next layout update in WebKit; keep the same limit.
  await expect.poll(async () => page.evaluate(() => {
    const width = document.documentElement.scrollWidth;
    if (width <= innerWidth) return 'fits';
    const overflowing = [...document.querySelectorAll('body *')].filter(e => !e.closest('table') && e.getBoundingClientRect().right > innerWidth).slice(0, 40).map(e => ({ tag: e.tagName, id: e.id, class: e.className, left: e.getBoundingClientRect().left, right: e.getBoundingClientRect().right, width: e.getBoundingClientRect().width, overflow: getComputedStyle(e).overflow, text: e.textContent?.slice(0, 80) }));
    return JSON.stringify({ viewport: innerWidth, width, overflowing });
  }), { message: 'Page must reflow without horizontal document scrolling at 320px' }).toBe('fits');
}
