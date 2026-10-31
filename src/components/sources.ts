import { DATASET_CREDITS } from '../config/map';
import type { SourceRef } from '../data/parse';
import { vi } from '../i18n/vi';
import { esc } from './html';

const link = (label: string, url: string): string =>
  `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;

export function renderSourceList(sources: SourceRef[]): string {
  if (!sources.length) return `<p class="muted">${vi.noSource}</p>`;
  const items = sources.map((s) => `<li>${s.url ? link(s.label, s.url) : esc(s.label)}</li>`);
  return `<ul class="sources">${items.join('')}</ul>`;
}

export function renderCredits(): string {
  const items = DATASET_CREDITS.map(
    (c) => `<li>${link(c.name, c.url)}<span class="muted">${esc(c.detail)}</span></li>`,
  );
  return `<p class="lead">${vi.sourcesIntro}</p><ul class="credits">${items.join('')}</ul>`;
}
