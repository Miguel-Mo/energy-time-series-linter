import { expect, type Page } from '@playwright/test';

export async function expectNarrowReflow(page: Page) {
  // Resizing can precede the next layout update in WebKit; keep the same limit.
  await expect.poll(async () => page.evaluate(() => {
    const width = document.documentElement.scrollWidth;
    if (width <= innerWidth) return 'fits';
    const overflowing = [...document.querySelectorAll('body *')].filter(e => !e.closest('table') && e.getBoundingClientRect().right > innerWidth).slice(0, 40).map(e => ({ tag: e.tagName, id: e.id, class: e.className, left: e.getBoundingClientRect().left, right: e.getBoundingClientRect().right, width: e.getBoundingClientRect().width, overflow: getComputedStyle(e).overflow, text: e.textContent?.slice(0, 80) }));
    const isolation = [...document.querySelectorAll('.table-wrap, input, select, .topbar, .steps, .audit, .upload-panel, .config-panel, .preview-panel, .energy-panel, footer')].map(e => {
      const element = e as HTMLElement, original = element.style.display;
      element.style.display = 'none';
      const hiddenWidth = document.documentElement.scrollWidth;
      element.style.display = original;
      return { tag: e.tagName, id: e.id, class: e.className, hiddenWidth };
    }).filter(e => e.hiddenWidth !== width);
    return JSON.stringify({ viewport: innerWidth, width, client: document.documentElement.clientWidth, body: document.body.scrollWidth, overflowing, isolation });
  }), { message: 'Page must reflow without horizontal document scrolling at 320px' }).toBe('fits');
}
