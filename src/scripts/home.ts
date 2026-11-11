import './site';
import { initHeroBuild } from './build/hero';

const hero = initHeroBuild();

document.querySelector('[data-rebuild]')?.addEventListener('click', () => hero?.replay());
