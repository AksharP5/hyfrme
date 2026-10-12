import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const publicStatus = provider => ({
  driver: provider.driver,
  enabled: provider.enabled,
  installed: provider.installed,
  advisory: provider.versionAdvisory && {
    status: provider.versionAdvisory.status,
    latestVersion: provider.versionAdvisory.latestVersion,
    checkedAt: provider.versionAdvisory.checkedAt,
    message: provider.versionAdvisory.message,
  },
});
const completed = (provider, startedAt) => !provider.enabled || !provider.installed || (
  Date.parse(provider.advisory?.checkedAt) >= startedAt &&
  (['current', 'behind_latest'].includes(provider.advisory.status) ||
    (provider.advisory.status === 'unknown' && provider.advisory.message !== null))
);

export function observeProviderStatus(page) {
  let providers = [];
  const visit = value => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value.providers) && value.providers.every(provider => typeof provider.driver === 'string')) {
      providers = value.providers.map(publicStatus);
    }
    for (const child of Object.values(value)) visit(child);
  };
  page.on('websocket', socket => socket.on('framereceived', ({ payload }) => {
    if (typeof payload !== 'string') return;
    for (const line of payload.split('\n')) {
      try { visit(JSON.parse(line)); } catch { /* Non-JSON transport frames carry no provider readiness evidence. */ }
    }
  }));
  return () => providers;
}

export async function waitProviderReadiness(page, backend, startedAt, observed) {
  const deadline = performance.now() + 30000;
  const files = (await readdir(resolve(backend, 'caches'))).filter(file => file.endsWith('.json'));
  let providers;
  for (;;) {
    providers = await Promise.all(files.map(async file => publicStatus(JSON.parse(await readFile(resolve(backend, 'caches', file), 'utf8')))));
    const installed = providers.filter(provider => provider.enabled && provider.installed);
    const browser = observed();
    if (installed.length && providers.every(provider => completed(provider, startedAt)) && installed.every(provider => browser.some(value => value.driver === provider.driver && JSON.stringify(value.advisory) === JSON.stringify(provider.advisory)))) break;
    if (performance.now() >= deadline) throw new Error('Provider hydration did not produce completed, browser-observed advisories');
    await new Promise(done => setTimeout(done, 100));
  }
  const behind = providers.filter(provider => provider.enabled && provider.advisory?.status === 'behind_latest');
  if (behind.length) {
    const title = behind.length > 1 ? `Updates Available: ${behind.length} providers` : /^Update Available:/;
    await page.getByText(title, { exact: typeof title === 'string' }).waitFor({ state: 'visible', timeout: 3000 });
  }
  await page.locator('button[data-slot="toast-close"]').evaluateAll(buttons => buttons.forEach(button => button.click()));
  await page.waitForFunction(() => !document.querySelector('[data-slot="toast-popup"],[data-position][style*="--toast-index"],button[data-slot="toast-close"]'), null, { timeout: 3000 });
  return { startedAt, providers, browserObserved: observed(), dismissedNodesDetached: true };
}

export async function assertNoToast(page, frame) {
  const toast = await page.locator('[data-slot="toast-popup"],[data-position][style*="--toast-index"]').evaluateAll(nodes => nodes.map(node => ({ text: node.textContent, connected: node.isConnected })));
  if (toast.length) throw new Error(`Unexpected native toast at frame ${frame}: ${JSON.stringify(toast)}`);
}
