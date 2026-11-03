import type { BlogPost } from '../types';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const articleRpeVsHr: BlogPost = {
  metadata: {
    slug: 'rpe-vs-heart-rate-why-your-heart-doesnt-tell-the-whole-story',
    title: {
      en: 'RPE vs Heart Rate: What Each Tells You About a Run',
      fr: 'RPE ou fréquence cardiaque : ce que chacun dit de votre séance',
      es: 'RPE o frecuencia cardíaca: qué te dice cada uno de tu sesión',
      it: 'RPE o frequenza cardiaca: cosa ti dice ciascuno della sessione',
      'pt-br': 'RPE ou frequência cardíaca: o que cada um diz do seu treino',
    },
    description: {
      en: 'Heart rate and RPE both measure internal load, and they often disagree. What skews each one, and how to read the gap between them.',
      fr: "Fréquence cardiaque et RPE mesurent la charge interne et divergent souvent. Ce qui fausse chacun, et comment lire l'écart entre les deux.",
      es: 'La frecuencia cardíaca y el RPE miden la carga interna y a menudo discrepan. Qué altera cada uno y cómo leer la diferencia.',
      it: 'Frequenza cardiaca e RPE misurano il carico interno e spesso non concordano. Cosa falsa ciascuno e come leggere la differenza.',
      'pt-br':
        'Frequência cardíaca e RPE medem a carga interna e muitas vezes discordam. O que distorce cada um e como ler a diferença.',
    },
    excerpt: {
      en: 'Same pace, same heart rate, a very different effort. Why heart rate and perceived exertion part ways, and which to trust for each kind of session.',
      fr: 'Même allure, même cardio, un effort très différent. Pourquoi fréquence cardiaque et effort perçu divergent, et auquel se fier selon la séance.',
      es: 'Mismo ritmo, mismo pulso y un esfuerzo muy distinto. Por qué la frecuencia cardíaca y el esfuerzo percibido se separan, y en cuál confiar según la sesión.',
      it: 'Stesso passo, stesso cardio, uno sforzo molto diverso. Perché frequenza cardiaca e sforzo percepito si separano, e di quale fidarsi in ogni sessione.',
      'pt-br':
        'Mesmo pace, mesma frequência cardíaca, um esforço bem diferente. Por que frequência cardíaca e percepção de esforço se separam, e em qual confiar em cada treino.',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-02-01',
    updatedAt: '2026-11-03',
    tags: ['RPE', 'Heart rate', 'Training load', 'Sports science'],
    readingTime: 4,
    image:
      'https://images.unsplash.com/photo-1685122089835-929f7582da91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHxoZWFydCUyMHJhdGUlMjBtb25pdG9yJTIwd2F0Y2glMjB2cyUyMHBlcmNlaXZlZCUyMGV4ZXJ0aW9uJTIwcnVubmluZyUyMGF0aGxldGUlMjBjb21wYXJpc29ufGVufDB8MHx8fDE3NjUyODczNzV8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn,
  ContentFr,
  ContentEs,
  ContentIt,
  ContentPtBr,
};
