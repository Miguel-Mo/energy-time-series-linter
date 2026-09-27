import { analyze } from './analyze';
import { detect, parseCsv } from './csv';
import { MAX_BYTES, type Config, type CsvData, type Report } from './types';
let source = '';
let data: CsvData | null = null;
let fileInfo: Report['file'];
const localColumns = (csv: CsvData) => csv.headers.map((_, i) => i).filter(i => csv.rows.some(row => /^\d{4}-\d{2}-\d{2}[Tt ]\d{2}:\d{2}/.test(row[i]?.trim() ?? '') && !/(Z|[+-]\d{2}:\d{2})$/i.test(row[i]?.trim() ?? '')));
self.onmessage = async ({ data: message }) => {
  try {
    if (message.type === 'load') {
      const file: File = message.file;
      if (file.size > MAX_BYTES) throw new Error('El límite del MVP es 10 MiB.');
      const bytes = await file.arrayBuffer();
      try { source = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { throw new Error('El archivo debe estar codificado en UTF-8.'); }
      const hash = await crypto.subtle.digest('SHA-256', bytes);
      fileInfo = { name: file.name, bytes: file.size, sha256: [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('') };
      data = parseCsv(source);
      self.postMessage({ type: 'loaded', file: fileInfo, headers: data.headers, preview: data.rows.slice(0, 8), rows: data.rows.length, detection: detect(data), localColumns: localColumns(data) });
    } else if (message.type === 'delimiter') {
      data = parseCsv(source, message.delimiter);
      self.postMessage({ type: 'loaded', file: fileInfo, headers: data.headers, preview: data.rows.slice(0, 8), rows: data.rows.length, detection: detect(data), localColumns: localColumns(data) });
    } else if (message.type === 'analyze' && data) {
      self.postMessage({ type: 'report', report: analyze(data, message.config as Config, fileInfo) });
    }
  } catch (error) { self.postMessage({ type: 'error', message: error instanceof Error ? error.message : 'No se pudo procesar el archivo.' }); }
};
self.postMessage({ type: 'ready' });
