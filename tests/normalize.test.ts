import { describe, expect, it } from 'vitest';
import { loadDataset } from '../src/data/load';
import { getFieldGroups, normalizePlace } from '../src/data/normalize';
import { parseCsv } from '../src/data/parse';
import { GROUPS_BY_CATEGORY } from '../src/data/schema';
import { PLANNED_PLACE_NAMES } from '../src/config/map';
import sample from './fixtures/sample.csv?raw';
import greenCsv from '../data/du_lieu_khong_gian_xanh.csv?raw';
import waterCsv from '../data/du_lieu_song_rach.csv?raw';
import pollutionCsv from '../data/du_lieu_o_nhiem.csv?raw';

describe('normalizePlace (fixture)', () => {
  const [park, district, planned] = parseCsv(sample).map(normalizePlace);

  it('maps fields and keeps empty cells out', () => {
    expect(park!.category).toBe('green');
    expect(park!.coordConfidence).toBe('verified');
    expect(park!.fields.get('area')).toEqual({
      kind: 'number',
      value: { kind: 'range', min: 8, max: 10 },
    });
    expect(park!.fields.has('canopy_cover')).toBe(false);
    expect(park!.description).toEqual(['Ý một: có dấu, phẩy', 'Ý hai']);
    expect(park!.notes).toEqual(['area trước đây: 9.3', 'canopy chưa đo']);
    expect(park!.sources).toHaveLength(2);
    expect(park!.mangrove).toEqual([]);
  });

  it('keeps an explicit 0 and detects districts, planned rows and mangrove series', () => {
    expect(district!.fields.get('area')).toEqual({
      kind: 'number',
      value: { kind: 'exact', value: 0 },
    });
    expect(district!.isDistrict).toBe(true);
    expect(district!.mangrove.map((m) => m.value.kind)).toEqual(['exact', 'empty', 'exact']);
    expect(planned!.isPlanned).toBe(true);
    expect(park!.isPlanned || park!.isDistrict).toBe(false);
  });

  it('rejects rows without valid coordinates', () => {
    expect(() => normalizePlace({ name: 'X', category: 'Ô nhiễm', latitude: '' })).toThrow();
  });
});

describe('real dataset', () => {
  const { places, indicators } = loadDataset();
  const count = (c: string) => places.filter((p) => p.category === c).length;

  it('loads every row of the 4 CSVs', () => {
    expect([count('green'), count('water'), count('pollution')]).toEqual([36, 34, 38]);
    expect(indicators).toHaveLength(31);
  });

  it('parses every numeric cell as a number shape', () => {
    const bad = places.flatMap((p) =>
      [...p.fields]
        .filter(([, v]) => v.kind === 'number' && v.value.kind === 'text')
        .map(([k]) => `${p.name}.${k}`),
    );
    expect(bad).toEqual([]);
  });

  it('has unique ids and every planned name exists', () => {
    expect(new Set(places.map((p) => p.id)).size).toBe(places.length);
    const names = new Set(places.map((p) => p.name));
    expect(PLANNED_PLACE_NAMES.filter((n) => !names.has(n))).toEqual([]);
  });

  it('flags the five whole-district rows', () => {
    expect(places.filter((p) => p.isDistrict)).toHaveLength(5);
  });

  it('flood points show flood fields and no empty air placeholders', () => {
    for (const flood of places.filter((p) => p.issueType === 'Ngập')) {
      const groups = getFieldGroups(flood);
      expect(groups.map((g) => g.group.id)).toContain('flood');
      const shown = groups.flatMap((g) => g.fields.map((f) => f.key));
      expect(shown.filter((k) => k.startsWith('pm25') && !flood.fields.has(k))).toEqual([]);
    }
  });

  it('every schema column exists in its CSV header', () => {
    const headers = { green: greenCsv, water: waterCsv, pollution: pollutionCsv };
    for (const [cat, csv] of Object.entries(headers)) {
      const cols = Object.keys(parseCsv(csv)[0]!);
      const keys = GROUPS_BY_CATEGORY[cat as keyof typeof headers].flatMap((g) =>
        g.fields.map((f) => f.key),
      );
      expect(keys.filter((k) => !cols.includes(k))).toEqual([]);
    }
  });
});
