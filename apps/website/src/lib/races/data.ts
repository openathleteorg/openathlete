import type { Race } from './types';

/** Our marathon plans all last 16 weeks (`training-plans/specs.ts`). */
export const MARATHON_PLAN_WEEKS = 16;

const GPS = (slug: string) => ({
  label: 'marathon-index.com',
  url: `https://marathon-index.com/races/${slug}/course/`,
});

/**
 * Facts checked on 4 November 2026 against the organisers' sites (and, for
 * elevation marked `gainEstimate`, GPS data). Race names stay descriptive:
 * title sponsors change (Paris and Berlin in 2027) and are not ours to use.
 */
export const RACES: readonly Race[] = [
  {
    slug: 'marathon-de-paris',
    key: 'paris',
    kind: 'road',
    year: 2027,
    date: '2027-04-04',
    month: 4,
    distanceKm: 42.195,
    elevationText: true,
    officialUrl: 'https://www.asicsmarathondeparis.com/',
    sources: [
      {
        label: 'stadion-actu.fr',
        url: 'https://stadion-actu.fr/marathon-de-paris-2027-prix-tirage-au-sort-pour-les-dossards-nouveaux-parcours-stadion-vous-presente-les-grandes-nouveautes/',
      },
      {
        label: 'marathons.com',
        url: 'https://www.marathons.com/fr/save-the-date/marathon-de-paris-2026-analyse-detaillee-du-parcours_r17l',
      },
    ],
    place: { city: 'Paris', country: 'FR' },
  },
  {
    slug: 'maraton-de-sevilla',
    key: 'seville',
    kind: 'road',
    year: 2027,
    date: '2027-02-21',
    month: 2,
    distanceKm: 42.195,
    elevationText: true,
    officialUrl: 'https://www.zurichmaratonsevilla.es/',
    sources: [
      {
        label: 'Revista 2026 (PDF)',
        url: 'https://satutelagrid.blob.core.windows.net/web/files/zms-revista-2026.pdf',
      },
    ],
    place: { city: 'Sevilla', country: 'ES' },
  },
  {
    slug: 'maraton-de-barcelona',
    key: 'barcelona',
    kind: 'road',
    year: 2027,
    date: '2027-03-14',
    month: 3,
    distanceKm: 42.195,
    gainM: 280,
    gainEstimate: true,
    officialUrl: 'https://zurichmaratobarcelona.es/en/',
    sources: [
      {
        label: 'zurichmaratobarcelona.es/regulation',
        url: 'https://zurichmaratobarcelona.es/en/regulation/',
      },
      GPS('barcelona-marathon'),
    ],
    place: { city: 'Barcelona', country: 'ES' },
  },
  {
    slug: 'maratona-di-roma',
    key: 'rome',
    kind: 'road',
    year: 2027,
    date: '2027-03-14',
    month: 3,
    distanceKm: 42.195,
    gainM: 156,
    gainEstimate: true,
    officialUrl: 'https://www.runromethemarathon.com/',
    sources: [
      {
        label: 'Regolamento 2027 (PDF)',
        url: 'https://www.runromethemarathon.com/wp-content/uploads/2026/04/RRTM27-regolamento-inglese-23-4-2026.pdf',
      },
      GPS('rome-marathon'),
    ],
    place: { city: 'Roma', country: 'IT' },
  },
  {
    slug: 'milano-marathon',
    key: 'milan',
    kind: 'road',
    year: 2027,
    date: '2027-04-04',
    month: 4,
    distanceKm: 42.195,
    gainM: 45,
    gainEstimate: true,
    officialUrl: 'https://www.milanomarathon.it/',
    sources: [
      {
        label: 'milanomarathon.it/percorso',
        url: 'https://www.milanomarathon.it/percorso/',
      },
      GPS('milan-marathon'),
    ],
    place: { city: 'Milano', country: 'IT' },
  },
  {
    slug: 'london-marathon',
    key: 'london',
    kind: 'road',
    year: 2027,
    date: '2027-04-24',
    endDate: '2027-04-25',
    month: 4,
    distanceKm: 42.195,
    gainM: 57,
    gainEstimate: true,
    officialUrl:
      'https://www.londonmarathonevents.co.uk/london-marathon/course',
    sources: [
      {
        label: 'worldmarathonmajors.com',
        url: 'https://www.worldmarathonmajors.com/content-hub/tcs-london-marathon-will-expand-into-a-two-day-event-in-2027',
      },
      {
        label: 'londonmarathonevents.co.uk/faqs',
        url: 'https://www.londonmarathonevents.co.uk/london-marathon/faqs',
      },
      GPS('london-marathon'),
    ],
    place: { city: 'London', country: 'GB' },
  },
  {
    slug: 'berlin-marathon',
    key: 'berlin',
    kind: 'road',
    year: 2027,
    date: '2027-09-26',
    month: 9,
    distanceKm: 42.195,
    gainM: 58,
    gainEstimate: true,
    officialUrl: 'https://www.generali-berlin-marathon.com/en/',
    sources: [
      {
        label: 'generali-berlin-marathon.com/course',
        url: 'https://www.generali-berlin-marathon.com/en/race-weekend/course/',
      },
      GPS('berlin-marathon'),
    ],
    place: { city: 'Berlin', country: 'DE' },
  },
  {
    // The 2026 edition (6 December) is too close to prepare for: the page
    // targets 2027, whose date is not out yet
    slug: 'valencia-marathon',
    key: 'valencia',
    kind: 'road',
    year: 2027,
    month: 12,
    distanceKm: 42.195,
    gainM: 47,
    gainEstimate: true,
    officialUrl: 'https://www.valenciaciudaddelrunning.com/en/marathon/',
    sources: [GPS('valencia-marathon')],
    place: { city: 'Valencia', country: 'ES' },
  },
  {
    slug: 'maratona-do-rio',
    key: 'rio',
    kind: 'road',
    year: 2027,
    date: '2027-05-30',
    month: 5,
    distanceKm: 42.195,
    elevationText: true,
    officialUrl: 'https://www.maratonadorio.com.br/',
    sources: [
      {
        label: 'Regulamento 2027 (PDF)',
        url: 'https://maratonadorio.blob.core.windows.net/media/upload/corrida/09dccb077c9045418be8588b37bc5600.pdf',
      },
      {
        label: 'maratonadorio.com.br/42k-2026',
        url: 'https://www.maratonadorio.com.br/en/corrida/42k-2026',
      },
    ],
    place: { city: 'Rio de Janeiro', country: 'BR' },
  },
  {
    slug: 'saintelyon',
    key: 'saintelyon',
    kind: 'trail',
    year: 2026,
    date: '2026-11-28',
    endDate: '2026-11-29',
    month: 11,
    distanceKm: 80,
    gainM: 2500,
    officialUrl: 'https://www.saintelyon.com/',
    sources: [
      {
        label: 'saintelyon.com/80km',
        url: 'https://www.saintelyon.com/races/80km-saintelyon',
      },
      {
        label: 'u-trail.com',
        url: 'https://www2.u-trail.com/le-parcours-de-la-saintelyon-2026-sera-un-trace-renouvele-avec-un-denivele-plus-eleve/',
      },
    ],
    place: { city: 'Saint-Étienne', country: 'FR' },
  },
  {
    slug: 'utmb',
    key: 'utmb',
    kind: 'trail',
    year: 2027,
    month: 8,
    distanceKm: 174,
    gainM: 9700,
    officialUrl: 'https://montblanc.utmb.world/',
    sources: [
      {
        label: 'montblanc.utmb.world/races/UTMB',
        url: 'https://montblanc.utmb.world/races/UTMB',
      },
      {
        label: 'montblanc.utmb.world/mandatory-equipment',
        url: 'https://montblanc.utmb.world/races-runners/runners/mandatory-equipment',
      },
      {
        label: 'u-trail.com',
        url: 'https://www2.u-trail.com/pour-la-premiere-fois-depuis-sa-creation-lutmb-va-devoir-decaler-ses-dates-en-2027-a-cause-des-mondiaux-de-cyclisme/',
      },
    ],
    place: { city: 'Chamonix-Mont-Blanc', country: 'FR' },
  },
  {
    slug: 'diagonale-des-fous',
    key: 'diagonale',
    kind: 'trail',
    year: 2027,
    month: 10,
    distanceKm: 180,
    gainM: 10200,
    officialUrl: 'https://www.grandraid-reunion.com/',
    sources: [
      {
        label: 'grandraid-reunion.com/la-diagonale-des-fous',
        url: 'https://www.grandraid-reunion.com/les-courses/la-diagonale-des-fous',
      },
      {
        label: 'grandraid-reunion.com/reglement',
        url: 'https://www.grandraid-reunion.com/fr/inscriptions/reglement/',
      },
    ],
    place: { city: 'Saint-Pierre', country: 'RE' },
  },
];

export function raceBySlug(slug: string): Race | undefined {
  return RACES.find((race) => race.slug === slug);
}
