import type { BlogPost } from '../types';
import { ContentDe } from './de';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const articleYouthTalentDetection: BlogPost = {
  metadata: {
    slug: 'detecting-talent-preventing-dropout-in-youth',
    title: {
      en: 'Young endurance athletes: talent, burnout and dropout',
      fr: "Jeunes athlètes d'endurance : talent, surcharge et abandon",
      es: 'Jóvenes atletas de resistencia: talento, sobrecarga y abandono',
      it: 'Giovani atleti di endurance: talento, sovraccarico e abbandono',
      'pt-br': 'Jovens atletas de endurance: talento, sobrecarga e abandono',
      de: 'Junge Ausdauersportler: Talent, Überlastung und Dropout',
    },
    description: {
      en: 'Relative age, early maturation and early specialisation: what research says about youth talent, and how club coaches can track load and avoid dropout.',
      fr: 'Âge relatif, maturation précoce, spécialisation : ce que dit la recherche sur le talent des jeunes, et comment suivre leur charge sans les perdre.',
      es: 'Edad relativa, maduración y especialización temprana: qué dice la investigación sobre el talento joven y cómo evitar el abandono en el club.',
      it: "Età relativa, maturazione e specializzazione precoce: cosa dice la ricerca sul talento giovanile e come evitare l'abbandono in società.",
      'pt-br':
        'Idade relativa, maturação e especialização precoce: o que a pesquisa diz sobre talento jovem e como evitar o abandono no clube.',
      de: 'Relativer Alterseffekt, frühe Reife und Spezialisierung: Was die Forschung über Nachwuchstalente sagt und wie Vereinstrainer Dropout vermeiden.',
    },
    excerpt: {
      en: 'Early results predict adult performance poorly. What the research on relative age and specialisation means for a coach working with teenagers.',
      fr: "Les résultats précoces prédisent mal le niveau adulte. Ce que la recherche sur l'âge relatif et la spécialisation change pour un entraîneur d'adolescents.",
      es: 'Los resultados tempranos predicen mal el rendimiento adulto. Qué implica la investigación sobre edad relativa y especialización para quien entrena a adolescentes.',
      it: 'I risultati precoci dicono poco sulla prestazione da adulti. Cosa significa la ricerca su età relativa e specializzazione per chi allena adolescenti.',
      'pt-br':
        'Resultados precoces dizem pouco sobre o desempenho adulto. O que a pesquisa sobre idade relativa e especialização significa para quem treina adolescentes.',
      de: 'Frühe Ergebnisse sagen die Leistung im Erwachsenenalter schlecht voraus. Was die Forschung zum relativen Alterseffekt und zur Spezialisierung für Trainer von Jugendlichen bedeutet.',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-04-05',
    updatedAt: '2026-11-03',
    tags: ['Youth athletes', 'Talent', 'Training load', 'Clubs'],
    readingTime: 5,
    image:
      'https://images.unsplash.com/photo-1646832916190-9e4c1770e604?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGF0aGxldGUlMjB0ZWVuYWdlciUyMHNwb3J0cyUyMHRhbGVudCUyMHBvdGVudGlhbCUyMGZ1dHVyZXxlbnwwfDB8fHwxNzY1Mjg3Mzc4fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn,
  ContentFr,
  ContentEs,
  ContentIt,
  ContentPtBr,
  ContentDe,
};
