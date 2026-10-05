import type { BrowserContext } from '@playwright/test';
export async function disconnectNetwork(context: BrowserContext) {
  // Windows WebKit's offline emulation also breaks reads of in-memory File/Blob.
  // Block actual network schemes there while leaving local blob resources usable.
  await context.route(/^https?:\/\//, route => route.abort('internetdisconnected'));
  await context.routeWebSocket(/.*/, socket => socket.close());
  if (context.browser()?.browserType().name() !== 'webkit') await context.setOffline(true);
}
