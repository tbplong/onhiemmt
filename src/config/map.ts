import type { CategoryId } from '../data/schema';

export const MAP_CENTER: [number, number] = [10.79, 106.7];
export const MAP_ZOOM = 11;

const OSM_CREDIT =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors (ODbL)';

// OpenFreeMap: keyless vector tiles built from OSM. Its Positron style is recolored below.
export const BASEMAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';
export const BASEMAP_ATTRIBUTION = `<a href="https://openfreemap.org">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/">OpenMapTiles</a> ${OSM_CREDIT}`;

// Raster fallback when the style cannot load or WebGL is unavailable (OSM tile usage policy applies).
export const FALLBACK_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const FALLBACK_ATTRIBUTION = OSM_CREDIT;

const LABEL = { 'text-color': '#3a4741', 'text-halo-color': '#f7f2e8', 'text-halo-width': 1.4 };
const ROAD_LABEL = {
  'text-color': '#7a7264',
  'text-halo-color': '#f7f2e8',
  'text-halo-width': 1.2,
};
const BOUNDARY = { 'line-color': '#c2b9a6' };

/** Positron layer id → paint overrides, in the Journie palette. Unknown ids are ignored. */
export const BASEMAP_PAINT: Record<string, Record<string, unknown>> = {
  background: { 'background-color': '#f7f2e8' },
  landuse_residential: { 'fill-color': '#f1ebde' },
  building: { 'fill-color': '#e9e1d0' },
  park: { 'fill-color': '#dfe5cf' },
  landcover_wood: { 'fill-color': '#d7dfc7' },
  water: { 'fill-color': '#c6dade' },
  waterway: { 'line-color': '#b3cfd6' },
  highway_path: { 'line-color': '#ece4d4' },
  highway_minor: { 'line-color': '#ebe3d3' },
  highway_major_casing: { 'line-color': '#ddd3c0' },
  highway_major_inner: { 'line-color': '#fffbf3' },
  highway_major_subtle: { 'line-color': '#e3dac8' },
  highway_motorway_casing: { 'line-color': '#d9cdb6' },
  highway_motorway_inner: { 'line-color': '#f6e7c4' },
  highway_motorway_subtle: { 'line-color': '#e7dcc5' },
  highway_motorway_bridge_inner: { 'line-color': '#f6e7c4' },
  boundary_2: BOUNDARY,
  boundary_3: BOUNDARY,
  boundary_disputed: BOUNDARY,
  water_name_point_label: { ...LABEL, 'text-color': '#25677f' },
  water_name_line_label: { ...LABEL, 'text-color': '#25677f' },
  'highway-name-minor': ROAD_LABEL,
  'highway-name-major': ROAD_LABEL,
  airport: LABEL,
  // Neighbourhood names ("Khu phố …", "Ấp …") are the densest labels: fade them in late and mute them.
  label_other: {
    ...LABEL,
    'text-color': '#8f897b',
    'text-opacity': ['interpolate', ['linear'], ['zoom'], 14, 0, 16, 0.75],
  },
  label_village: LABEL,
  label_town: LABEL,
  label_state: LABEL,
  label_city: { ...LABEL, 'text-color': '#18231f' },
  label_city_capital: { ...LABEL, 'text-color': '#18231f' },
};

export interface LayerStyle {
  label: string;
  color: string;
  icon: IconName;
}

export const LAYERS: Record<CategoryId, LayerStyle> = {
  green: { label: 'Không gian xanh', color: '#2f6b4a', icon: 'tree' },
  water: { label: 'Sông rạch', color: '#25677f', icon: 'drop' },
  pollution: { label: 'Ô nhiễm', color: '#c4532f', icon: 'alert' },
};

export const ISSUE_ICONS: Record<string, IconName> = {
  'Không khí & giao thông': 'wind',
  Ngập: 'waves',
  'Rác thải': 'trash',
  'Nước thải & công nghiệp': 'pipe',
  'Công nghiệp': 'factory',
  'Dự án hạ tầng': 'road',
};

export type IconName =
  | 'tree'
  | 'drop'
  | 'alert'
  | 'wind'
  | 'waves'
  | 'trash'
  | 'pipe'
  | 'factory'
  | 'road'
  | 'expand'
  | 'collapse';

