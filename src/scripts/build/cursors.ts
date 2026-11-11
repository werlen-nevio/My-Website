/**
 * The builders: multiplayer-style cursors with name tags, plus the
 * selection frames and text carets they leave behind while working.
 *
 * Everything lives in one absolutely positioned layer at the document
 * origin, so coordinates are page coordinates – cursors stay glued to the
 * content even while the page scrolls.
 */

export interface Builder {
    root: HTMLElement;
    /** Planned position (page coordinates) – updated while scheduling. */
    x: number;
    y: number;
    color: { bg: string; fg: string };
}

/** Multiplayer palette – used only for the builders, never in the UI. */
const PALETTE = [
    { bg: '#3243f5', fg: '#ffffff' },
    { bg: '#3dd6a3', fg: '#04261a' },
    { bg: '#ff7a59', fg: '#2b0e05' },
    { bg: '#f5c451', fg: '#2a1e00' },
    { bg: '#8e9bff', fg: '#0a0f24' },
    { bg: '#5cb8ff', fg: '#04223a' },
    { bg: '#ff8fc7', fg: '#330a1f' },
];

const ARROW =
    '<svg class="bc__arrow" width="22" height="24" viewBox="0 0 22 24" aria-hidden="true"><path d="M2.5 2.2 2.6 19.4l4.6-4.3 3.1 7 3.3-1.5-3.1-6.9 6.4-.3Z"/></svg>';
const BEAM =
    '<svg class="bc__beam" width="14" height="22" viewBox="0 0 14 22" aria-hidden="true"><path d="M3 2h3.2c.5 0 .8.3.8.8v16.4c0 .5-.3.8-.8.8H3M11 2H7.8c-.5 0-.8.3-.8.8v16.4c0 .5.3.8.8.8H11"/></svg>';

let layer: HTMLElement | null = null;

/** The shared layer (created on first use). */
export function getLayer(): HTMLElement {
    if (layer && layer.isConnected) return layer;
    layer = document.createElement('div');
    layer.className = 'build-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.append(layer);
    return layer;
}

export function createBuilder(label: string, index: number, x: number, y: number, parent: HTMLElement = getLayer()): Builder {
    const color = PALETTE[index % PALETTE.length];
    const root = document.createElement('div');
    root.className = 'bc';
    root.style.setProperty('--bc-bg', color.bg);
    root.style.setProperty('--bc-fg', color.fg);
    root.innerHTML = `${ARROW}${BEAM}<span class="bc__ripple"></span><span class="bc__label"></span>`;
    root.querySelector('.bc__label')!.textContent = label;
    parent.append(root);
    return { root, x, y, color };
}

/** Figma-like selection frame with corner handles and a size readout. */
export function createFrame(color: { bg: string; fg: string }, parent: HTMLElement = getLayer()): HTMLElement {
    const frame = document.createElement('div');
    frame.className = 'bsel';
    frame.style.setProperty('--bc-bg', color.bg);
    frame.style.setProperty('--bc-fg', color.fg);
    frame.innerHTML = '<i class="bsel__h tl"></i><i class="bsel__h tr"></i><i class="bsel__h bl"></i><i class="bsel__h br"></i><span class="bsel__size"></span>';
    parent.append(frame);
    return frame;
}

export function createCaret(color: { bg: string }, parent: HTMLElement = getLayer()): HTMLElement {
    const caret = document.createElement('div');
    caret.className = 'bcaret';
    caret.style.setProperty('--bc-bg', color.bg);
    parent.append(caret);
    return caret;
}
