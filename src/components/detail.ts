import { LAYERS } from '../config/map';
import { formatNumeric } from '../data/parse';
import { getFieldGroups, type CityIndicator, type Place } from '../data/normalize';
import type { FieldDef } from '../data/schema';
import { vi } from '../i18n/vi';
import { esc, icon, placeIcon } from './html';
import { renderMangroveChart } from './mangrove';
import { renderSourceList } from './sources';

export type IndicatorLookup = ReadonlyMap<string, CityIndicator>;

const noData = `<span class="muted">${vi.noData}</span>`;

function renderBadges(place: Place): string {
  const badges: string[] = [];
  if (place.coordConfidence !== 'verified') {
    const hint = vi.approxLocationHint[place.coordConfidence];
    badges.push(`<span class="badge badge--approx" title="${hint}">${vi.approxLocation}</span>`);
  }
  if (place.isPlanned) {
    badges.push(
      `<span class="badge badge--planned" title="${vi.plannedHint}">${vi.planned}</span>`,
    );
  }
  if (place.isDistrict) {
    badges.push(`<span class="badge" title="${vi.districtHint}">${vi.district}</span>`);
  }
  return badges.length ? `<div class="badges">${badges.join('')}</div>` : '';
}

function fieldLabel(def: FieldDef, place: Place): string {
  const year = def.yearKey ? place.fields.get(def.yearKey) : undefined;
  return year?.kind === 'text' ? `${def.label} (${year.items.join(', ')})` : def.label;
}

function renderValue(def: FieldDef, place: Place): string {
  const value = place.fields.get(def.key);
  if (!value) return noData;
  if (value.kind === 'text') {
    return value.items.length > 1
      ? `<ul>${value.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`
      : esc(value.items[0]!);
  }
  const text = formatNumeric(value.value);
  return text ? `<strong>${esc(text)}</strong>${def.unit ? ` ${esc(def.unit)}` : ''}` : noData;
}

function renderCityRef(def: FieldDef, indicators: IndicatorLookup): string {
  const ref = def.cityRef ? indicators.get(def.cityRef) : undefined;
  const text = ref && formatNumeric(ref.value);
  return text
    ? `<span class="city-ref" title="${esc(ref.name)}">${vi.cityAverage}: ${esc(text)} ${esc(ref.unit)}</span>`
    : '';
}

function renderGroups(place: Place, indicators: IndicatorLookup): string {
  return getFieldGroups(place)
    .map(({ group, fields }) => {
      const rows = fields.map(
        (f) =>
          `<div class="row row--${f.kind}"><dt>${esc(fieldLabel(f, place))}</dt><dd>${renderValue(f, place)}${renderCityRef(f, indicators)}</dd></div>`,
      );
      return `<section class="group">
        <h3>${esc(group.title)}</h3>
        ${group.note ? `<p class="note">${esc(group.note)}</p>` : ''}
        ${rows.length ? `<dl>${rows.join('')}</dl>` : `<p>${noData}</p>`}
      </section>`;
    })
    .join('');
}

const renderList = (items: string[]): string =>
  `<ul class="bullets">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;

function renderHeader(place: Place): string {
  const layer = LAYERS[place.category];
  const kind = place.issueType ?? layer.label;
  return `<header class="detail-head" style="--c:${layer.color}">
    <p class="kind">${icon(placeIcon(place))}<span>${esc(kind)}</span></p>
    <h2 id="panel-title" tabindex="-1">${esc(place.name)}</h2>
    ${renderBadges(place)}
  </header>`;
}

/** Full detail for the side panel / bottom sheet. */
export function renderDetail(place: Place, indicators: IndicatorLookup): string {
  return `${renderHeader(place)}<div class="flow">
    ${place.description.length ? `<section class="group"><h3>${vi.description}</h3>${renderList(place.description)}</section>` : ''}
    ${renderGroups(place, indicators)}
    ${renderMangroveChart(place.mangrove)}
    ${place.recordYear ? `<section class="group"><h3>${vi.recordYear}</h3><p>${esc(place.recordYear)}</p></section>` : ''}
    <section class="group"><h3>${vi.sources}</h3>${renderSourceList(place.sources)}</section>
    ${place.coordConfidence !== 'verified' ? `<p class="note">${vi.approxLocationHint[place.coordConfidence]}</p>` : ''}</div>`;
}

/** Quick look in the map popup: up to 3 highlighted metrics, else the first description line. */
export function renderPopup(place: Place, onDetails: () => void): HTMLElement {
  const highlights = getFieldGroups(place)
    .flatMap((g) => g.fields)
    .filter((f) => f.highlight && place.fields.has(f.key))
    .slice(0, 3);
  const body = highlights.length
    ? `<dl>${highlights.map((f) => `<div class="row"><dt>${esc(fieldLabel(f, place))}</dt><dd>${renderValue(f, place)}</dd></div>`).join('')}</dl>`
    : place.description[0]
      ? `<p class="clamp">${esc(place.description[0])}</p>`
      : '';
  const el = document.createElement('div');
  el.className = 'popup';
  el.style.setProperty('--c', LAYERS[place.category].color);
  el.innerHTML = `<p class="kind">${icon(placeIcon(place))}<span>${esc(place.issueType ?? LAYERS[place.category].label)}</span></p>
    <h3>${esc(place.name)}</h3>${renderBadges(place)}${body}
    <button type="button" class="btn">${vi.viewDetails}</button>`;
  el.querySelector('button')!.addEventListener('click', onDetails);
  return el;
}
