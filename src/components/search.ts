import { LAYERS } from '../config/map';
import type { Place } from '../data/normalize';
import { vi } from '../i18n/vi';
import { esc, icon, placeIcon } from './html';

const MAX_RESULTS = 8;

/** Lowercase, no diacritics, so "tao dan" matches "Tao Đàn". */
export const fold = (s: string): string =>
  s.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gi, 'd').toLowerCase();

export function searchPlaces(places: Place[], query: string): Place[] {
  const tokens = fold(query).split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  const q = tokens.join(' ');
  return places
    .map((p) => ({ p, name: fold(p.name) }))
    .filter(({ name }) => tokens.every((t) => name.includes(t)))
    .sort((a, b) => Number(!a.name.includes(q)) - Number(!b.name.includes(q)))
    .slice(0, MAX_RESULTS)
    .map(({ p }) => p);
}

/** ARIA combobox: arrow keys move, Enter picks, Escape clears. */
export function createSearch(
  input: HTMLInputElement,
  list: HTMLUListElement,
  places: Place[],
  onPick: (place: Place) => void,
) {
  let results: Place[] = [];
  let active = -1;

  const render = () => {
    const open = input.value.trim().length > 0;
    input.setAttribute('aria-expanded', String(open));
    list.hidden = !open;
    input.setAttribute('aria-activedescendant', active >= 0 ? `opt-${active}` : '');
    list.innerHTML = results.length
      ? results
          .map(
            (
              p,
              i,
            ) => `<li id="opt-${i}" role="option" aria-selected="${i === active}" data-i="${i}" style="--c:${LAYERS[p.category].color}">
              <span class="dot">${icon(placeIcon(p))}</span>
              <span><span class="opt-name">${esc(p.name)}</span><span class="opt-kind">${esc(p.issueType ?? LAYERS[p.category].label)}</span></span>
            </li>`,
          )
          .join('')
      : `<li class="empty" role="presentation">${vi.searchEmpty}</li>`;
  };

  const pick = (i: number) => {
    const place = results[i];
    if (!place) return;
    input.value = place.name;
    results = [];
    active = -1;
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    onPick(place);
  };

  input.addEventListener('input', () => {
    results = searchPlaces(places, input.value);
    active = results.length ? 0 : -1;
    render();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!results.length) return;
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length;
      render();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pick(active);
    } else if (e.key === 'Escape') {
      input.value = '';
      results = [];
      render();
    }
  });
  // mousedown fires before the input's blur, so the list is still there to click.
  list.addEventListener('mousedown', (e) => {
    const li = (e.target as HTMLElement).closest<HTMLElement>('[data-i]');
    if (li) {
      e.preventDefault();
      pick(Number(li.dataset.i));
    }
  });
  input.addEventListener('blur', () => {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
  });
  input.addEventListener('focus', () => input.value.trim() && render());
}
