import type { BlogPost } from './types';

export const articleYouthTalentDetection: BlogPost = {
  metadata: {
    slug: 'detecting-talent-preventing-dropout-in-youth',
    title: {
      en: 'Detecting Talent & Preventing Dropout in Youth',
      fr: "Détecter le Talent & Prévenir l'Abandon chez les Jeunes",
      es: 'Detectar el talento y prevenir el abandono en jóvenes',
    },
    description: {
      en: "Young athletes rarely say when they're hurting. How RPE and simple load tracking reveal overreaching early, and which signs point to real talent.",
      fr: 'Les jeunes athlètes disent rarement quand ils ont mal. Le RPE et un suivi de charge révèlent tôt la surcharge, et certains signes trahissent un talent.',
      es: 'Los atletas jóvenes rara vez dicen cuándo les duele. El RPE y el control de la carga revelan pronto la sobrecarga, y algunas señales apuntan a talento.',
    },
    excerpt: {
      en: "Young athletes often can't articulate when they're in pain or overtrained. RPE monitoring and data analysis help detect talent and prevent dropout.",
      fr: "Les jeunes athlètes ne peuvent souvent pas articuler quand ils ont mal ou sont en surentraînement. Le suivi RPE et l'analyse de données aident à détecter le talent et prévenir l'abandon.",
      es: 'Los atletas jóvenes a menudo no saben expresar cuándo sienten dolor o están sobreentrenados. El seguimiento del RPE y el análisis de datos ayudan a detectar el talento y prevenir el abandono.',
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
      <div>
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
          and follow the RPE, reported pain and load of every young athlete you
          coach.
        </p>
      </div>
    );
  },
  ContentFr: () => {
    return (
      <div>
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
          et suivez le RPE, les douleurs signalées et la charge de chaque jeune
          athlète que vous entraînez.
        </p>
      </div>
    );
  },
  ContentEs: () => {
    return (
      <div>
        <p>
          <strong>
            Una corredora de 15 años promete mucho. Es rápida, constante y no
            para de mejorar. Pero no sabe decirte cuándo le duele algo. No sabe
            qué se siente al estar «sobreentrenada». Tres meses después, lo
            deja. Nunca lo viste venir.
          </strong>
        </p>

        <p>
          Este es el reto con los atletas jóvenes: a menudo no saben expresar lo
          que sienten. Siguen adelante a pesar del dolor porque no conocen otra
          cosa. No reconocen las señales del sobreentrenamiento. Se queman antes
          de que su talento pueda desarrollarse.
        </p>

        <h2>El reto de los atletas jóvenes</h2>
        <p>Los atletas jóvenes se enfrentan a retos específicos:</p>
        <ul>
          <li>
            <strong>No saben expresar el dolor:</strong> no saben describir lo
            que sienten
          </li>
          <li>
            <strong>Quieren agradar:</strong> aprietan los dientes para no
            decepcionar a entrenadores y padres
          </li>
          <li>
            <strong>No reconocen sus límites:</strong> no entienden qué es el
            sobreentrenamiento
          </li>
          <li>
            <strong>Crecimiento rápido:</strong> su cuerpo cambia, lo que
            complica la gestión de la carga
          </li>
          <li>
            <strong>Presión social:</strong> compañeros, padres y entrenadores
            los empujan
          </li>
        </ul>

        <p>
          Sin datos, los entrenadores van a ciegas. No ven que un atleta joven
          se dirige hacia el agotamiento hasta que ya es demasiado tarde.
        </p>

        <h2>La solución: el RPE</h2>
        <p>
          El seguimiento del RPE se vuelve fundamental con los atletas jóvenes
          porque:
        </p>
        <ul>
          <li>
            <strong>Recoge lo que no dicen:</strong> un RPE elevado revela la
            fatiga aunque digan «estoy bien»
          </li>
          <li>
            <strong>Detecta patrones:</strong> un RPE alto de forma constante
            indica una sobrecarga
          </li>
          <li>
            <strong>Previene lesiones:</strong> permite intervenir pronto, antes
            de que los problemas se agraven
          </li>
          <li>
            <strong>Protege el talento:</strong> mantiene a los atletas
            prometedores sanos y progresando
          </li>
        </ul>

        <p>
          Cuando el RPE de un atleta joven se dispara mientras su ritmo sigue
          igual, es una señal de alarma. Puede que no sepa decirte que está
          cansado, pero los datos lo muestran.
        </p>

        <h2>Detectar el talento con datos</h2>
        <p>El análisis de datos también ayuda a identificar el talento:</p>
        <ul>
          <li>
            <strong>Mejora rápida:</strong> atletas que progresan más deprisa
            que sus compañeros
          </li>
          <li>
            <strong>RPE bajo a alta intensidad:</strong> eficiencia natural
          </li>
          <li>
            <strong>Rendimiento constante:</strong> fiables bajo presión
          </li>
          <li>
            <strong>Recuperación rápida:</strong> se recuperan antes
          </li>
        </ul>

        <p>
          Estos patrones, visibles gracias a los datos, ayudan a los
          entrenadores a identificar a los atletas que podrían destacar con un
          desarrollo adecuado.
        </p>

        <h2>En resumen</h2>
        <p>
          Los atletas jóvenes necesitan protección. No siempre pueden decirte
          cuándo algo va mal, pero los datos sí. El seguimiento del RPE, el
          control de la carga y el análisis de patrones ayudan a los
          entrenadores a proteger el talento joven y a prevenir el abandono.
        </p>

        <p>
          <strong>Deja de adivinar y empieza hoy a entrenar con IA.</strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Regístrate en OpenAthlete
          </a>{' '}
          y sigue el RPE, los dolores reportados y la carga de cada atleta joven
          que entrenas.
        </p>
      </div>
    );
  },
};
