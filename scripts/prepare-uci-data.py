"""Extract published records without repairing values or timestamps (stdlib only)."""
from pathlib import Path
from urllib.request import urlretrieve
from zipfile import ZipFile
from hashlib import sha256
from decimal import Decimal
import json

root = Path(__file__).resolve().parent.parent
cache = root / 'data-cache'
cache.mkdir(exist_ok=True)
archive = cache / 'uci-household.zip'
url = 'https://archive.ics.uci.edu/static/public/235/individual+household+electric+power+consumption.zip'
if not archive.exists():
    urlretrieve(url, archive)
out = root / 'examples' / 'uci'
out.mkdir(exist_ok=True)
with ZipFile(archive) as bundle:
    with bundle.open('household_power_consumption.txt') as source:
        header = source.readline()
        records = []
        lines = []
        for index, line in enumerate(source, 2):
            if line.startswith(b'17/12/2006;'):
                records.append(line)
                lines.append(index)
        data = header + b''.join(records)
if len(records) != 1440:
    raise ValueError('Unexpected number of records')
(out / 'household-2006-12-17.csv').write_bytes(data)
energy = sum(Decimal(row.decode().split(';')[2]) for row in records) / 60
manifest = dict(source='https://doi.org/10.24432/C58K54', download=url,
    attribution='Hebrail, G. & Berard, A. (2006). Individual Household Electric Power Consumption. UCI Machine Learning Repository.',
    license='CC-BY-4.0', archiveSha256=sha256(archive.read_bytes()).hexdigest(),
    file='household-2006-12-17.csv', sha256=sha256(data).hexdigest(), bytes=len(data),
    rows=len(records), firstSourceLine=lines[0], lastSourceLine=lines[-1],
    expectedEnergyKWh=str(energy),
    transformation='Select 17/12/2006 and retain original header, columns, lines and bytes; extension changed to .csv.',
    assumptions='Europe/Paris is a declared geographic interpretation, not a timezone specified by UCI. Timestamp start/end position is not documented; start is an explicit testing assumption. One-minute duration is documented. No DST transition in this extract.')
(out / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(json.dumps(manifest, indent=2))
