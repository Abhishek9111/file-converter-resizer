import { formatBytes } from './imageProcessor';
import mammoth from 'mammoth';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { marked } from 'marked';

const EXT_TO_TYPE = {
  '.json': 'json-csv',
  '.csv': 'csv-json',
  '.md': 'md-html',
  '.markdown': 'md-html',
  '.txt': 'md-html',
  '.docx': 'docx-pdf',
};

const PAGE_W_MM = 210;
const PAGE_H_MM = 297;
const MARGIN_MM = 20;
const PX_PER_MM = 96 / 25.4;
const BASE64_CHUNK_BYTES = 0x8000;

export function detectConversionType(fileName) {
  const ext = '.' + fileName.split('.').pop().toLowerCase();
  return EXT_TO_TYPE[ext] || null;
}

function toCsvCell(value) {
  const s = typeof value === 'object' && value !== null
    ? JSON.stringify(value)
    : String(value ?? '');
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export function jsonToCsv(json) {
  const parsed = JSON.parse(json);
  const rows = Array.isArray(parsed) ? parsed : [parsed];
  if (!rows.length) throw new Error('The JSON array is empty');

  const isRecord = (r) => typeof r === 'object' && r !== null && !Array.isArray(r);
  const records = rows.map((r) => (isRecord(r) ? r : { value: r }));
  const keys = [...new Set(records.flatMap((r) => Object.keys(r)))];

  return [
    keys.map(toCsvCell).join(','),
    ...records.map((r) => keys.map((k) => toCsvCell(r[k])).join(',')),
  ].join('\n');
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let wasQuoted = false;

  const endField = () => {
    row.push(wasQuoted ? field : field.trim());
    field = '';
    wasQuoted = false;
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c !== '"') field += c;
      else if (text[i + 1] === '"') { field += '"'; i++; }
      else inQuotes = false;
    } else if (c === '"' && field.trim() === '') {
      field = '';
      inQuotes = true;
      wasQuoted = true;
    } else if (c === ',') {
      endField();
    } else if (c === '\n') {
      endRow();
    } else if (c !== '\r') {
      field += c;
    }
  }

  if (inQuotes) throw new Error('Invalid CSV: a quoted field is never closed');
  if (field || row.length) endRow();
  return rows.filter((r) => r.length > 1 || r[0] !== '');
}

// Only convert when it is lossless: 007, 1e5 and long IDs must stay strings.
function coerceCsvValue(v) {
  const n = Number(v);
  return v !== '' && Number.isFinite(n) && String(n) === v ? n : v;
}

export function csvToJson(csv) {
  const [headers, ...rows] = parseCsv(csv);
  if (!rows.length) return '[]';

  const result = rows.map((vals) => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = coerceCsvValue(vals[i] ?? ''); });
    return obj;
  });

  return JSON.stringify(result, null, 2);
}

export function mdToHtml(md) {
  return marked.parse(md);
}

function bytesToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += BASE64_CHUNK_BYTES) {
    binary += String.fromCharCode(...bytes.subarray(i, i + BASE64_CHUNK_BYTES));
  }
  return btoa(binary);
}

// Vertical bands, relative to the container, that a page break must not cross.
function getUnbreakableBands(container, pageHeight) {
  const originY = container.getBoundingClientRect().top;
  const bands = [];
  const addRect = (r) => {
    if (r.height > 0) bands.push([r.top - originY, r.bottom - originY]);
  };

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  while (walker.nextNode()) {
    range.selectNodeContents(walker.currentNode);
    for (const rect of range.getClientRects()) addRect(rect);
  }
  container.querySelectorAll('img').forEach((el) => addRect(el.getBoundingClientRect()));
  container.querySelectorAll('tr').forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.height <= pageHeight) addRect(rect);
  });

  bands.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [top, bottom] of bands) {
    const last = merged[merged.length - 1];
    if (last && top < last[1]) last[1] = Math.max(last[1], bottom);
    else merged.push([top, bottom]);
  }
  return merged;
}

