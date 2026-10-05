import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';
const root = 'test-results';
const run = JSON.parse(await readFile(join(root, '.last-run.json'), 'utf8'));
assert.equal(run.status, 'passed', 'The preceding browser test run must pass.');
const entries = await readdir(root, { withFileTypes: true });
const results = [];
for (const dir of entries.filter(e => e.isDirectory())) {
  let bytes;
  try { bytes = await readFile(join(root, dir.name, 'reproducibility.json'), 'utf8'); }
  catch (error) { if (error.code === 'ENOENT') continue; throw error; }
  const metadata = JSON.parse(await readFile(join(root, dir.name, 'browser-version.json'), 'utf8'));
  results.push({ bytes, ...metadata });
}
assert.deepEqual(results.map(r => r.project).sort(), ['desktop', 'firefox', 'mobile', 'webkit'], 'Run the full e2e suite before comparing reports; all four project artifacts are required.');
for (const result of results) assert.equal(result.bytes, results[0].bytes, `Report mismatch: ${result.project}`);
console.log('Exact JSON parity: two datasets, four projects, two browser timezone settings.');
console.log(JSON.stringify(results.map(({ bytes, ...metadata }) => metadata), null, 2));
