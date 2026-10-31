import L from 'leaflet';
import { LAYERS } from '../config/map';
import type { Place } from '../data/normalize';
import { vi } from '../i18n/vi';
import { esc } from '../components/html';

interface WaterwayProps {
  place: string;
  osmName: string;
}

/** Draws OSM river/canal lines (built by scripts/fetch-waterways.mjs) linked to their CSV row. */
export async function addWaterways(
  layer: L.LayerGroup,
  places: Place[],
  onDetails: (place: Place) => void,
): Promise<void> {
  const res = await fetch(`${import.meta.env.BASE_URL}waterways.geojson`);
  if (!res.ok) return; // lines are optional; markers still show every river
  const geojson = (await res.json()) as GeoJSON.FeatureCollection<GeoJSON.Geometry, WaterwayProps>;
  const byName = new Map(places.filter((p) => p.category === 'water').map((p) => [p.name, p]));

  L.geoJSON(geojson, {
    style: { color: LAYERS.water.color, weight: 4, opacity: 0.55, lineCap: 'round' },
    filter: (f) => byName.has(f.properties.place),
    onEachFeature: (f, line) => {
      const place = byName.get(f.properties.place)!;
      line.bindTooltip(`${esc(place.name)}<br><small>${vi.waterwayLine}</small>`, { sticky: true });
      line.on('click', () => onDetails(place));
      line.on('mouseover', () => (line as L.Path).setStyle({ opacity: 0.9, weight: 6 }));
      line.on('mouseout', () => (line as L.Path).setStyle({ opacity: 0.55, weight: 4 }));
    },
  }).addTo(layer);
}
