import type { BlogPost } from './types';

export const articleYouthTalentDetection: BlogPost = {
  metadata: {
    slug: 'detecting-talent-preventing-dropout-in-youth',
    title: {
      en: 'Detecting Talent & Preventing Dropout in Youth',
      fr: "Détecter le Talent & Prévenir l'Abandon chez les Jeunes",
    },
    description: {
      en: "Importance of monitoring RPE in young athletes who can't always articulate pain. Using data to protect young talent and prevent burnout.",
      fr: "Importance de surveiller le RPE chez les jeunes athlètes qui ne peuvent pas toujours articuler la douleur. Utiliser les données pour protéger le jeune talent et prévenir l'épuisement.",
    },
    excerpt: {
      en: "Young athletes often can't articulate when they're in pain or overtrained. RPE monitoring and data analysis help detect talent and prevent dropout.",
      fr: "Les jeunes athlètes ne peuvent souvent pas articuler quand ils ont mal ou sont en surentraînement. Le suivi RPE et l'analyse de données aident à détecter le talent et prévenir l'abandon.",
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-04-05',
    tags: [
      'Youth Training Load',
      'Talent Detection',
      'Young Athlete Burnout',
      'Youth Sports',
    ],
    readingTime: 7,
    image:
      'https://images.unsplash.com/photo-1646832916190-9e4c1770e604?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGF0aGxldGUlMjB0ZWVuYWdlciUyMHNwb3J0cyUyMHRhbGVudCUyMHBvdGVudGlhbCUyMGZ1dHVyZXxlbnwwfDB8fHwxNzY1Mjg3Mzc4fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn: () => {
    return (
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p>
          <strong>
            A 15-year-old runner shows promise. She's fast, dedicated,
            improving. But she can't tell you when she's in pain. She doesn't
            know what "overtrained" feels like. Three months later, she quits.
            You never saw it coming.
          </strong>
        </p>

        <p>
          This is the challenge with youth athletes: they often can't articulate
          what they're feeling. They push through pain because they don't know
          better. They don't recognize overtraining signals. They burn out
          before their talent can develop.
        </p>

        <h2>The Youth Athlete Challenge</h2>
        <p>Young athletes face unique challenges:</p>
        <ul>
          <li>
            <strong>Can't articulate pain:</strong> Don't know how to describe
            what they feel
          </li>
          <li>
            <strong>Want to please:</strong> Push through to avoid disappointing
            coaches/parents
          </li>
          <li>
            <strong>Don't recognize limits:</strong> Don't understand
            overtraining
          </li>
          <li>
            <strong>Rapid growth:</strong> Bodies changing, making load
            management complex
          </li>
          <li>
            <strong>Social pressure:</strong> Peers, parents, coaches all
            pushing
          </li>
        </ul>

        <p>
          Without data, coaches are flying blind. They can't see when a young
          athlete is heading toward burnout until it's too late.
        </p>

        <h2>The RPE Solution</h2>
        <p>RPE monitoring becomes critical with youth athletes because:</p>
        <ul>
          <li>
            <strong>Captures what they can't say:</strong> Elevated RPE shows
            fatigue even when they say "I'm fine"
          </li>
          <li>
            <strong>Detects patterns:</strong> Consistent high RPE indicates
            overreaching
          </li>
          <li>
            <strong>Prevents injury:</strong> Early intervention before problems
            become serious
          </li>
          <li>
            <strong>Protects talent:</strong> Keeps promising athletes healthy
            and progressing
          </li>
        </ul>

        <p>
          When a young athlete's RPE spikes while pace stays the same, that's a
          red flag. They might not be able to tell you they're tired, but the
          data shows it.
        </p>

        <h2>Talent Detection Through Data</h2>
        <p>Data analysis also helps identify talent:</p>
        <ul>
          <li>
            <strong>Rapid improvement:</strong> Athletes improving faster than
            peers
          </li>
          <li>
            <strong>Low RPE at high intensity:</strong> Natural efficiency
          </li>
          <li>
            <strong>Consistent performance:</strong> Reliable under pressure
          </li>
          <li>
            <strong>Quick recovery:</strong> Bouncing back faster
          </li>
        </ul>

        <p>
          These patterns, visible through data, help coaches identify athletes
          who might excel with proper development.
        </p>

        <h2>The Bottom Line</h2>
        <p>
          Youth athletes need protection. They can't always tell you when
          something's wrong, but data can. RPE monitoring, load tracking, and
          pattern analysis help coaches protect young talent and prevent
          dropout.
        </p>

        <p>
          <strong>Stop guessing, start training with AI today.</strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Sign up for OpenAthlete
          </a>{' '}
          and use data to protect young athletes, detect talent, and prevent
          burnout.
        </p>
      </div>
    );
  },
  ContentFr: () => {
    return (
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p>
          <strong>
            Une coureuse de 15 ans montre du potentiel. Elle est rapide,
            dévouée, s'améliore. Mais elle ne peut pas vous dire quand elle a
            mal. Elle ne sait pas ce que "surentraîné" ressemble. Trois mois
            plus tard, elle quitte. Vous ne l'avez jamais vu venir.
          </strong>
        </p>

        <p>
          C'est le défi avec les jeunes athlètes : ils ne peuvent souvent pas
          articuler ce qu'ils ressentent. Ils poussent à travers la douleur
          parce qu'ils ne savent pas mieux. Ils ne reconnaissent pas les signaux
          de surentraînement. Ils s'épuisent avant que leur talent ne puisse se
          développer.
        </p>

        <h2>Le Défi de l'Athlète Jeune</h2>
        <p>Les jeunes athlètes font face à des défis uniques :</p>
        <ul>
          <li>
            <strong>Ne peuvent pas articuler la douleur :</strong> Ne savent pas
            comment décrire ce qu'ils ressentent
          </li>
          <li>
            <strong>Veulent plaire :</strong> Poussent à travers pour éviter de
            décevoir les coachs/parents
          </li>
          <li>
            <strong>Ne reconnaissent pas les limites :</strong> Ne comprennent
            pas le surentraînement
          </li>
          <li>
            <strong>Croissance rapide :</strong> Corps changeant, rendant la
            gestion de charge complexe
          </li>
          <li>
            <strong>Pression sociale :</strong> Pairs, parents, coachs tous
            poussant
          </li>
        </ul>

        <p>
          Sans données, les coachs volent à l'aveugle. Ils ne peuvent pas voir
          quand un jeune athlète se dirige vers l'épuisement jusqu'à ce qu'il
          soit trop tard.
        </p>

        <h2>La Solution RPE</h2>
        <p>
          Le suivi RPE devient critique avec les jeunes athlètes parce que :
        </p>
        <ul>
          <li>
            <strong>Capture ce qu'ils ne peuvent pas dire :</strong> RPE élevé
            montre la fatigue même quand ils disent "Je vais bien"
          </li>
          <li>
            <strong>Détecte les modèles :</strong> RPE constamment élevé indique
            le surentraînement
          </li>
          <li>
            <strong>Prévient les blessures :</strong> Intervention précoce avant
            que les problèmes ne deviennent sérieux
          </li>
          <li>
            <strong>Protège le talent :</strong> Garde les athlètes prometteurs
            en bonne santé et progressant
          </li>
        </ul>

        <p>
          Quand le RPE d'un jeune athlète augmente alors que l'allure reste la
          même, c'est un signal d'alarme. Ils pourraient ne pas pouvoir vous
          dire qu'ils sont fatigués, mais les données le montrent.
        </p>

        <h2>Détection de Talent par les Données</h2>
        <p>L'analyse de données aide aussi à identifier le talent :</p>
        <ul>
          <li>
            <strong>Amélioration rapide :</strong> Athlètes s'améliorant plus
            vite que les pairs
          </li>
          <li>
            <strong>RPE faible à haute intensité :</strong> Efficacité naturelle
          </li>
          <li>
            <strong>Performance constante :</strong> Fiable sous pression
          </li>
          <li>
            <strong>Récupération rapide :</strong> Rebondissant plus vite
          </li>
        </ul>

        <p>
          Ces modèles, visibles à travers les données, aident les coachs à
          identifier les athlètes qui pourraient exceller avec un développement
          approprié.
        </p>

        <h2>En Résumé</h2>
        <p>
          Les jeunes athlètes ont besoin de protection. Ils ne peuvent pas
          toujours vous dire quand quelque chose ne va pas, mais les données
          peuvent. Le suivi RPE, le suivi de charge et l'analyse de modèles
          aident les coachs à protéger le jeune talent et prévenir l'abandon.
        </p>

        <p>
          <strong>
            Arrêtez de deviner, commencez à vous entraîner avec l'IA dès
            aujourd'hui.
          </strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Inscrivez-vous sur OpenAthlete
          </a>{' '}
          et utilisez les données pour protéger les jeunes athlètes, détecter le
          talent et prévenir l'épuisement.
        </p>
      </div>
    );
  },
};
