import type { Localized } from '../i18n';

/** Rich text blocks for case studies. `html` strings are trusted, authored content. */
export type Block =
    | { type: 'p'; html: Localized }
    | { type: 'h3'; text: Localized }
    | { type: 'list'; items: Localized[] }
    | { type: 'quote'; text: Localized };

export interface CaseSection {
    heading: Localized;
    blocks: Block[];
}

export type ProjectSlug = 'logictrail' | 'slopesafe' | 'aiventure';

export interface Project {
    slug: ProjectSlug;
    title: string;
    /** Shown in the browser frame's address bar. */
    domain: string;
    /** One-line category under the title. */
    category: Localized;
    /** Gradient of the stage the screen sits on (portfolio cards). */
    stage: [string, string];
    context?: Localized;
    summary: Localized;
    tagline: Localized;
    year: Localized;
    role: Localized;
    status: Localized;
    statusTone: 'live' | 'production' | 'offline';
    stack: string[];
    /** Screenshot for cards. Lives on the server in /assets (git-ignored). */
    cover?: { src: string; alt: Localized };
    /** Screenshot for the case study header. */
    hero?: { src: string; alt: Localized };
    website?: string;
    /**
     * Opens this site instead of a case study (no case page is built);
     * `repo` adds a «Code on GitHub» link to the card.
     */
    link?: { href: string; repo?: string };
    facts: { label: Localized; value: Localized }[];
    sections: CaseSection[];
    aside: { title: Localized; items: Localized[] }[];
    gallery: { src: string; caption: Localized }[];
}

const L = (de: string, en: string): Localized => ({ de, en });
const same = (s: string): Localized => ({ de: s, en: s });

const askMe = (subject: string): Localized => ({
    de: `<a href="mailto:mail@nevio.dev?subject=${encodeURIComponent(subject)}">Frag mich dazu</a>`,
    en: `<a href="mailto:mail@nevio.dev?subject=${encodeURIComponent(subject)}">Ask me about it</a>`,
});

