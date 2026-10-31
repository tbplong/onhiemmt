import Papa from 'papaparse';

export type NumericValue =
  | { kind: 'empty' }
  | { kind: 'exact'; value: number }
  | { kind: 'range'; min: number; max: number }
  | { kind: 'bound'; op: '<' | '>'; value: number }
  // Cell that is not a number at all; kept verbatim so nothing is silently dropped.
  | { kind: 'text'; raw: string };

export interface SourceRef {
  label: string;
  url?: string;
}

const NUM = String.raw`\d+(?:[.,]\d+)?`;
const EXACT_RE = new RegExp(`^${NUM}$`);
const BOUND_RE = new RegExp(String.raw`^([<>])\s*(${NUM})$`);
const RANGE_RE = new RegExp(String.raw`^(${NUM})\s*[–-]\s*(${NUM})$`);
const URL_RE = /https?:\/\/[^\s;,)]+/;

// Numeric CSV columns use '.', but the city-wide sheet uses Vietnamese ',' decimals.
const toNumber = (s: string): number => Number(s.replace(',', '.'));

export function parseNumeric(raw: string | undefined): NumericValue {
  const s = (raw ?? '').trim();
  if (!s) return { kind: 'empty' };
  if (EXACT_RE.test(s)) return { kind: 'exact', value: toNumber(s) };
  const bound = BOUND_RE.exec(s);
  if (bound) return { kind: 'bound', op: bound[1] as '<' | '>', value: toNumber(bound[2]!) };
  const range = RANGE_RE.exec(s);
  if (range) return { kind: 'range', min: toNumber(range[1]!), max: toNumber(range[2]!) };
  return { kind: 'text', raw: s };
}

const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 });

/** Keeps the original shape (range, bound); returns null for empty so callers pick the wording. */
export function formatNumeric(v: NumericValue): string | null {
  switch (v.kind) {
    case 'empty':
      return null;
    case 'exact':
      return nf.format(v.value);
    case 'range':
      return `${nf.format(v.min)}–${nf.format(v.max)}`;
    case 'bound':
      return `${v.op}${nf.format(v.value)}`;
    case 'text':
      return v.raw;
  }
}

/** Splits multi-clause cells: newline bullets ("\n- ") and " | " separators. */
export function splitList(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(/\n| \| /)
    .map((s) => s.replace(/^\s*-\s*/, '').trim())
    .filter(Boolean);
}

export function parseSources(raw: string | undefined): SourceRef[] {
  return (raw ?? '')
    .split(/; | \| /)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const url = URL_RE.exec(part)?.[0];
      if (!url) return { label: part };
      const label = part.replace(url, '').trim() || new URL(url).hostname.replace(/^www\./, '');
      return { label, url };
    });
}

/** Parses a CSV string (BOM-safe) into header-keyed rows. */
export function parseCsv(text: string): Record<string, string>[] {
  const BOM = String.fromCodePoint(0xfeff);
  const result = Papa.parse<Record<string, string>>(text.startsWith(BOM) ? text.slice(1) : text, {
    header: true,
    skipEmptyLines: true,
  });
  if (result.errors.length) {
    throw new Error(`CSV lỗi ở dòng ${result.errors[0]!.row}: ${result.errors[0]!.message}`);
  }
  return result.data;
}
