// Column → label/unit mapping. Adding a CSV column only needs an entry here.

export type CategoryId = 'green' | 'water' | 'pollution';

export interface FieldDef {
  key: string;
  label: string;
  /** 'number' cells go through parseNumeric; 'text' cells through splitList. */
  kind: 'number' | 'text';
  unit?: string;
  /** Name of a row in du_lieu_chi_tieu_toan_tp.csv shown as the city-wide reference. */
  cityRef?: string;
  /** Shown as "Chưa có dữ liệu" when empty instead of being hidden. */
  required?: boolean;
  /** Shown in the quick popup. */
  highlight?: boolean;
  /** Column holding the year this value belongs to (shown next to the label). */
  yearKey?: string;
}

type FieldOpts = Pick<FieldDef, 'cityRef' | 'required' | 'highlight' | 'yearKey'>;

export interface FieldGroup {
  id: string;
  title: string;
  fields: FieldDef[];
  /** Caveat shown under the group title. */
  note?: string;
}

const num = (key: string, label: string, unit?: string, opts: FieldOpts = {}): FieldDef => ({
  key,
  label,
  kind: 'number',
  unit,
  ...opts,
});
const text = (key: string, label: string, opts: FieldOpts = {}): FieldDef => ({
  key,
  label,
  kind: 'text',
  ...opts,
});

export const CATEGORY_BY_CSV_VALUE: Record<string, CategoryId> = {
  'Không gian xanh': 'green',
  'Sông rạch': 'water',
  'Ô nhiễm': 'pollution',
};

const GREEN_GROUPS: FieldGroup[] = [
  {
    id: 'green-core',
    title: 'Diện tích và cây xanh',
    note: 'Diện tích và độ che phủ được tính theo nhiều cách khác nhau, tùy từng địa điểm.',
    fields: [
      num('area', 'Diện tích', 'ha', { required: true, highlight: true }),
      num('tree_count', 'Số cây', 'cây'),
      num('green_area_ha', 'Diện tích phủ xanh', 'ha'),
      num('canopy_cover', 'Tỉ lệ phủ xanh', '%', {
        cityRef: 'Độ che phủ cây xanh khu vực nội thành',
        highlight: true,
      }),
      num('green_m2_per_person', 'Cây xanh bình quân', 'm²/người', {
        cityRef: 'Chỉ tiêu quy hoạch công viên bình quân',
        highlight: true,
      }),
    ],
  },
  {
    id: 'green-landcover',
    title: 'Lớp phủ đất (ESA WorldCover 2021)',
    fields: [
      num('tree_cover_ha', 'Cây gỗ', 'ha'),
      num('grass_ha', 'Cỏ', 'ha'),
      num('built_ha', 'Xây dựng', 'ha'),
      num('water_ha', 'Mặt nước', 'ha'),
      num('landcover_radius_km', 'Bán kính tính', 'km'),
    ],
  },
];

export const MANGROVE_FIELDS = [
  { key: 'mangrove_ha_1996', year: 1996 },
  { key: 'mangrove_ha_2010', year: 2010 },
  { key: 'mangrove_ha_2020', year: 2020 },
] as const;

const WATER_GROUPS: FieldGroup[] = [
  {
    id: 'water-quality',
    title: 'Chất lượng nước',
    fields: [
      text('water_physical', 'Chỉ tiêu vật lý'),
      text('water_chemical', 'Chỉ tiêu hóa học'),
      text('water_biological', 'Chỉ tiêu sinh học'),
    ],
  },
  {
    id: 'water-context',
    title: 'Thủy văn, nguồn thải và sạt lở',
    fields: [
      text('hydrology', 'Thủy văn'),
      text('pollution_sources', 'Nguồn thải'),
      text('erosion', 'Sạt lở'),
    ],
  },
];

