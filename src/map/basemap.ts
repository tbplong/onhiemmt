import L from 'leaflet';
import {
  BASEMAP_ATTRIBUTION,
  BASEMAP_STYLE_URL,
  FALLBACK_ATTRIBUTION,
  FALLBACK_TILE_URL,
} from '../config/map';
import { themeStyle } from './theme';

/**
 * Vector basemap in the site palette; falls back to OSM raster tiles if anything fails.
 * MapLibre (~290 KB gzip) is loaded lazily so markers, search and panels are usable first.
 */
export async function addBasemap(map: L.Map): Promise<void> {
  try {
    const [{ maplibreGL }, { setWorkerUrl }, { default: workerUrl }, res] = await Promise.all([
      import('@maplibre/maplibre-gl-leaflet'),
      import('maplibre-gl'),
      // MapLibre finds its worker relative to its own module URL, which bundling breaks.
      import('maplibre-gl/dist/maplibre-gl-worker.mjs?url'),
      fetch(BASEMAP_STYLE_URL),
      import('maplibre-gl/dist/maplibre-gl.css'),
    ]);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    setWorkerUrl(workerUrl);
    // Throws synchronously when WebGL is unavailable, which lands in the fallback below.
    maplibreGL({ style: themeStyle(await res.json()), attributionControl: false }).addTo(map);
    map.attributionControl.addAttribution(BASEMAP_ATTRIBUTION);
  } catch (err) {
    console.warn('Không tải được nền bản đồ vector, dùng tile OSM', err);
    L.tileLayer(FALLBACK_TILE_URL, {
      attribution: FALLBACK_ATTRIBUTION,
      maxZoom: 19,
      className: 'osm-fallback',
    }).addTo(map);
  }
}
