import { describe, expect, it } from 'vitest';
import { formatNumeric, parseCsv, parseNumeric, parseSources, splitList } from '../src/data/parse';
import sample from './fixtures/sample.csv?raw';

describe('parseNumeric', () => {
  it.each([
    ['20.9', { kind: 'exact', value: 20.9 }],
    ['0', { kind: 'exact', value: 0 }],
    ['8–10', { kind: 'range', min: 8, max: 10 }],
    ['1.65-1.70', { kind: 'range', min: 1.65, max: 1.7 }],
    ['>70', { kind: 'bound', op: '>', value: 70 }],
    ['<0.2', { kind: 'bound', op: '<', value: 0.2 }],
    ['1,2–35,6', { kind: 'range', min: 1.2, max: 35.6 }],
    ['', { kind: 'empty' }],
    ['   ', { kind: 'empty' }],
    [undefined, { kind: 'empty' }],
    ['khoảng 5', { kind: 'text', raw: 'khoảng 5' }],
  ])('%j', (raw, expected) => expect(parseNumeric(raw)).toEqual(expected));
});

describe('formatNumeric', () => {
  it('keeps shape and uses vi-VN digits', () => {
    expect(formatNumeric(parseNumeric('20.9'))).toBe('20,9');
    expect(formatNumeric(parseNumeric('235000'))).toBe('235.000');
    expect(formatNumeric(parseNumeric('8–10'))).toBe('8–10');
    expect(formatNumeric(parseNumeric('>70'))).toBe('>70');
    expect(formatNumeric(parseNumeric('<0.2'))).toBe('<0,2');
    expect(formatNumeric(parseNumeric(''))).toBeNull();
  });
});

describe('splitList / parseSources', () => {
  it('splits bullets and pipes, keeps Vietnamese decimal commas', () => {
    expect(splitList('- BOD5 vượt 1,14 lần\n- WQI 57–93 | DO ~0')).toEqual([
      'BOD5 vượt 1,14 lần',
      'WQI 57–93',
      'DO ~0',
    ]);
    expect(splitList('')).toEqual([]);
  });
  it('extracts URLs from sources', () => {
    expect(parseSources('VnExpress https://vnexpress.net/x.html; ESA WorldCover')).toEqual([
      { label: 'VnExpress', url: 'https://vnexpress.net/x.html' },
      { label: 'ESA WorldCover' },
    ]);
    expect(parseSources('https://www.plo.vn/a')).toEqual([
      { label: 'plo.vn', url: 'https://www.plo.vn/a' },
    ]);
    expect(parseSources('Dân trí 03/08/2026 | Báo cáo 2025')).toEqual([
      { label: 'Dân trí 03/08/2026' },
      { label: 'Báo cáo 2025' },
    ]);
    expect(parseSources('')).toEqual([]);
  });
});

describe('parseCsv', () => {
  it('strips BOM and keeps quoted commas and newlines', () => {
    const rows = parseCsv(sample);
    expect(Object.keys(rows[0]!)[0]).toBe('name');
    expect(rows[0]!.name).toBe('Công viên Mẫu, phía Bắc');
    expect(rows[0]!.description).toContain('\n');
    expect(rows).toHaveLength(3);
  });
});
