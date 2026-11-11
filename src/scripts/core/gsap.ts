import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

/**
 * One motion language for the whole site:
 * things arrive fast and settle softly (expo.out), nothing bounces.
 */
gsap.defaults({ ease: 'expo.out', duration: 1 });

export const EASE = {
    out: 'expo.out',
    soft: 'power3.out',
    inOut: 'power3.inOut',
} as const;

export { gsap, ScrollTrigger, SplitText };