export const projects: Project[] = [
    {
        slug: 'logictrail',
        title: 'LogicTrail',
        domain: 'werlen-nevio.github.io/LogicTrail',
        category: L('Entwickler-Tool, das Code-Abläufe erklärt', 'Developer tool that explains code paths'),
        stage: ['#e0a100', '#ffd24a'],
        context: L('Eigenes Projekt, Open Source', 'Side project, open source'),
        summary: L(
            'Frag deine Codebasis, wie sie funktioniert. LogicTrail macht aus einer Frage wie «Wie funktioniert der Checkout?» einen interaktiven Ablauf durch den Code: Komponenten, API-Routen, Services, Datenbank und Events, mit Datei und Zeile hinter jedem Schritt. Als CLI und als Plugin für Claude Code.',
            'Ask your codebase how it works. LogicTrail turns a question like “how does checkout work?” into an interactive execution flow: components, API routes, services, database calls and events, with the file and line behind every step. Available as a CLI and as a Claude Code plugin.',
        ),
        tagline: L(
            'Frag deine Codebasis, wie sie funktioniert. LogicTrail macht aus einer Frage einen belegten, interaktiven Ablauf durch den Code.',
            'Ask your codebase how it works. LogicTrail turns a question into an evidence-backed, interactive execution flow.',
        ),
        year: same('2026'),
        role: L('Konzept & Entwicklung', 'Concept & development'),
        status: L('Open Source, auf npm', 'Open source, on npm'),
        statusTone: 'live',
        stack: ['TypeScript', 'Node.js', 'Claude API', 'Mermaid'],
        cover: {
            src: '/media/logictrail-flow.webp',
            alt: L('LogicTrail: der Login-Ablauf einer Beispiel-App als interaktiver Graph', 'LogicTrail: the login flow of a sample app as an interactive graph'),
        },
        link: { href: 'https://werlen-nevio.github.io/LogicTrail/', repo: 'https://github.com/werlen-nevio/LogicTrail' },
        facts: [],
        sections: [],
        aside: [],
        gallery: [],
    },
    {
        slug: 'slopesafe',
        title: 'SlopeSafe',
        domain: 'slopesafe.ch',
        category: L('Lawinen-Plattform für Skigebiete', 'Avalanche platform for ski resorts'),
        stage: ['#173a6e', '#4f8ad4'],
        context: L('Eigenes Projekt', 'Side project'),
        summary: L(
            'Echtzeit-Lawinengefahrenstufen für Schweizer Skigebiete, mit interaktiver Karte, Wetterprognosen und offiziellen SLF-Daten.',
            'Real-time avalanche danger levels for Swiss ski resorts, with an interactive map, weather forecasts and official SLF data.',
        ),
        tagline: L(
            'Eine Plattform, die Echtzeit-Lawinengefahrenstufen für Schweizer Skigebiete liefert, mit interaktiver Karte, Wetterprognosen und offizieller SLF-Datenintegration.',
            'A platform delivering real-time avalanche danger levels for Swiss ski resorts, with an interactive map, weather forecasts and official SLF data integration.',
        ),
        year: same('2025/26'),
        role: L('Full-Stack & Design', 'Full-stack & design'),
        status: L('Offline', 'Offline'),
        statusTone: 'offline',
        stack: ['Vue 3', 'Node.js', 'Leaflet / MapLibre', 'SLF'],
        cover: { src: '/assets/slopesafe/Desktop_Map.png', alt: L('SlopeSafe: Karte mit Lawinengefahrenstufen', 'SlopeSafe: map with avalanche danger levels') },
        hero: { src: '/assets/slopesafe/phone_screens.png', alt: L('SlopeSafe auf dem Smartphone', 'SlopeSafe on a phone') },
        facts: [
            { label: L('Entwicklung', 'Development'), value: same('2025/26') },
            { label: L('Rolle', 'Role'), value: L('Full-Stack & Design', 'Full-stack & design') },
            { label: L('Stack', 'Stack'), value: same('Vue, Node.js') },
            { label: L('Status', 'Status'), value: L('Offline', 'Offline') },
        ],
        sections: [
            {
                heading: L('Warum SlopeSafe', 'Why SlopeSafe'),
                blocks: [
                    {
                        type: 'p',
                        html: L(
                            'Im Wallis zu leben heisst, neben Bergen zu leben, die es nicht verzeihen, wenn man sie unterschätzt. Lawinenbulletins gibt es, und das SLF veröffentlicht hervorragende Daten. Doch wer <em>vor dem Aufbruch die Gefahr prüfen</em> will, klickt sich durch PDFs, regionale Seiten und Apps, die jeweils nur einen Teil der Geschichte erzählen.',
                            'Living in Valais means living next to mountains that do not forgive being underestimated. Avalanche bulletins exist and the SLF publishes excellent data, but <em>checking the danger before you head out</em> means jumping between PDFs, regional sites and apps that each tell only part of the story.',
                        ),
                    },
                    {
                        type: 'p',
                        html: L(
                            '<strong>SlopeSafe</strong> bringt alles zusammen: eine Karte, eine Gefahrenstufe pro Gebiet und die zugrunde liegenden Wetter- und Bulletin-Daten nur einen Tap entfernt.',
                            '<strong>SlopeSafe</strong> brings it together: one map, one danger level per resort, with the underlying weather and bulletin data one tap away.',
                        ),
                    },
                ],
            },
            {
                heading: L('So funktioniert es', 'How it works'),
                blocks: [
                    {
                        type: 'list',
                        items: [
                            L('Bezieht Live-Lawinenbulletins aus dem offiziellen SLF-Feed', 'Pulls live avalanche bulletins from the official SLF feed'),
                            L('Verknüpft sie mit Wetterprognosen pro Gebiet', 'Joins them with per-resort weather forecasts'),
                            L('Zeigt das Ergebnis auf einer interaktiven Karte der ganzen Schweiz', 'Renders the result on an interactive map of all of Switzerland'),
                            L('Aktualisiert sich automatisch, ohne manuelles Neuladen', 'Updates automatically, no manual refresh'),
                        ],
                    },
                    {
                        type: 'quote',
                        text: L(
                            'Die richtige Zahl auf der richtigen Karte zur richtigen Zeit rettet mehr Leben als jedes Feature.',
                            'The right number on the right map at the right time saves more lives than any feature ever will.',
                        ),
                    },
                ],
            },
            {
                heading: L('Design', 'Design'),
                blocks: [
                    { type: 'h3', text: L('Farbe ist das Interface', 'Color is the interface') },
                    {
                        type: 'p',
                        html: L(
                            'Die europäische Lawinengefahrenskala reicht von 1 bis 5 und hat eine feste Farbpalette. SlopeSafe überschreibt diese Farben nie. Das ganze Interface ordnet sich ihnen unter, damit sich die Karte genau so liest wie ein gedrucktes Bulletin.',
                            'The European avalanche danger scale runs from 1 to 5 with a fixed color palette. SlopeSafe never overrides those colors. The whole UI orbits around them, so the map reads exactly like a printed bulletin.',
                        ),
                    },
                    { type: 'h3', text: L('Phone first', 'Phone first') },
                    {
                        type: 'p',
                        html: L(
                            'Die meisten Sessions finden um 7 Uhr morgens auf einem Parkplatz vor einer Tour statt. Deshalb kam das Smartphone-Layout zuerst, die Desktop-Ansicht danach. Touch-Ziele sind gross, die Karte steht im Zentrum, und alles andere ist mit einem Tap erreichbar.',
                            'Most sessions happen at 7 a.m. in a parking lot before a tour. So the phone layout came first and the desktop view second. Touch targets are big, the map is the hero, and everything else is one tap away.',
                        ),
                    },
                ],
            },
        ],
        aside: [
            { title: L('Stack', 'Stack'), items: [same('Vue 3'), same('Node.js'), same('Leaflet / MapLibre'), L('SLF-Datenfeed', 'SLF data feed')] },
            { title: L('Meine Rolle', 'My role'), items: [L('Konzept & UX', 'Concept & UX'), same('Frontend'), L('Backend & Datenintegration', 'Backend & data ingestion')] },
            {
                title: L('Links', 'Links'),
                items: [askMe('SlopeSafe')],
            },
        ],
        gallery: [
            { src: '/assets/slopesafe/Desktop_Map.png', caption: L('Desktop: Karte', 'Desktop: map') },
            { src: '/assets/slopesafe/Desktop_Info1.png', caption: L('Desktop: Warnungen', 'Desktop: warnings') },
            { src: '/assets/slopesafe/Desktop_Info2.png', caption: L('Desktop: Wetter', 'Desktop: weather') },
        ],
    },
    {
        slug: 'aiventure',
        title: 'AIVenture',
        domain: 'aiventure',
        category: L('KI-Spiel aus dem Silicon Valley', 'AI game built in Silicon Valley'),
        stage: ['#24195c', '#7c64ea'],
        context: L('Silicon Valley IT Talent Program', 'Silicon Valley IT Talent Program'),
        summary: L(
            'Ein tägliches Bildbeschreibungsspiel nach dem Vorbild von Wordle: Beschreibe ein KI-generiertes Bild in eigenen Worten und finde heraus, wie nah du am Original liegst.',
            'A daily image-description game inspired by Wordle: describe an AI-generated picture in your own words and see how close you land to the original.',
        ),
        tagline: L(
            'Ein kreatives tägliches Spiel, in dem Worte auf Bilder treffen: Je näher deine Beschreibung an der Interpretation der KI liegt, desto höher dein Score. Entstanden im Silicon Valley IT Talent Program.',
            'A creative daily game where words meet images: the closer your description gets to the AI’s interpretation, the higher your score. Built during the Silicon Valley IT Talent Program.',
        ),
        year: same('2025'),
        role: L('Frontend-Entwickler', 'Frontend developer'),
        status: L('Offline', 'Offline'),
        statusTone: 'offline',
        stack: ['React', 'Vite', 'Java', 'Gemini', 'GCP'],
        cover: { src: '/assets/aiventure/Startscreen.png', alt: L('AIVenture: Startbildschirm', 'AIVenture: start screen') },
        hero: { src: '/assets/aiventure/Startscreen.png', alt: L('AIVenture: Startbildschirm', 'AIVenture: start screen') },
        facts: [
            { label: L('Jahr', 'Year'), value: same('2025') },
            { label: L('Rolle', 'Role'), value: L('Frontend-Entwickler', 'Frontend developer') },
            { label: L('Programm', 'Programme'), value: same('IT Talent Program') },
            { label: L('Status', 'Status'), value: L('Offline', 'Offline') },
        ],
        sections: [
            {
                heading: L('Die Idee', 'The idea'),
                blocks: [
                    {
                        type: 'p',
                        html: L(
                            '<strong>AIVenture</strong> ist eine tägliche Bildbeschreibungs-Challenge nach dem Vorbild von <em>Wordle</em>. Statt ein Wort zu erraten, beschreibst du ein täglich neues, KI-generiertes Bild. Das Ziel: eine Beschreibung, die dem möglichst nahekommt, was die KI im Bild «sieht».',
                            '<strong>AIVenture</strong> is a daily image-description challenge inspired by <em>Wordle</em>. Instead of guessing a word, you describe a new AI-generated image every day. The goal: a description that matches what the AI “thinks” the image is about.',
                        ),
                    },
                    {
                        type: 'p',
                        html: L(
                            'Jeden Tag erscheint ein neues Bild. Du schreibst, was du siehst, und die KI bewertet, wie nah deine Worte an ihrer eigenen Interpretation liegen. Ein einfacher Ablauf mit endloser Vielfalt: jeden Morgen ein neues Ringen um die richtigen Worte.',
                            'Every day a new picture drops. You write what you see, and the AI scores how close your words land to its own interpretation. A simple loop with endless variety: a new vocabulary battle every morning.',
                        ),
                    },
                ],
            },
            {
                heading: L('Gebaut im Silicon Valley', 'Built in Silicon Valley'),
                blocks: [
                    {
                        type: 'p',
                        html: L(
                            'AIVenture entstand während des <strong>Silicon Valley IT Talent Program</strong> in San Francisco, einer Initiative, die ein ausgewähltes Team junger Schweizer Entwicklerinnen und Entwickler mitten in die globale Tech-Industrie bringt, um unter realen Bedingungen ein echtes Produkt zu bauen. Einige intensive Wochen lang lag unser Büro nur wenige Meilen von den Firmen entfernt, deren APIs wir nutzten. Die Zeitverschiebung war hart, die Feedback-Schleifen kurz.',
                            'AIVenture was built during the <strong>Silicon Valley IT Talent Program</strong> in San Francisco, an initiative that brings a hand-picked team of young Swiss developers into the heart of the global tech industry to build a real product under real-world conditions. For a few intense weeks our office was a few miles from the companies whose APIs we were using. The time difference was rough; the feedback loops were tight.',
                        ),
                    },
                    {
                        type: 'p',
                        html: L(
                            'Unser Sponsor und Mentor vor Ort war <a href="https://www.linkedin.com/in/ben-pietrzak-047a6192/" target="_blank" rel="noopener">Ben Pietrzak</a>. Seine Branchenerfahrung hat geprägt, wie wir den Umfang des Produkts festgelegt, Features priorisiert und über die User Experience nachgedacht haben. Aus einem schulischen Teamprojekt wurde so etwas, das einem echten Startup-Sprint sehr nahekam: radikale Scope-Entscheidungen, schnellere Beschlüsse und ein viel klareres Gefühl dafür, <em>wofür</em> dieses Spiel eigentlich da ist.',
                            'Our sponsor and on-site mentor was <a href="https://www.linkedin.com/in/ben-pietrzak-047a6192/" target="_blank" rel="noopener">Ben Pietrzak</a>, whose industry experience shaped how we scoped the product, prioritised features and thought about the user experience. It turned a school-style team project into something much closer to an actual startup sprint: brutal scope cuts, faster decisions and a much sharper sense of what this game is actually <em>for</em>.',
                        ),
                    },
                ],
            },
            {
                heading: L('So funktioniert es', 'How it works'),
                blocks: [
                    {
                        type: 'list',
                        items: [
                            L('Jeden Tag wird ein neues Bild generiert und veröffentlicht', 'A new image is generated and published every day'),
                            L('Spielerinnen und Spieler beschreiben es in eigenen Worten', 'Players describe it in their own words'),
                            L('Ein Gemini-gestütztes Backend vergleicht den Versuch mit der Bildinterpretation', 'A Gemini-powered backend compares the guess with the image’s interpretation'),
                            L('Der Score kommt in Echtzeit zurück: je näher die Worte, desto höher', 'The score comes back in real time: the closer the words, the higher it gets'),
                        ],
                    },
                    { type: 'quote', text: L('Worte malen Bilder, und Bilder inspirieren Worte.', 'Words paint pictures and pictures inspire words.') },
                ],
            },
            {
                heading: L('Was ich gebaut habe', 'What I built'),
                blocks: [
                    {
                        type: 'p',
                        html: L(
                            'Ich habe gemeinsam mit dem Team am Frontend gearbeitet. Das Interface muss aus einem einzigen Textfeld ein Spiel machen: direktes Feedback, eine verständliche Punktelogik und ein tägliches Ritual, das jeden Morgen gleich aussieht, damit daraus eine Gewohnheit wird. Alles dreht sich um ein Bild und ein Eingabefeld.',
                            'I worked on the frontend together with the rest of the team. The interface has to turn a single text input into a game: tight feedback, an obvious scoring loop and a daily ritual that looks the same every morning so players build the habit. Everything orbits around one image and one input field.',
                        ),
                    },
                ],
            },
            {
                heading: L('Infrastruktur', 'Infrastructure'),
                blocks: [
                    {
                        type: 'p',
                        html: L(
                            'Die gesamte Pipeline läuft auf der <strong>Google Cloud Platform</strong>. Der Build verpackt die App in einen Container und legt ihn in der GCP Container Registry ab. Das Deployment in die laufende Umgebung wird anschliessend manuell ausgelöst; diese stellt das Spiel unter einer eigenen Domain bereit.',
                            'The whole pipeline runs on <strong>Google Cloud Platform</strong>. The build packages the app into a container and pushes it to the GCP Container Registry. Deployment into the running environment is then triggered manually, which serves the game on a custom domain.',
                        ),
                    },
                ],
            },
        ],
        aside: [
            { title: L('Stack', 'Stack'), items: [same('React / Vite'), same('Java'), same('Gemini'), same('GCP (Cloud Run, Container Registry)')] },
            {
                title: L('Programm', 'Programme'),
                items: [
                    same('Silicon Valley IT Talent Program'),
                    same('Exchange Pro'),
                    same('San Francisco, CA'),
                    L(
                        'Sponsor: <a href="https://www.linkedin.com/in/ben-pietrzak-047a6192/" target="_blank" rel="noopener">Ben Pietrzak</a>',
                        'Sponsor: <a href="https://www.linkedin.com/in/ben-pietrzak-047a6192/" target="_blank" rel="noopener">Ben Pietrzak</a>',
                    ),
                ],
            },
            {
                title: L('Meine Rolle', 'My role'),
                items: [L('Frontend-Entwicklung', 'Frontend development'), L('UI für den täglichen Spielablauf', 'UI for the daily game loop'), L('Kleinere Teile des Backends', 'Smaller parts of the backend')],
            },
            {
                title: L('Team', 'Team'),
                items: [
                    L('Fabio L.: Lead, Front- & Backend', 'Fabio L.: Lead, front- & backend'),
                    L('Nevio W.: Frontend & Teile des Backends', 'Nevio W.: Frontend & parts of the backend'),
                    same('Valérie L.: Frontend'),
                    L('Dennis K.: KI & Bildvergleich', 'Dennis K.: AI & image comparison'),
                    L('Robin H.: KI & Google Cloud', 'Robin H.: AI & Google Cloud'),
                    same('Fabian B.: Backend & Google Cloud'),
                    same('Armando A.: Backend'),
                ],
            },
            { title: L('Links', 'Links'), items: [askMe('AIVenture')] },
        ],
        gallery: [
            { src: '/assets/aiventure/Startscreen.png', caption: L('Startbildschirm', 'Start screen') },
            { src: '/assets/aiventure/4Guesses.png', caption: L('Tägliche Versuche', 'Daily guesses') },
            { src: '/assets/aiventure/Submitted.png', caption: L('Versuch abgeschickt', 'Guess submitted') },
            { src: '/assets/aiventure/Leaderboard.png', caption: L('Bestenliste', 'Leaderboard') },
        ],
    },
];

