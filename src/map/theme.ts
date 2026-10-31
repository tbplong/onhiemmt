import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
import { BASEMAP_PAINT } from '../config/map';

/** Merges paint overrides into matching layers of a MapLibre style. */
export function themeStyle(
  style: StyleSpecification,
  paint: Record<string, Record<string, unknown>> = BASEMAP_PAINT,
): StyleSpecification {
  return {
    ...style,
    layers: style.layers.map((layer) =>
      paint[layer.id] && 'paint' in layer
        ? ({ ...layer, paint: { ...layer.paint, ...paint[layer.id] } } as LayerSpecification)
        : layer,
    ),
  };
}
