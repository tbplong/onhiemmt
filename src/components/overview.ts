import { formatNumeric } from '../data/parse';
import type { CityIndicator } from '../data/normalize';
import { vi } from '../i18n/vi';
import { esc } from './html';
import { renderSourceList } from './sources';

function renderIndicator(ind: CityIndicator): string {
  const value = formatNumeric(ind.value);
  return `<li class="indicator">
    <p class="indicator-name">${esc(ind.name)}</p>
    ${value ? `<p class="indicator-value"><strong>${esc(value)}</strong> ${esc(ind.unit)}</p>` : ''}
    ${ind.note ? `<p class="note">${esc(ind.note)}</p>` : ''}
    ${!value && !ind.note ? `<p class="muted">${vi.noData}</p>` : ''}
    <details><summary>${vi.sources}</summary>${renderSourceList(ind.sources)}</details>
  </li>`;
}

export function renderOverview(indicators: CityIndicator[]): string {
  const groups = Map.groupBy(indicators, (i) => i.group);
  const sections = [...groups].map(
    ([name, items]) =>
      `<section class="group"><h3>${esc(name)}</h3><ul class="indicators">${items.map(renderIndicator).join('')}</ul></section>`,
  );
  return `<header class="detail-head"><h2 id="panel-title" tabindex="-1">${vi.overview}</h2></header>
    <p class="lead">${vi.overviewIntro}</p><div class="flow">${sections.join('')}</div>`;
}
