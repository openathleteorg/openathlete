import type { BlogPost } from '../types';
import { ContentDe } from './de';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const article3: BlogPost = {
  metadata: {
    slug: 'preventing-training-injuries',
    title: {
      en: 'Running Injuries and Training Load: What the Evidence Says',
      fr: 'Blessures en course à pied et charge : ce que disent les études',
      es: 'Lesiones al correr y carga de entrenamiento: qué dice la ciencia',
      it: 'Infortuni nella corsa e carico: cosa dicono gli studi',
      'pt-br': 'Lesões na corrida e carga de treino: o que dizem os estudos',
      de: 'Laufverletzungen und Trainingsbelastung: Was die Studien sagen',
    },
    description: {
      en: 'What research shows about training load and running injuries, why the acute:chronic workload ratio is contested, and what is still worth tracking.',
      fr: 'Ce que la recherche dit du lien entre charge et blessures en course, pourquoi le ratio aigu/chronique est contesté, et ce qui reste utile à suivre.',
      es: 'Qué dice la investigación sobre carga y lesiones al correr, por qué se cuestiona el ratio agudo:crónico y qué sigue valiendo la pena vigilar.',
      it: 'Cosa dice la ricerca su carico e infortuni nella corsa, perché il rapporto acuto:cronico è contestato e cosa vale ancora la pena monitorare.',
      'pt-br':
        'O que a pesquisa mostra sobre carga e lesões na corrida, por que a relação aguda:crônica é contestada e o que ainda vale a pena acompanhar.',
      de: 'Was die Forschung über Trainingsbelastung und Laufverletzungen zeigt, warum die Acute:Chronic Workload Ratio umstritten ist und was sich trotzdem zu beobachten lohnt.',
    },
    excerpt: {
      en: 'Sudden jumps in training probably raise injury risk, especially for beginners. Beyond that, the evidence is thinner than most training apps suggest, and the ACWR thresholds are not established.',
      fr: 'Les hausses brutales d’entraînement augmentent probablement le risque de blessure, surtout chez les débutants. Au-delà, les preuves sont plus minces que ne le suggèrent les applications, et les seuils de l’ACWR ne sont pas établis.',
      es: 'Los saltos bruscos de entrenamiento probablemente aumentan el riesgo de lesión, sobre todo en principiantes. Más allá de eso, la evidencia es más escasa de lo que sugieren las apps, y los umbrales del ACWR no están demostrados.',
      it: 'I salti improvvisi di allenamento aumentano probabilmente il rischio di infortunio, soprattutto per i principianti. Oltre a questo, le prove sono più scarse di quanto suggeriscano le app, e le soglie dell’ACWR non sono dimostrate.',
      'pt-br':
        'Saltos bruscos no treino provavelmente aumentam o risco de lesão, principalmente para iniciantes. Fora isso, as evidências são mais fracas do que os apps sugerem, e os limites do ACWR não estão comprovados.',
      de: 'Plötzliche Sprünge im Training erhöhen wahrscheinlich das Verletzungsrisiko, vor allem bei Anfängern. Darüber hinaus ist die Studienlage dünner, als die meisten Trainings-Apps vermuten lassen, und die ACWR-Schwellenwerte sind nicht belegt.',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-01-25',
    updatedAt: '2026-11-03',
    tags: ['Running injuries', 'Training load', 'ACWR', 'Research'],
    readingTime: 6,
    image:
      'https://images.unsplash.com/photo-1727866241882-df87cd3aa9f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHxydW5uaW5nJTIwaW5qdXJ5JTIwcHJldmVudGlvbiUyMHN0cmVzcyUyMGZyYWN0dXJlJTIwd2FybmluZyUyMGFsZXJ0JTIwc3lzdGVtfGVufDB8MHx8fDE3NjUyODc0NTZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn,
  ContentFr,
  ContentEs,
  ContentIt,
  ContentPtBr,
  ContentDe,
};
