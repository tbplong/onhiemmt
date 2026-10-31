import './styles.css';
import { LAYERS } from './config/map';
import { renderDetail } from './components/detail';
import { esc, icon } from './components/html';
import { renderOverview } from './components/overview';
import { createPanel } from './components/panel';
import { createSearch } from './components/search';
import { renderCredits } from './components/sources';
import { loadDataset } from './data/load';
import type { CategoryId } from './data/schema';
import { vi } from './i18n/vi';
import { createPlaceMap } from './map/map';
import { addWaterways } from './map/waterways';

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

function renderLayerChips(
  container: HTMLElement,
  counts: Record<CategoryId, number>,
  onToggle: (c: CategoryId, on: boolean) => void,
) {
  container.innerHTML = (Object.keys(LAYERS) as CategoryId[])
    .map(
      (
        c,
      ) => `<button type="button" class="chip" aria-pressed="true" data-layer="${c}" style="--c:${LAYERS[c].color}">
        <span class="dot">${icon(LAYERS[c].icon)}</span>${esc(LAYERS[c].label)}<span class="count">${counts[c]}</span>
      </button>`,
    )
    .join('');
  container.addEventListener('click', (e) => {
    const chip = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-layer]');
    if (!chip) return;
    const on = chip.getAttribute('aria-pressed') !== 'true';
    chip.setAttribute('aria-pressed', String(on));
    onToggle(chip.dataset.layer as CategoryId, on);
  });
}

type TextKey = {
  [K in keyof typeof vi]: (typeof vi)[K] extends string ? K : never;
}[keyof typeof vi];

/** Static markup carries keys only; the strings come from vi.ts. */
function applyStrings() {
  for (const el of document.querySelectorAll<HTMLElement>('[data-i18n]')) {
    el.textContent = vi[el.dataset.i18n as TextKey];
  }
  for (const attr of ['placeholder', 'aria-label']) {
    for (const el of document.querySelectorAll<HTMLElement>(`[data-i18n-${attr}]`)) {
      el.setAttribute(attr, vi[el.getAttribute(`data-i18n-${attr}`) as TextKey]);
    }
  }
}

function main() {
  applyStrings();
  const { places, indicators } = loadDataset();
  const indicatorByName = new Map(indicators.map((i) => [i.name, i]));
  const panel = createPanel(
    $('#panel'),
    () => document.body.classList.remove('panel-open'),
    (width) => placeMap.keepPopupClear(width),
  );

  const openPanel = (html: string) => {
    document.body.classList.add('panel-open');
    panel.open(html);
  };
  const showPlace = (place: (typeof places)[number]) => {
    // On phones the sheet covers the popup's spot, so close it instead of leaving it half-hidden.
    if (matchMedia('(max-width: 767px)').matches) placeMap.map.closePopup();
    openPanel(renderDetail(place, indicatorByName));
    placeMap.keepPopupClear($('#panel').offsetWidth);
  };

  const placeMap = createPlaceMap($('#map'), places, showPlace);
  const counts = Object.fromEntries(
    (Object.keys(LAYERS) as CategoryId[]).map((c) => [
      c,
      places.filter((p) => p.category === c).length,
    ]),
  ) as Record<CategoryId, number>;
  renderLayerChips($('#layers'), counts, placeMap.setLayerVisible);

  createSearch($('#search'), $('#search-results'), places, placeMap.focusPlace);
  $('#btn-overview').addEventListener('click', () => openPanel(renderOverview(indicators)));
  $('#btn-sources').addEventListener('click', () =>
    openPanel(
      `<header class="detail-head"><h2 id="panel-title" tabindex="-1">${vi.dataSources}</h2></header>${renderCredits()}`,
    ),
  );

  addWaterways(placeMap.layers.water, places, showPlace).catch((err) =>
    console.warn('Không tải được tuyến sông kênh', err),
  );
}

try {
  main();
} catch (err) {
  console.error(err);
  $('#map').innerHTML = `<p class="load-error">${vi.loadError}</p>`;
}
