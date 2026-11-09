import type { BlogPost } from '../types';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const article2: BlogPost = {
  metadata: {
    slug: 'ai-in-endurance-training',
    title: {
      en: "AI in endurance training: what it can and can't do",
      fr: "IA et entraînement d'endurance : ce qu'elle peut faire ou non",
      es: 'IA y entrenamiento de resistencia: lo que puede y no puede hacer',
      it: "L'IA nell'allenamento di endurance: cosa può fare e cosa no",
      'pt-br': 'IA no treino de endurance: o que ela faz e o que não faz',
    },
    description: {
      en: 'Load models, injury prediction, HRV and ChatGPT training plans: what the research says AI can and cannot do for endurance athletes today.',
      fr: "Modèles de charge, prédiction des blessures, VFC, plans écrits par ChatGPT : ce que la recherche dit des capacités réelles de l'IA en endurance.",
      es: 'Modelos de carga, predicción de lesiones, VFC y planes de ChatGPT: lo que dice la investigación sobre lo que la IA puede hacer hoy en resistencia.',
      it: "Modelli di carico, previsione degli infortuni, HRV e piani di ChatGPT: cosa dice la ricerca su ciò che l'IA può fare oggi per l'endurance.",
      'pt-br':
        'Modelos de carga, previsão de lesões, VFC e planilhas do ChatGPT: o que a pesquisa diz sobre o que a IA consegue fazer hoje no endurance.',
    },
    excerpt: {
      en: 'Much of what is sold as AI is arithmetic, injury prediction is weak, and language models are best at text work. A sourced look at where AI helps.',
      fr: "Beaucoup de ce qu'on vend comme de l'IA n'est que du calcul, la prédiction des blessures reste faible et les modèles de langage excellent surtout sur le texte. Un tour d'horizon sourcé.",
      es: 'Mucho de lo que se vende como IA es aritmética, la predicción de lesiones es débil y los modelos de lenguaje brillan con el texto. Un repaso con fuentes.',
      it: 'Molto di ciò che si vende come IA è aritmetica, la previsione degli infortuni è debole e i modelli linguistici rendono meglio sul testo. Una panoramica con le fonti.',
      'pt-br':
        'Muito do que se vende como IA é aritmética, a previsão de lesões é fraca e os modelos de linguagem rendem mais com texto. Um panorama com fontes.',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-01-20',
    updatedAt: '2026-11-03',
    tags: ['AI', 'Sports science', 'Training load', 'HRV'],
    readingTime: 5,
    image:
      'https://images.unsplash.com/photo-1686061593213-98dad7c599b9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwzfHx0cmFpbmluZyUyMG1ldHJpY3MlMjBkYXRhJTIwYW5hbHlzaXMlMjBjaGFydHMlMjBncmFwaHMlMjBwZXJmb3JtYW5jZXxlbnwwfDB8fHwxNzY1Mjg3MzgwfDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn,
  ContentFr,
  ContentEs,
  ContentIt,
  ContentPtBr,
};