/** The company Nevio is founding: a large panel after the projects. Set to null to hide it. */
export interface Venture {
    name: string;
    href: string;
    domain: string;
    claim: Localized;
    text: Localized;
    /** What the layers in the panel stand for (firn = snow that survived a summer). */
    note: Localized;
    facts: { label: Localized; value: Localized }[];
}

export const venture: Venture | null = {
    name: 'Firntech',
    href: 'https://firntech.ch/',
    domain: 'firntech.ch',
    claim: L('Wir bauen, was es geben sollte.', 'We build what should exist.'),
    text: L(
        'Firntech ist ein kleines Softwareunternehmen aus Brig, das ich mit zwei Mitgründern aufbaue. Unser erstes Produkt ist CoreFit, Software für Fitnessbetriebe und ihre Mitglieder.',
        'Firntech is a small software company from Brig that I’m building with two co-founders. Our first product is CoreFit, software for gyms and their members.',
    ),
    note: L('Firn ist Schnee, der einen Sommer überdauert hat.', 'Firn is snow that has survived a summer.'),
    facts: [
        { label: L('Rolle', 'Role'), value: L('Mitgründer, Web und UX', 'Co-founder, web and UX') },
        { label: L('Produkt', 'Product'), value: same('CoreFit') },
        { label: L('Status', 'Status'), value: L('In Gründung', 'Being founded') },
    ],
};

/** Projects with their own case study page (the others link out). */
export const caseStudies = projects.filter((p) => !p.link);

export const getProject = (slug: ProjectSlug) => caseStudies.find((p) => p.slug === slug)!;
export const nextProject = (slug: ProjectSlug) => caseStudies[(caseStudies.findIndex((p) => p.slug === slug) + 1) % caseStudies.length];