function findPageRanges(bands, pageHeight) {
  const contentEnd = bands.length ? Math.ceil(bands[bands.length - 1][1]) : 0;
  const ranges = [];
  let start = 0;

  while (contentEnd - start > pageHeight) {
    let end = start + pageHeight;
    const crossing = bands.find(([top, bottom]) => top < end && bottom > end);
    // A band taller than a page cannot be kept whole, so it is cut at the page limit.
    if (crossing && Math.floor(crossing[0]) > start) end = Math.floor(crossing[0]);
    ranges.push([start, end]);
    start = end;
  }

  ranges.push([start, contentEnd]);
  return ranges;
}

// img.decode() never settles while the tab is hidden, so rely on load state instead.
function waitForImage(img) {
  if (img.complete) return Promise.resolve();
  return new Promise((resolve) => {
    img.onload = resolve;
    img.onerror = resolve;
  });
}

function createRenderRoot(widthPx) {
  const root = document.createElement('div');
  root.className = 'docx-render';
  root.style.width = `${widthPx}px`;
  return root;
}

function measureBlocks(container) {
  const originY = container.getBoundingClientRect().top;
  return [...container.children].map((el) => {
    const rect = el.getBoundingClientRect();
    return { el, top: rect.top - originY, bottom: rect.bottom - originY };
  });
}

// Each page holds only its own blocks, so html2canvas cost does not grow with document length.
function buildPage(blocks, start, end, widthPx) {
  const visible = blocks.filter((b) => b.top < end && b.bottom > start);

  const content = document.createElement('div');
  content.style.display = 'flow-root';
  content.style.marginTop = `${visible[0].top - start}px`;
  content.append(...visible.map((b) => b.el.cloneNode(true)));
  content.firstElementChild.style.marginTop = '0';

  const page = createRenderRoot(widthPx);
  page.style.height = `${end - start}px`;
  page.style.overflow = 'hidden';
  page.append(content);
  return page;
}

export async function convertDocxToPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const { value: htmlContent } = await mammoth.convertToHtml({ arrayBuffer });

  const contentWmm = PAGE_W_MM - MARGIN_MM * 2;
  const contentHmm = PAGE_H_MM - MARGIN_MM * 2;
  const pageHeightPx = Math.floor(contentHmm * PX_PER_MM);
  const pageWidthPx = Math.round(contentWmm * PX_PER_MM);
  const mmPerPx = contentWmm / pageWidthPx;

  const container = createRenderRoot(pageWidthPx);
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  let ranges, blocks;
  try {
    await Promise.all([...container.querySelectorAll('img')].map(waitForImage));
    ranges = findPageRanges(getUnbreakableBands(container, pageHeightPx), pageHeightPx);
    blocks = measureBlocks(container);
  } finally {
    container.remove();
  }

  const pdf = new jsPDF('p', 'mm', 'a4');

  for (let i = 0; i < ranges.length; i++) {
    if (i > 0) pdf.addPage();
    const [start, end] = ranges[i];
    if (end <= start) continue;

    const page = buildPage(blocks, start, end, pageWidthPx);
    document.body.appendChild(page);
    try {
      const canvas = await html2canvas(page, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      pdf.addImage(
        canvas.toDataURL('image/jpeg', 0.95), 'JPEG',
        MARGIN_MM, MARGIN_MM, contentWmm, (end - start) * mmPerPx
      );
    } finally {
      page.remove();
    }
  }

  const pdfBlob = pdf.output('blob');
  const pages = ranges.length;
  return {
    blob: pdfBlob,
    message: `PDF generated (${formatBytes(pdfBlob.size)}) — ${pages} page${pages > 1 ? 's' : ''}`,
  };
}

export function processConversion(type, file, text) {
  let result = '';
  let mime = 'text/plain';
  let ext = 'txt';

  switch (type) {
    case 'json-csv':
      result = jsonToCsv(text); mime = 'text/csv'; ext = 'csv'; break;
    case 'csv-json':
      result = csvToJson(text); mime = 'application/json'; ext = 'json'; break;
    case 'md-html':
      result = mdToHtml(text); mime = 'text/html'; ext = 'html'; break;
    case 'base64-encode':
      result = bytesToBase64(new Uint8Array(text));
      mime = 'text/plain'; ext = 'txt'; break;
    case 'base64-decode': {
      const bin = atob(text.trim());
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return { result: bytes, mime: 'application/octet-stream', ext: 'bin',
        message: `Binary data decoded (${formatBytes(bytes.length)})` };
    }
    default:
      result = 'Unknown conversion type';
  }

  return { result, mime, ext };
}
