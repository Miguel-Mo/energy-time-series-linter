"""Package only the verified static distribution. Requires Python 3 stdlib."""
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
dist = root / 'dist'
manifest = json.loads((dist / 'release-manifest.json').read_text(encoding='utf-8'))
version = json.loads((root / 'package.json').read_text(encoding='utf-8'))['version']
assert manifest['appVersion'] == version, 'Run build and release:check first'
actual = {p.relative_to(dist).as_posix() for p in dist.rglob('*') if p.is_file()}
assert actual == set(manifest['files']) | {'release-manifest.json'}, 'Distribution file set changed'
for name, expected in manifest['files'].items():
    path = (dist / name).resolve()
    assert path.is_relative_to(dist.resolve()), 'Invalid manifest path'
    assert hashlib.sha256(path.read_bytes()).hexdigest() == expected, f'Changed file: {name}'
output = root / 'releases'
output.mkdir(exist_ok=True)
archive = output / f'energy-time-series-linter-{version}.zip'
with ZipFile(archive, 'w', compression=ZIP_DEFLATED) as zipped:
    for name in sorted(actual):
        zipped.write(dist / name, name)
digest = hashlib.sha256(archive.read_bytes()).hexdigest()
(output / f'{archive.name}.sha256').write_text(f'{digest}  {archive.name}\n', encoding='utf-8')
print(f'{archive}\nSHA-256: {digest}')
