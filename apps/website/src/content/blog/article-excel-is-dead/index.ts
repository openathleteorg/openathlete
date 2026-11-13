import type { BlogPost } from '../types';
import { ContentDe } from './de';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const articleExcelIsDead: BlogPost = {
  metadata: {
    // The slug predates the rewrite and stays for the indexed URL
    slug: 'excel-is-dead-why-static-spreadsheets-hold-your-athletes-back',
    title: {
      en: 'Coaching from a spreadsheet: what it costs and when to move on',
      fr: 'Entraîner avec un tableur Excel\u00a0: ce que ça coûte vraiment',
      es: 'Entrenar con una hoja de Excel: lo que cuesta y cuándo cambiar',
      it: 'Allenare con un foglio Excel: quanto costa e quando cambiare',
      'pt-br': 'Assessoria na planilha de Excel: quanto custa e quando mudar',
      de: 'Coaching mit Excel: was es kostet und wann du wechseln solltest',
    },
    description: {
      en: 'Where a coaching spreadsheet works, where it starts to cost, how to track load in one with session RPE, and when software is worth it.',
      fr: 'Là où un tableur de coaching fonctionne, là où il coûte, comment y suivre la charge avec le RPE de séance, et quand passer à un logiciel.',
      es: 'Dónde funciona una hoja de cálculo para entrenar, dónde empieza a costar, cómo medir la carga con el RPE de sesión y cuándo cambiar.',
      it: 'Dove funziona un foglio di calcolo per allenare, dove comincia a costare, come misurare il carico con l’RPE di seduta e quando cambiare.',
      'pt-br':
        'Onde a planilha de treino funciona, onde começa a custar, como medir a carga com o RPE da sessão e quando vale trocar por um software.',
      de: 'Wo eine Trainingstabelle funktioniert, wo sie Aufwand kostet, wie du darin die Belastung mit Session-RPE erfasst und wann sich Software lohnt.',
    },
    excerpt: {
      en: 'Spreadsheets are fine for a few athletes. The costs show up in retyped workouts, copied results and plans that change. How to do it well, and when to stop.',
      fr: 'Un tableur suffit pour quelques athlètes. Les coûts apparaissent avec les séances recopiées, les résultats ressaisis et les plans qui bougent. Bien le faire, et savoir quand arrêter.',
      es: 'Una hoja de cálculo basta para pocos atletas. Los costes aparecen con sesiones copiadas a mano, resultados tecleados y planes que cambian. Cómo hacerlo bien y cuándo dejarlo.',
      it: 'Un foglio di calcolo basta per pochi atleti. I costi arrivano con sedute ricopiate, risultati trascritti e piani che cambiano. Come farlo bene e quando smettere.',
      'pt-br':
        'A planilha resolve para poucos atletas. Os custos aparecem com treinos redigitados, resultados copiados e planos que mudam. Como fazer direito e quando parar.',
      de: 'Für ein paar Athleten reicht eine Tabelle. Die Kosten zeigen sich bei abgetippten Workouts, kopierten Ergebnissen und Plänen, die sich ändern. Wie es gut geht und wann Schluss ist.',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-02-20',
    updatedAt: '2026-11-03',
    tags: ['Coaching', 'Spreadsheets', 'Session RPE', 'Coaching software'],
    readingTime: 4,
    image:
      'https://images.unsplash.com/photo-1606327054581-899eb5e6d1dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHxjb2FjaCUyMHNwcmVhZHNoZWV0JTIwZXhjZWwlMjBjZWxscyUyMGRhdGElMjBlbnRyeSUyMG1hbnVhbCUyMHdvcmt8ZW58MHwwfHx8MTc2NTI4NzM3OXww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn,
  ContentFr,
  ContentEs,
  ContentIt,
  ContentPtBr,
  ContentDe,
};
