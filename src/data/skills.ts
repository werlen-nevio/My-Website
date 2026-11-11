import type { Localized } from '../i18n';

export interface SkillGroup {
    id: string;
    title: Localized;
    description: Localized;
    items: { name: string | Localized; note?: Localized }[];
}

/**
 * Only technologies that already appear in the CV, the old site or the
 * project case studies (where Nevio worked on that part of the stack).
 */
export const skillGroups: SkillGroup[] = [
    {
        id: 'frontend',
        title: { de: 'Frontend', en: 'Frontend' },
        description: {
            de: 'Interfaces, die schnell, zugänglich und angenehm zu bedienen sind.',
            en: 'Interfaces that are fast, accessible and pleasant to use.',
        },
        items: [
            { name: 'React' },
            { name: 'Vue 3' },
            { name: 'Angular' },
            { name: 'TypeScript' },
            { name: 'JavaScript' },
            { name: 'HTML & CSS' },
            { name: 'Vite' },
            { name: 'Leaflet / MapLibre' },
        ],
    },
    {
        id: 'backend',
        title: { de: 'Backend', en: 'Backend' },
        description: {
            de: 'Server-Logik und Schnittstellen, die Daten sicher bereitstellen.',
            en: 'Server logic and APIs that deliver data securely.',
        },
        items: [
            { name: 'Node.js' },
            { name: 'PHP' },
            { name: 'JWT', note: { de: 'Authentifizierung', en: 'Authentication' } },
        ],
    },
    {
        id: 'data',
        title: { de: 'Echtzeit & Daten', en: 'Realtime & data' },
        description: {
            de: 'Live-Updates und strukturierte Datenhaltung.',
            en: 'Live updates and structured data storage.',
        },
        items: [
            { name: 'Socket.io', note: { de: 'WebSockets', en: 'WebSockets' } },
            { name: 'MySQL' },
        ],
    },
    {
        id: 'product',
        title: { de: 'Produkt & Design', en: 'Product & design' },
        description: {
            de: 'Vom Konzept bis zur fertigen Komponente.',
            en: 'From concept to finished component.',
        },
        items: [
            { name: 'UI/UX', note: { de: 'Konzept', en: 'Concept' } },
            { name: { de: 'Komponentenbibliotheken', en: 'Component libraries' } },
            { name: 'Mobile first' },
        ],
    },
    {
        id: 'tools',
        title: { de: 'Werkzeuge & Plattformen', en: 'Tools & platforms' },
        description: {
            de: 'Versionierung, CMS und die Migration bestehender Systeme.',
            en: 'Version control, CMS work and migrating existing systems.',
        },
        items: [
            { name: 'Git' },
            { name: 'WordPress', note: { de: 'Plugins', en: 'Plugins' } },
            { name: 'ASP Classic', note: { de: 'Migration', en: 'Migration' } },
        ],
    },
];

/** Resolves a skill name that may be localized. */
export function skillName(name: string | Localized, lang: 'de' | 'en'): string {
    return typeof name === 'string' ? name : name[lang];
}
