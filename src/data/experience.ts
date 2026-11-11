import type { Localized } from '../i18n';

export interface Experience {
    id: string;
    role: Localized;
    /** Company or organisation as written officially. */
    organisation: Localized;
    /** Short form used in tight spots (now-card, CV header). */
    organisationShort?: Localized;
    type: Localized;
    /** 'YYYY-MM' */
    start: string;
    /** 'YYYY-MM' or null for an ongoing position. */
    end: string | null;
    location?: Localized;
    workMode?: Localized;
    specialisation?: Localized;
    summary: Localized;
    highlights?: Localized[];
    link?: { href: string; label: Localized };
}

/** Ordered as presented: most recent first. */
export const experience: Experience[] = [
    {
        id: 'founder',
        role: { de: 'Founder', en: 'Founder' },
        organisation: { de: 'Firntech', en: 'Firntech' },
        organisationShort: { de: 'Firntech', en: 'Firntech' },
        type: { de: 'Selbstständig', en: 'Self-employed' },
        start: '2026-11',
        end: null,
        location: { de: 'Brig, Wallis, Schweiz', en: 'Brig, Valais, Switzerland' },
        summary: {
            de: 'Mit zwei Mitgründern baue ich Firntech auf, ein kleines Softwareunternehmen aus Brig. Unser erstes Produkt ist CoreFit, Software für Fitnessbetriebe und ihre Mitglieder. Ich verantworte Web und UX.',
            en: 'Together with two co-founders, I’m building Firntech, a small software company from Brig. Our first product is CoreFit, software for gyms and their members. I’m responsible for web and UX.',
        },
        link: { href: 'https://firntech.ch/', label: { de: 'firntech.ch', en: 'firntech.ch' } },
    },
    {
        id: 'hotelpac',
        role: { de: 'Junior Developer', en: 'Junior Developer' },
        organisation: { de: 'Hotelpac HC System AG', en: 'Hotelpac HC System AG' },
        organisationShort: { de: 'Hotelpac', en: 'Hotelpac' },
        type: { de: 'Teilzeit', en: 'Part-time' },
        start: '2026-08',
        end: null,
        location: { de: 'Brig, Wallis, Schweiz', en: 'Brig, Valais, Switzerland' },
        workMode: { de: 'Vor Ort', en: 'On-site' },
        summary: {
            de: 'Teilzeitstelle als Junior Developer in Brig, im direkten Anschluss an meine Ausbildung zum Informatiker EFZ. Vor Ort arbeite ich im Team an der Entwicklung der Software mit.',
            en: 'Part-time junior developer role in Brig, directly following my apprenticeship as an Informatiker EFZ. I work on-site with the team on software development.',
        },
    },
    {
        id: 'cortec',
        role: { de: 'Informatiker EFZ', en: 'Informatiker EFZ (apprenticeship)' },
        organisation: { de: 'CORTEC mastering business software', en: 'CORTEC mastering business software' },
        organisationShort: { de: 'CORTEC', en: 'CORTEC' },
        type: { de: 'Ausbildung', en: 'Apprenticeship' },
        start: '2022-08',
        end: '2026-07',
        location: { de: 'Visp, Wallis, Schweiz', en: 'Visp, Valais, Switzerland' },
        specialisation: { de: 'Fachrichtung Applikationsentwicklung', en: 'Specialising in application development' },
        summary: {
            de: 'Vierjährige Berufslehre als Informatiker EFZ mit Fachrichtung Applikationsentwicklung, mitten in der Entwicklung von Business-Software.',
            en: 'Four-year apprenticeship as an Informatiker EFZ (Swiss Federal VET Diploma in ICT), specialising in application development and working on business software from day one.',
        },
        highlights: [
            {
                de: 'Entwicklung und Erweiterung von ERP- und Kinobuchungssystemen',
                en: 'Developed and extended ERP and cinema booking systems',
            },
            {
                de: 'Integration neuer Features in die bestehende ERP-Plattform',
                en: 'Integrated new features into the existing ERP platform',
            },
        ],
    },
    {
        id: 'exchange-pro',
        role: { de: 'IT Talent Program Participant', en: 'IT Talent Program Participant' },
        organisation: { de: 'Exchange Pro', en: 'Exchange Pro' },
        type: { de: 'Praktikum', en: 'Internship' },
        start: '2025-09',
        end: '2025-10',
        location: { de: 'San Francisco, Kalifornien, USA', en: 'San Francisco, California, USA' },
        summary: {
            de: 'Teilnahme am Silicon Valley IT Talent Program mit Fokus auf moderne Softwareentwicklung, internationale Tech-Standards und Best Practices.',
            en: 'Took part in the Silicon Valley IT Talent Program, focused on modern software development, international tech standards and best practices.',
        },
        highlights: [
            {
                de: 'Entwicklung von AIVenture, einem täglichen KI-Bildbeschreibungsspiel, im Team mit sieben Schweizer Entwicklerinnen und Entwicklern',
                en: 'Built AIVenture, a daily AI image-description game, in a team of seven Swiss developers',
            },
            {
                de: 'Frontend mit React und Vite sowie kleinere Teile des Backends, betrieben auf der Google Cloud Platform',
                en: 'Frontend with React and Vite plus smaller parts of the backend, running on Google Cloud Platform',
            },
            {
                de: 'Vor Ort begleitet von einem erfahrenen Mentor, unter realen Startup-Bedingungen',
                en: 'Mentored on-site under real startup conditions',
            },
        ],
        link: { href: '/projects/aiventure', label: { de: 'Case Study zu AIVenture', en: 'AIVenture case study' } },
    },
];
