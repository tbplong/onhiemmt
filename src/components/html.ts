import { ICON_PATHS, ISSUE_ICONS, LAYERS, type IconName } from '../config/map';
import type { Place } from '../data/normalize';

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Every CSV value goes through this before reaching innerHTML. */
export const esc = (s: string): string => s.replace(/[&<>"']/g, (c) => ESCAPES[c]!);

export const icon = (name: IconName): string =>
  `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${ICON_PATHS[name]}"/></svg>`;

export const placeIcon = (place: Place): IconName =>
  (place.issueType && ISSUE_ICONS[place.issueType]) || LAYERS[place.category].icon;
