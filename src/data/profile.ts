import type { Localized } from '../i18n';

/**
 * Personal data. Edit here – every page reads from this file.
 *
 * `portrait`: set to { src: '/assets/portrait.jpg', alt: {…} } once a photo exists.
 * Until then the About section shows the dot-matrix monogram instead.
 */
export const profile = {
    name: 'Nevio Werlen',
    firstName: 'Nevio',
    lastName: 'Werlen',
    role: 'Software Developer',
    email: 'mail@nevio.dev',
    site: 'https://nevio.dev',
    timeZone: 'Europe/Zurich',
    location: { de: 'Wallis, Schweiz', en: 'Valais, Switzerland' } satisfies Localized,
    locationShort: { de: 'Wallis, CH', en: 'Valais, CH' } satisfies Localized,

    portrait: null as null | { src: string; alt: Localized },

    socials: [
        { id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/nevio-bastian-werlen-893548383/', handle: 'nevio-bastian-werlen' },
        { id: 'github', label: 'GitHub', href: 'https://github.com/werlen-nevio', handle: 'werlen-nevio' },
    ] as const,

    languages: [
        { name: { de: 'Deutsch', en: 'German' }, level: { de: 'Muttersprache', en: 'Native' } },
        { name: { de: 'Englisch', en: 'English' }, level: { de: 'Fliessend', en: 'Fluent' } },
        { name: { de: 'Französisch', en: 'French' }, level: { de: 'Schulkenntnisse', en: 'School level' } },
    ] satisfies { name: Localized; level: Localized }[],

    /** Short profile for the printable CV. */
    cvProfile: {
        de: 'Software Developer aus dem Wallis, ausgebildet als Informatiker EFZ mit Fachrichtung Applikationsentwicklung. Aktuell Junior Developer bei der Hotelpac HC System AG und Mitgründer von Firntech. Ich entwickle Web-Anwendungen mit klarem Design und sauberer Architektur. Erfahrung habe ich mit React, Vue, Angular, Node.js, PHP und der Migration bestehender Systeme.',
        en: 'Software developer from Valais, Switzerland, trained as an Informatiker EFZ in application development. Currently a junior developer at Hotelpac HC System AG and a co-founder of Firntech. I build web applications with clear design and clean architecture, with experience in React, Vue, Angular, Node.js, PHP and migrating existing systems.',
    } satisfies Localized,

    about: {
        statement: {
            de: 'Ich baue digitale Produkte, die durchdacht aussehen, zuverlässig funktionieren und tatsächlich genutzt werden.',
            en: 'I build digital products that look considered, work reliably and actually get used.',
        },
        paragraphs: [
            {
                de: 'Mein Fundament ist die Ausbildung zum Informatiker EFZ mit Fachrichtung Applikationsentwicklung bei CORTEC in Visp. Dort habe ich an der Entwicklung und Erweiterung von ERP- und Kinobuchungssystemen mitgearbeitet.',
                en: 'My foundation is a four-year apprenticeship as an Informatiker EFZ in application development at CORTEC in Visp, where I helped develop and extend ERP and cinema booking systems.',
            },
            {
                de: 'Heute arbeite ich als Junior Developer bei der Hotelpac HC System AG in Brig und baue als Mitgründer Firntech auf, ein Softwareunternehmen aus Brig. Parallel absolviere ich die Berufsmaturität an der AKAD.',
                en: 'Today I work as a junior developer at Hotelpac HC System AG in Brig and, as a co-founder, I’m building Firntech, a software company from Brig. Alongside that, I’m completing the vocational baccalaureate at AKAD.',
            },
            {
                de: 'Was mich antreibt, ist die Verbindung von Technik und Gestaltung: Interfaces mit Charakter, klare Strukturen und Details, die man erst bemerkt, wenn sie fehlen. Wertvolle Impulse dafür habe ich im Silicon Valley IT Talent Program in San Francisco gesammelt.',
                en: 'What drives me is where engineering meets design: interfaces with character, clear structure and details you only notice when they’re missing. The Silicon Valley IT Talent Program in San Francisco gave me valuable input on exactly that.',
            },
        ] satisfies Localized[],
        facts: [
            { label: { de: 'Standort', en: 'Based in' }, value: { de: 'Wallis, Schweiz', en: 'Valais, Switzerland' } },
            { label: { de: 'Schwerpunkte', en: 'Focus' }, value: { de: 'Web-Entwicklung, UI/UX', en: 'Web development, UI/UX' } },
            { label: { de: 'Ausbildung', en: 'Training' }, value: { de: 'Informatiker EFZ, Applikationsentwicklung', en: 'Informatiker EFZ, application development' } },
            { label: { de: 'Sprachen', en: 'Languages' }, value: { de: 'Deutsch, Englisch, Französisch', en: 'German, English, French' } },
        ] satisfies { label: Localized; value: Localized }[],
    },
};
