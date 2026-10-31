import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { LAYERS, MAP_CENTER, MAP_ZOOM } from '../config/map';
import { addBasemap } from './basemap';
import { renderPopup } from '../components/detail';
import { esc, icon, placeIcon } from '../components/html';
import type { Place } from '../data/normalize';
import type { CategoryId } from '../data/schema';

/** Height (px) of the top-right search dock plus a margin. */
const DOCK_CLEARANCE = 190;

function markerIcon(place: Place): L.DivIcon {
  const classes = [
    'pin',
    place.coordConfidence !== 'verified' && 'pin--approx',
    place.isDistrict && 'pin--district',
    place.isPlanned && 'pin--planned',
  ].filter(Boolean);
  return L.divIcon({
    className: '',
    html: `<span class="${classes.join(' ')}" style="--c:${LAYERS[place.category].color}">${icon(placeIcon(place))}</span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
    tooltipAnchor: [0, -16],
  });
}

const clusterIcon = (category: CategoryId) => (cluster: L.MarkerCluster) =>
  L.divIcon({
    className: '',
    html: `<span class="cluster" style="--c:${LAYERS[category].color}">${cluster.getChildCount()}</span>`,
    iconSize: [36, 36],
  });

export interface PlaceMap {
  map: L.Map;
  /** One group per category: the marker cluster plus any waterway lines. */
  layers: Record<CategoryId, L.LayerGroup>;
  setLayerVisible(category: CategoryId, visible: boolean): void;
  focusPlace(place: Place): void;
  /** Pans so the open popup is not hidden under a left panel of this width. */
  keepPopupClear(panelWidth: number): void;
}

export function createPlaceMap(
  el: HTMLElement,
  places: Place[],
  onDetails: (place: Place) => void,
): PlaceMap {
  const map = L.map(el, { zoomControl: false, maxZoom: 19 }).setView(MAP_CENTER, MAP_ZOOM);
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map);
  void addBasemap(map);

  const clusters = {} as Record<CategoryId, L.MarkerClusterGroup>;
  const layers = {} as Record<CategoryId, L.LayerGroup>;
  for (const category of Object.keys(LAYERS) as CategoryId[]) {
    clusters[category] = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 40,
      iconCreateFunction: clusterIcon(category),
    });
    layers[category] = L.layerGroup([clusters[category]]).addTo(map);
  }

  const markers = new Map<string, L.Marker>();
  for (const place of places) {
    const marker = L.marker([place.lat, place.lng], {
      icon: markerIcon(place),
      riseOnHover: true,
    })
      // Leaflet's `title` option adds a native tooltip on top of ours; aria-label names it instead.
      .on('add', (e) => (e.target as L.Marker).getElement()?.setAttribute('aria-label', place.name))
      .bindTooltip(esc(place.name), { direction: 'top' })
      .bindPopup(() => renderPopup(place, () => onDetails(place)), {
        maxWidth: 300,
        minWidth: 240,
        // Top padding keeps popups clear of the search dock in the top-right corner.
        autoPanPaddingTopLeft: [24, DOCK_CLEARANCE],
        autoPanPaddingBottomRight: [24, 24],
      });
    markers.set(place.id, marker);
    clusters[place.category].addLayer(marker);
  }

  let openPopup: L.Popup | null = null;
  map.on('popupopen', (e) => (openPopup = e.popup));
  map.on('popupclose', () => (openPopup = null));

  const setLayerVisible = (category: CategoryId, visible: boolean) => {
    if (visible) layers[category].addTo(map);
    else layers[category].remove();
  };

  return {
    map,
    layers,
    setLayerVisible,
    keepPopupClear(panelWidth) {
      const latLng = openPopup?.getLatLng();
      const el = openPopup?.getElement();
      if (!latLng || !el) return;
      // The popup is centred above its marker, so clear half its width and its full height.
      map.panInside(latLng, {
        paddingTopLeft: [panelWidth + el.offsetWidth / 2 + 24, el.offsetHeight + DOCK_CLEARANCE],
      });
    },
    focusPlace(place) {
      const marker = markers.get(place.id);
      if (!marker) return;
      setLayerVisible(place.category, true);
      map.setView(marker.getLatLng(), Math.max(map.getZoom(), 15), { animate: false });
      clusters[place.category].zoomToShowLayer(marker, () => marker.openPopup());
    },
  };
}
