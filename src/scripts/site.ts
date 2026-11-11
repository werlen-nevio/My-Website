/**
 * Shared entry for every page. Page entries (home.ts, case.ts) import this
 * module first, so it is guaranteed to have run before them.
 */
import { ScrollTrigger } from './core/gsap';
import { root, qsa, reducedMotion, isSmall, releaseIntroGate, fontsReady } from './core/env';
import { initScroll } from './core/scroll';
import { initNav } from './nav';
import { initReveals } from './reveal';
import { initPointer } from './pointer';
import { initSectionBuilds, buildPageIntro } from './build/sections';
import { initMediaFallback, initClock, initCopy, initLanguage, initProgress } from './ui';
import { Topography } from './topo/Topography';

initScroll();
initNav();
initMediaFallback();
initPointer();
initClock();
initCopy();
initLanguage();
initProgress();
initReveals();
initSectionBuilds();

// Calm contour maps (contact, case-study headers, 404); the hero owns its own.
qsa<HTMLCanvasElement>('canvas[data-topo="calm"]').forEach((canvas, i) => {
    try {
        new Topography(canvas, { reduced: reducedMotion(), small: isSmall(), pointer: true, speed: 0.7, intensity: 0.85, seed: 23 + i }).fadeIn(1.6);
    } catch {
        /* no canvas support – purely decorative */
    }
});

if (root.dataset.intro === 'page') buildPageIntro();
else if (!root.dataset.intro) releaseIntroGate();

fontsReady().then(() => ScrollTrigger.refresh());
