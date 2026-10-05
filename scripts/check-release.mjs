import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
async function files(dir, prefix = '') {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    assert(!entry.isSymbolicLink(), 'No symlinks in distribution');
    const path = `${prefix}${entry.name}`;
    if (entry.isDirectory()) result.push(...await files(`${dir}/${entry.name}`, `${path}/`));
    else if (path !== 'release-manifest.json') result.push(path);
  }
  return result.sort();
}
const paths = await files('dist');
for (const name of ['index.html', 'LICENSE.txt', 'THIRD_PARTY_NOTICES.txt', 'DATA_NOTICES.txt', 'SUPPORT.txt', 'BETA.txt']) assert(paths.includes(name), `Missing ${name}`);
for (const name of ['LICENSE.txt', 'THIRD_PARTY_NOTICES.txt', 'DATA_NOTICES.txt', 'SUPPORT.txt', 'BETA.txt']) assert.deepEqual(await readFile(`dist/${name}`), await readFile(`public/${name}`), `Stale ${name}: rebuild`);
const js = paths.filter(p => p.startsWith('assets/') && p.endsWith('.js'));
assert(js.length > 0, 'Missing compiled JS');
assert((await Promise.all(js.map(p => readFile(`dist/${p}`, 'utf8')))).some(content => content.includes(pkg.version)), 'Built app version does not match package.json');
assert((await readFile('dist/index.html', 'utf8')).includes('./assets/'), 'Expected relative asset URLs');
assert(paths.every(p => /^(assets\/[^/]+\.(js|css)|index\.html|[A-Z_]+\.txt)$/.test(p)), 'Unexpected file in dist; inspect before publishing');
const hashes = {};
for (const path of paths) hashes[path] = createHash('sha256').update(await readFile(`dist/${path}`)).digest('hex');
await writeFile('dist/release-manifest.json', JSON.stringify({ appVersion: pkg.version, files: hashes }, null, 2) + '\n');
console.log(`Distribution ${pkg.version}: ${paths.length} files verified; SHA-256 manifest written.`);