// 24×24 stroke paths, drawn with currentColor.
export const ICON_PATHS: Record<IconName, string> = {
  tree: 'M12 3l6 8h-3l4 6H5l4-6H6zM12 17v4',
  drop: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
  alert: 'M12 4l9 16H3zM12 10v4M12 17v.5',
  wind: 'M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7',
  waves: 'M3 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6',
  pipe: 'M3 8h9a4 4 0 0 1 4 4v1M3 12h7M16 17c0 1.5 1 3 2 3s2-1.5 2-3-2-4-2-4-2 2.5-2 4z',
  factory: 'M3 20V10l5 3v-3l5 3v-3l5 3V4h3v16zM7 17h2M12 17h2',
  road: 'M8 3L4 21M16 3l4 18M12 4v3M12 11v3M12 18v2',
  expand: 'M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7',
  collapse: 'M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7',
};

/** Detail panel widths (px). Wide = min(wide, wideRatio × viewport); the map keeps ≥ mapMin. */
export const PANEL_WIDTH = { default: 420, min: 360, wide: 760, wideRatio: 0.6, mapMin: 240 };

/**
 * shortcut: the CSV has no `status` column, and keyword matching on description/notes gave both
 * false positives and misses, so planned/unbuilt places are listed by name. Replace with a
 * `status` column when the data gets one (tests check every name still exists in the CSV).
 */
export const PLANNED_PLACE_NAMES: readonly string[] = [
  'Công viên dự kiến ở Thạnh Xuân – Thới An',
  'Dự án Sài Gòn Safari',
  'Dự án công viên 120 ha',
  'Vinhomes Sài Gòn Park',
  'Công viên thể dục thể thao phường 12',
  'Đường vượt biển Cần Giờ – Vũng Tàu',
];

/** Rows describing a whole district rather than one place ("Quận 3: …", "Thủ Đức: …"). */
export const DISTRICT_NAME_RE = /^(Quận [^:]+|Thủ Đức): /;

export const COORD_CONFIDENCE: Record<string, 'verified' | 'representative' | 'estimated'> = {
  'OpenStreetMap (Nominatim)': 'verified',
  'Docs gốc (tọa độ đại diện)': 'representative',
  'Ước lượng (sheet, chưa kiểm chứng)': 'estimated',
};

/** Dataset-level attribution shown in the "Nguồn dữ liệu" panel (CLAUDE.md §4). */
export const DATASET_CREDITS: { name: string; detail: string; url: string }[] = [
  {
    name: 'OpenStreetMap contributors',
    detail: 'Dữ liệu nền bản đồ, tọa độ Nominatim và tuyến sông kênh (ODbL)',
    url: 'https://www.openstreetmap.org/copyright',
  },
  {
    name: 'OpenFreeMap và OpenMapTiles',
    detail: 'Tile vector và kiểu nền Positron (đã đổi màu)',
    url: 'https://openfreemap.org',
  },
  {
    name: 'ESA WorldCover 2021',
    detail: 'Lớp phủ đất 10 m (CC BY 4.0)',
    url: 'https://esa-worldcover.org/',
  },
  {
    name: 'Global Mangrove Watch v3.0',
    detail: 'Diện tích rừng ngập mặn 1996–2020 (CC BY 4.0)',
    url: 'https://www.globalmangrovewatch.org/',
  },
  {
    name: 'HealthyAir Dataset',
    detail: 'Số đo trạm không khí 2021–2022, Mendeley Data, DOI 10.17632/pk6tzrjks8.1',
    url: 'https://doi.org/10.17632/pk6tzrjks8.1',
  },
  {
    name: 'CAMS qua Open-Meteo Air Quality API',
    detail: 'Số mô hình không khí 2025',
    url: 'https://open-meteo.com/en/docs/air-quality-api',
  },
  {
    name: 'Traffic Flow Data in Ho Chi Minh City',
    detail: 'Kaggle, ĐH Bách khoa TP.HCM, 2020–2021',
    url: 'https://www.kaggle.com/search?q=Traffic+Flow+Data+in+Ho+Chi+Minh+City',
  },
];
