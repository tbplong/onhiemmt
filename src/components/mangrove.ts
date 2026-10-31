import { LAYERS } from '../config/map';
import { formatNumeric, type NumericValue } from '../data/parse';
import type { Place } from '../data/normalize';
import { vi } from '../i18n/vi';
import { esc } from './html';

// Bar height uses the upper bound of a range/bound so the bar never understates the source.
const barValue = (v: NumericValue): number | null =>
  v.kind === 'exact' || v.kind === 'bound' ? v.value : v.kind === 'range' ? v.max : null;

export function renderMangroveChart(points: Place['mangrove']): string {
  if (!points.length) return '';
  const max = Math.max(...points.map((p) => barValue(p.value) ?? 0)) || 1;
  const bars = points.map((p) => {
    const value = barValue(p.value);
    const label = formatNumeric(p.value);
    const height = value === null ? 0 : Math.max(4, (value / max) * 100);
    return `<li>
      <span class="bar-value">${label ? `${esc(label)} ${vi.mangroveUnit}` : vi.noData}</span>
      <span class="bar-track"><span class="bar" style="height:${height}%" data-empty="${value === null}"></span></span>
      <span class="bar-year">${p.year}</span>
    </li>`;
  });
  return `<section class="group"><h3>${vi.mangroveTitle}</h3><ol class="bars" style="--c:${LAYERS.green.color}">${bars.join('')}</ol></section>`;
}
