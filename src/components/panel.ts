import { PANEL_WIDTH } from '../config/map';
import { vi } from '../i18n/vi';
import { icon } from './html';

const PREFS_KEY = 'panel-prefs';
const KEY_STEP = 32;

interface PanelPrefs {
  width: number;
  sheetFull: boolean;
}

const isPhone = () => matchMedia('(max-width: 767px)').matches;

/** Keeps the panel within its minimum and leaves room for the map. */
export const clampWidth = (w: number, viewport: number): number =>
  Math.round(Math.max(PANEL_WIDTH.min, Math.min(w, viewport - PANEL_WIDTH.mapMin)));

const wideWidth = () =>
  clampWidth(Math.min(PANEL_WIDTH.wide, innerWidth * PANEL_WIDTH.wideRatio), innerWidth);

// Per-viewer convenience only: storage may be blocked, so failures fall back to defaults.
function loadPrefs(): PanelPrefs {
  const fallback = { width: PANEL_WIDTH.default, sheetFull: false };
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') };
  } catch {
    return fallback;
  }
}

function savePrefs(prefs: PanelPrefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* storage unavailable */
  }
}

/**
 * Side panel on desktop (expand button + draggable edge), bottom sheet on phones
 * (expand button grows the sheet to near full height).
 */
export function createPanel(
  root: HTMLElement,
  onClose: () => void,
  onResize: (width: number) => void,
) {
  root.innerHTML = `
    <div class="panel-tools">
      <button type="button" class="panel-btn panel-expand" aria-pressed="false"></button>
      <button type="button" class="panel-btn panel-close" aria-label="${vi.close}">×</button>
    </div>
    <div class="panel-body"></div>
    <div class="panel-resize" role="separator" aria-orientation="vertical" tabindex="0"
      aria-label="${vi.panelResize}" aria-valuemin="${PANEL_WIDTH.min}"></div>`;
  const body = root.querySelector<HTMLElement>('.panel-body')!;
  const expandBtn = root.querySelector<HTMLButtonElement>('.panel-expand')!;
  const handle = root.querySelector<HTMLElement>('.panel-resize')!;
  const prefs = loadPrefs();
  let returnFocus: HTMLElement | null = null;

  const isExpanded = () =>
    isPhone() ? prefs.sheetFull : prefs.width > PANEL_WIDTH.default + KEY_STEP;

  const render = () => {
    prefs.width = clampWidth(prefs.width, innerWidth);
    document.documentElement.style.setProperty('--panel-w', `${prefs.width}px`);
    root.classList.toggle('panel--full', prefs.sheetFull);
    handle.setAttribute('aria-valuenow', String(prefs.width));
    handle.setAttribute('aria-valuemax', String(innerWidth - PANEL_WIDTH.mapMin));
    const expanded = isExpanded();
    expandBtn.setAttribute('aria-pressed', String(expanded));
    expandBtn.innerHTML = `${icon(expanded ? 'collapse' : 'expand')}<span>${expanded ? vi.collapse : vi.expand}</span>`;
  };

  const update = (change: Partial<PanelPrefs>) => {
    Object.assign(prefs, change);
    render();
    savePrefs(prefs);
    onResize(isPhone() ? 0 : prefs.width);
  };

  expandBtn.addEventListener('click', () =>
    isPhone()
      ? update({ sheetFull: !prefs.sheetFull })
      : update({ width: isExpanded() ? PANEL_WIDTH.default : wideWidth() }),
  );

  handle.addEventListener('pointerdown', (e) => {
    handle.setPointerCapture(e.pointerId);
    root.classList.add('panel--resizing');
  });
  handle.addEventListener('pointermove', (e) => {
    if (handle.hasPointerCapture(e.pointerId)) update({ width: e.clientX });
  });
  handle.addEventListener('lostpointercapture', () => root.classList.remove('panel--resizing'));
  handle.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: -KEY_STEP, ArrowRight: KEY_STEP }[e.key];
    if (!step) return;
    e.preventDefault();
    update({ width: prefs.width + step });
  });
  addEventListener('resize', render);

  const close = () => {
    if (root.hidden) return;
    root.hidden = true;
    returnFocus?.focus();
    onClose();
  };

  root.querySelector('.panel-close')!.addEventListener('click', close);
  root.addEventListener('keydown', (e) => e.key === 'Escape' && close());
  render();

  return {
    open(html: string) {
      if (root.hidden) returnFocus = document.activeElement as HTMLElement | null;
      body.innerHTML = html;
      body.scrollTop = 0;
      root.hidden = false;
      (body.querySelector<HTMLElement>('#panel-title') ?? root).focus();
    },
    close,
  };
}
