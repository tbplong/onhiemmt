import {
  COORD_CONFIDENCE,
  DISTRICT_NAME_RE,
  PLANNED_PLACE_NAMES,
} from '../config/map';
import { parseNumeric, parseSources, splitList, type NumericValue, type SourceRef } from './parse';
import {
  CATEGORY_BY_CSV_VALUE,
  DEFAULT_GROUPS,
  GROUPS_BY_CATEGORY,
  ISSUE_GROUPS,
  MANGROVE_FIELDS,
  type CategoryId,
  type FieldDef,
  type FieldGroup,
} from './schema';

export type CoordConfidence = 'verified' | 'representative' | 'estimated';

export type FieldValue = { kind: 'number'; value: NumericValue } | { kind: 'text'; items: string[] };

export interface Place {
  id: string;
  category: CategoryId;
  name: string;
  lat: number;
  lng: number;
  coordConfidence: CoordConfidence;
  issueType: string | null;
  description: string[];
  recordYear: string | null;
  sources: SourceRef[];
  notes: string[];
  isPlanned: boolean;
  isDistrict: boolean;
  /** Only non-empty cells, keyed by CSV column. */
  fields: ReadonlyMap<string, FieldValue>;
  /** Empty unless the row has at least one mangrove value. */
  mangrove: { year: number; value: NumericValue }[];
}

export interface CityIndicator {
  group: string;
  name: string;
  value: NumericValue;
  unit: string;
  note: string;
  sources: SourceRef[];
}

type Row = Record<string, string>;

function readField(def: FieldDef, raw: string | undefined): FieldValue | null {
  if (def.kind === 'text') {
    const items = splitList(raw);
    return items.length ? { kind: 'text', items } : null;
  }
  const value = parseNumeric(raw);
  return value.kind === 'empty' ? null : { kind: 'number', value };
}

function readFields(category: CategoryId, row: Row): Map<string, FieldValue> {
  const fields = new Map<string, FieldValue>();
  for (const def of GROUPS_BY_CATEGORY[category].flatMap((g) => g.fields)) {
    const value = readField(def, row[def.key]);
    if (value) fields.set(def.key, value);
  }
  return fields;
}

function readMangrove(row: Row): Place['mangrove'] {
  const points = MANGROVE_FIELDS.map((f) => ({ year: f.year, value: parseNumeric(row[f.key]) }));
  return points.some((p) => p.value.kind !== 'empty') ? points : [];
}

export function normalizePlace(row: Row): Place {
  const category = CATEGORY_BY_CSV_VALUE[row.category ?? ''];
  const coordConfidence = COORD_CONFIDENCE[row.coord_source ?? ''];
  const lat = Number(row.latitude);
  const lng = Number(row.longitude);
  const name = (row.name ?? '').trim();
  if (!category || !coordConfidence || !name || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error(`Dòng dữ liệu không hợp lệ: "${name || '(không tên)'}"`);
  }
  return {
    id: `${category}:${name}`,
    category,
    name,
    lat,
    lng,
    coordConfidence,
    issueType: row.issue_type?.trim() || null,
    description: splitList(row.description),
    recordYear: row.record_year?.trim() || null,
    sources: parseSources(row.source),
    notes: splitList(row.notes),
    isPlanned: PLANNED_PLACE_NAMES.includes(name),
    isDistrict: DISTRICT_NAME_RE.test(name),
    fields: readFields(category, row),
    mangrove: category === 'green' ? readMangrove(row) : [],
  };
}

export function normalizeIndicator(row: Row): CityIndicator {
  return {
    group: row.nhom?.trim() ?? '',
    name: row.chi_tieu?.trim() ?? '',
    value: parseNumeric(row.gia_tri),
    unit: row.don_vi?.trim() ?? '',
    note: row.ghi_chu?.trim() ?? '',
    sources: parseSources(row.nguon),
  };
}

export interface VisibleGroup {
  group: FieldGroup;
  /** Non-empty fields, plus empty `required` ones when the group is a default for this place. */
  fields: FieldDef[];
}

/** Groups to render: the category/issue defaults plus any other group holding data. */
export function getFieldGroups(place: Place): VisibleGroup[] {
  const defaults =
    place.category === 'pollution'
      ? (ISSUE_GROUPS[place.issueType ?? ''] ?? [])
      : DEFAULT_GROUPS[place.category];
  return GROUPS_BY_CATEGORY[place.category]
    .map((group) => {
      const isDefault = defaults.includes(group.id);
      const fields = group.fields.filter(
        (f) => place.fields.has(f.key) || (isDefault && f.required),
      );
      return { group, fields, isDefault };
    })
    .filter((g) => g.isDefault || g.fields.length > 0)
    .map(({ group, fields }) => ({ group, fields }));
}
