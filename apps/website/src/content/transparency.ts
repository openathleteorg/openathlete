import type { SupportedLocale } from '@/utils/locales';

/**
 * Figures of the transparency page that are kept by hand. The revenue and
 * the funding thresholds are not here: they stay in the API's environment,
 * which publishes only a percentage per tier.
 */

export type CostCategory = 'servers' | 'tools' | 'ai';

export interface MonthlyCost {
  /** Who is paid: a brand stays as is, anything else is translated */
  name: string | Localized;
  category: CostCategory;
  /** Euros per month, VAT included; a yearly bill counts for a twelfth */
  eur: number;
}

/** Day the costs below were last checked against the invoices. */
export const COSTS_UPDATED_ON = '2026-11-18';

// EXAMPLE AMOUNTS: replace them with the real invoices before publishing
export const MONTHLY_COSTS: readonly MonthlyCost[] = [
  { name: 'OVHcloud', category: 'servers', eur: 38 },
  { name: 'Cloudflare R2', category: 'servers', eur: 5 },
  { name: 'Vercel', category: 'servers', eur: 20 },
  { name: 'Brevo', category: 'tools', eur: 9 },
  { name: 'Apple Developer Program', category: 'tools', eur: 8.5 },
  {
    name: {
      en: 'Domain name (OVHcloud)',
      fr: 'Nom de domaine (OVHcloud)',
      it: 'Nome di dominio (OVHcloud)',
      es: 'Nombre de dominio (OVHcloud)',
      'pt-br': 'Nome de domínio (OVHcloud)',
      de: 'Domainname (OVHcloud)',
      pl: 'Nazwa domeny (OVHcloud)',
      nl: 'Domeinnaam (OVHcloud)',
    },
    category: 'tools',
    eur: 1,
  },
  { name: 'OpenAI', category: 'ai', eur: 20 },
  { name: 'Anthropic', category: 'ai', eur: 15 },
];

/**
 * People who have contributed code, shown when GitHub cannot be reached
 * (rate limit, build without network). Bots are not counted.
 */
export const CONTRIBUTORS_FALLBACK = 18;

type Localized = { en: string; fr: string } & Partial<
  Record<Exclude<SupportedLocale, 'en' | 'fr'>, string>
>;

export interface ShippedItem {
  /** Day it reached the hosted instance */
  date: string;
  /** English and French at least; other languages fall back to English */
  title: Localized;
  /** A page of the site (without locale) or a full URL */
  href: string;
}

/**
 * What the Supporters have paid for, newest first. Add a line when a
 * feature ships: the page shows the latest six.
 */
export const SHIPPED: readonly ShippedItem[] = [
  {
    date: '2026-11-18',
    title: {
      en: 'Questionnaires coaches send to their athletes',
      fr: 'Les questionnaires que les coachs envoient à leurs athlètes',
      it: 'I questionari che i coach inviano ai loro atleti',
      es: 'Los cuestionarios que los entrenadores envían a sus atletas',
      'pt-br': 'Os questionários que os treinadores enviam aos atletas',
      de: 'Fragebögen, die Coaches ihren Athleten schicken',
      pl: 'Ankiety, które trenerzy wysyłają swoim zawodnikom',
      nl: 'Vragenlijsten die coaches naar hun atleten sturen',
    },
    href: '/features/athlete-questionnaires',
  },
  {
    date: '2026-11-17',
    title: {
      en: 'The iPhone app, on the App Store',
      fr: "L'app iPhone, sur l'App Store",
      it: "L'app per iPhone, sull'App Store",
      es: 'La app para iPhone, en la App Store',
      'pt-br': 'O app para iPhone, na App Store',
      de: 'Die iPhone-App, im App Store',
      pl: "Aplikacja na iPhone'a w App Store",
      nl: 'De iPhone-app, in de App Store',
    },
    href: '/mobile',
  },
  {
    date: '2026-11-17',
    title: {
      en: 'GPX download of every activity',
      fr: 'Le téléchargement GPX de chaque activité',
      it: 'Il download GPX di ogni attività',
      es: 'La descarga GPX de cada actividad',
      'pt-br': 'O download em GPX de cada atividade',
      de: 'GPX-Download für jede Aktivität',
      pl: 'Pobieranie GPX każdej aktywności',
      nl: 'GPX-download van elke activiteit',
    },
    href: '/features',
  },
  {
    date: '2026-11-16',
    title: {
      en: 'Running and cycling FTP modelled from your recent power',
      fr: 'La FTP course et vélo calculée à partir de votre puissance récente',
      it: 'La FTP di corsa e bici calcolata dalla potenza recente',
      es: 'El FTP de carrera y ciclismo calculado a partir de tu potencia reciente',
      'pt-br':
        'O FTP de corrida e ciclismo calculado a partir da sua potência recente',
      de: 'Lauf- und Rad-FTP aus deiner aktuellen Leistung berechnet',
      pl: 'FTP w bieganiu i kolarstwie wyliczane z Twojej ostatniej mocy',
      nl: 'FTP voor hardlopen en fietsen berekend uit je recente vermogen',
    },
    href: '/features/training-load',
  },
  {
    date: '2026-11-13',
    title: {
      en: 'Clubs: groups, shared library and club sessions',
      fr: 'Les clubs : groupes, bibliothèque partagée et séances de club',
      it: 'I club: gruppi, libreria condivisa e sessioni di club',
      es: 'Los clubes: grupos, biblioteca compartida y sesiones de club',
      'pt-br': 'Os clubes: grupos, biblioteca compartilhada e treinos do clube',
      de: 'Vereine: Gruppen, gemeinsame Bibliothek und Vereinseinheiten',
      pl: 'Kluby: grupy, wspólna biblioteka i treningi klubowe',
      nl: 'Clubs: groepen, gedeelde bibliotheek en clubtrainingen',
    },
    href: '/clubs',
  },
  {
    date: '2026-11-13',
    title: {
      en: 'A coach dashboard built for thirty athletes and more',
      fr: 'Un tableau de bord coach pensé pour trente athlètes et plus',
      it: 'Una dashboard per coach pensata per trenta atleti e oltre',
      es: 'Un panel de entrenador pensado para treinta atletas o más',
      'pt-br': 'Um painel de treinador feito para trinta atletas ou mais',
      de: 'Ein Coach-Dashboard für dreißig Athleten und mehr',
      pl: 'Panel trenera stworzony dla trzydziestu i więcej zawodników',
      nl: 'Een coachdashboard voor dertig atleten en meer',
    },
    href: '/coaches',
  },
  {
    date: '2026-11-17',
    title: {
      en: 'Weekly intensity distribution in hours',
      fr: "La répartition de l'intensité de la semaine en heures",
      it: "La distribuzione dell'intensità della settimana in ore",
      es: 'La distribución de la intensidad semanal en horas',
      'pt-br': 'A distribuição de intensidade da semana em horas',
      de: 'Die Intensitätsverteilung der Woche in Stunden',
      pl: 'Rozkład intensywności tygodnia w godzinach',
      nl: 'De intensiteitsverdeling van de week in uren',
    },
    href: '/features/training-load',
  },
];

export function costName(cost: MonthlyCost, locale: SupportedLocale) {
  return typeof cost.name === 'string'
    ? cost.name
    : (cost.name[locale] ?? cost.name.en);
}

export function shippedTitle(item: ShippedItem, locale: SupportedLocale) {
  return item.title[locale] ?? item.title.en;
}
