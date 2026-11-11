import type { Localized } from '../i18n';

export interface Education {
    id: string;
    institution: string;
    /** Optional explanation of the institution for international readers. */
    institutionNote?: Localized;
    degree: Localized;
    field: Localized;
    start: string;
    end: string;
}

export interface EducationPlaceholder {
    id: string;
    placeholder: true;
    title: Localized;
    text: Localized;
}

export const education: Education[] = [
    {
        id: 'akad',
        institution: 'AKAD',
        degree: { de: 'Berufsmaturität', en: 'Vocational Baccalaureate (Berufsmaturität)' },
        field: { de: 'Technik, Architektur, Life Sciences', en: 'Technology, Architecture, Life Sciences' },
        start: '2026-08',
        end: '2027-07',
    },
    {
        id: 'bfo',
        institution: 'Berufsfachschule Oberwallis',
        institutionNote: { de: 'Berufsfachschule', en: 'Vocational school, Upper Valais' },
        degree: { de: 'Informatiker EFZ', en: 'Informatiker EFZ (Federal VET Diploma in ICT)' },
        field: { de: 'Applikationsentwicklung', en: 'Application development' },
        start: '2022-08',
        end: '2026-07',
    },
];

/**
 * Placeholder for courses and certificates. Replace or remove once there
 * is real content – it renders as a quiet dashed card.
 */
export const educationPlaceholder: EducationPlaceholder | null = {
    id: 'more',
    placeholder: true,
    title: { de: 'Weiterbildungen & Zertifikate', en: 'Courses & certificates' },
    text: { de: 'Wird laufend ergänzt.', en: 'Added as they happen.' },
};
