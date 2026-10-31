import { describe, expect, it } from 'vitest';
import type { StyleSpecification } from 'maplibre-gl';
import { clampWidth } from '../src/components/panel';
import { PANEL_WIDTH } from '../src/config/map';
import { themeStyle } from '../src/map/theme';

describe('themeStyle', () => {
  const style = {
    version: 8,
    sources: {},
    layers: [
      {
        id: 'water',
        type: 'fill',
        source: 'x',
        paint: { 'fill-color': '#000', 'fill-opacity': 1 },
      },
      { id: 'other', type: 'fill', source: 'x', paint: { 'fill-color': '#111' } },
      { id: 'background', type: 'background' },
    ],
  } as StyleSpecification;

  it('overrides matching layers, keeps other paint props and untouched layers', () => {
    const out = themeStyle(style, { water: { 'fill-color': '#abc' }, background: { x: 1 } });
    expect(out.layers[0]).toMatchObject({ paint: { 'fill-color': '#abc', 'fill-opacity': 1 } });
    expect(out.layers[1]).toBe(style.layers[1]);
    expect(out.layers[2]).toBe(style.layers[2]); // no paint object to merge into
    expect(style.layers[0]).toMatchObject({ paint: { 'fill-color': '#000' } }); // input untouched
  });
});

describe('clampWidth', () => {
  it('respects the minimum and leaves room for the map', () => {
    expect(clampWidth(100, 1440)).toBe(PANEL_WIDTH.min);
    expect(clampWidth(5000, 1440)).toBe(1440 - PANEL_WIDTH.mapMin);
    expect(clampWidth(600.4, 1440)).toBe(600);
  });
});
