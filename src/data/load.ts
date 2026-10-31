import greenCsv from '../../data/du_lieu_khong_gian_xanh.csv?raw';
import waterCsv from '../../data/du_lieu_song_rach.csv?raw';
import pollutionCsv from '../../data/du_lieu_o_nhiem.csv?raw';
import cityCsv from '../../data/du_lieu_chi_tieu_toan_tp.csv?raw';
import { parseCsv } from './parse';
import { normalizeIndicator, normalizePlace, type CityIndicator, type Place } from './normalize';

export interface Dataset {
  places: Place[];
  indicators: CityIndicator[];
}

let cache: Dataset | null = null;

/** CSVs are bundled at build time and parsed once. */
export function loadDataset(): Dataset {
  cache ??= {
    places: [greenCsv, waterCsv, pollutionCsv].flatMap((csv) => parseCsv(csv).map(normalizePlace)),
    indicators: parseCsv(cityCsv).map(normalizeIndicator),
  };
  return cache;
}