const AIR: FieldGroup = {
  id: 'air',
  title: 'Không khí',
  note: 'Số đo trạm (2021–2022) và số mô hình (2025) không so sánh trực tiếp được. SO₂, NO₂ đo bằng cảm biến giá rẻ, chỉ dùng để so sánh tương đối.',
  fields: [
    num('pm25', 'PM2.5', 'µg/m³', {
      cityRef: 'PM2.5 trung bình năm (IQAir)',
      required: true,
      highlight: true,
      yearKey: 'air_year',
    }),
    text('air_year', 'Năm số liệu', { required: true }),
    text('pm25_method', 'Phương pháp', { required: true }),
    text('air_station', 'Trạm đo'),
    num('air_station_distance_km', 'Khoảng cách tới trạm', 'km'),
    num('pm25_p95', 'PM2.5 phân vị 95', 'µg/m³'),
    num('pm25_days_over_50_pct', 'Ngày PM2.5 vượt 50 µg/m³', '% ngày'),
    num('pm25_exceed_ratio', 'PM2.5 vượt quy chuẩn', 'lần'),
    num('tsp_ugm3', 'Bụi tổng (TSP)', 'µg/m³'),
    num('co', 'CO', 'µg/m³'),
    num('no2', 'NO₂', 'µg/m³'),
    num('so2', 'SO₂', 'µg/m³'),
    text('pm25_note', 'Ghi chú PM2.5'),
    text('gases_note', 'Ghi chú khí độc'),
  ],
};

const CAMS: FieldGroup = {
  id: 'cams',
  title: 'Mô hình CAMS 2025 (tham chiếu)',
  note: 'Ô lưới khoảng 40 km nên nhiều điểm có giá trị giống nhau.',
  fields: [
    num('pm25_cams', 'PM2.5', 'µg/m³'),
    num('co_cams', 'CO', 'µg/m³'),
    num('no2_cams', 'NO₂', 'µg/m³'),
    num('so2_cams', 'SO₂', 'µg/m³'),
  ],
};

const NOISE_TRAFFIC: FieldGroup = {
  id: 'traffic',
  title: 'Tiếng ồn và giao thông',
  fields: [
    num('noise', 'Tiếng ồn', 'dBA', { highlight: true }),
    num('traffic', 'Lượt ùn ứ (mức E/F)', '%', { highlight: true }),
    num('traffic_pct_los_EF_peak', 'Ùn ứ giờ cao điểm', '%'),
    num('traffic_speed_kmh', 'Tốc độ trung bình', 'km/h'),
    num('traffic_obs', 'Số lượt ghi nhận', 'lượt'),
    num('traffic_volume', 'Lưu lượng xe', 'chuyến/ngày'),
  ],
};

const WASTE: FieldGroup = {
  id: 'waste',
  title: 'Rác thải',
  fields: [
    num('site_area_ha', 'Diện tích khu xử lý', 'ha'),
    num('waste_tons_per_day', 'Lượng rác tiếp nhận', 'tấn/ngày', { highlight: true }),
    num('landfill_million_tons', 'Rác đã chôn lấp', 'triệu tấn'),
  ],
};

const FLOOD: FieldGroup = {
  id: 'flood',
  title: 'Ngập',
  fields: [
    num('flood_depth_m', 'Độ sâu ngập', 'm', { highlight: true }),
    num('tide_peak_m', 'Đỉnh triều', 'm', { highlight: true }),
    num('flood_area_pct', 'Diện tích ngập', '%'),
    num('flood_drain_hours', 'Thời gian rút nước', 'giờ'),
  ],
};

const OTHER: FieldGroup = {
  id: 'other',
  title: 'Chỉ số khác',
  fields: [text('other_metrics', 'Chỉ số khác')],
};

const POLLUTION_GROUPS = [AIR, CAMS, NOISE_TRAFFIC, WASTE, FLOOD, OTHER];

/** Groups always shown (even if empty) per issue_type; other groups appear only when they hold data. */
export const ISSUE_GROUPS: Record<string, string[]> = {
  'Không khí & giao thông': ['air', 'cams', 'traffic'],
  'Công nghiệp': ['air', 'cams'],
  'Nước thải & công nghiệp': [],
  'Rác thải': ['waste'],
  Ngập: ['flood'],
  'Dự án hạ tầng': [],
};

export const GROUPS_BY_CATEGORY: Record<CategoryId, FieldGroup[]> = {
  green: GREEN_GROUPS,
  water: WATER_GROUPS,
  pollution: POLLUTION_GROUPS,
};

/** Groups always shown for green/water; pollution uses ISSUE_GROUPS. */
export const DEFAULT_GROUPS: Record<'green' | 'water', string[]> = {
  green: ['green-core'],
  water: ['water-quality', 'water-context'],
};
