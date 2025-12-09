import type { BlogPost } from './types';

export const articleOvertrainingSigns: BlogPost = {
  metadata: {
    slug: '5-signs-of-overtraining-and-how-to-avoid-it',
    title: {
      en: '5 Signs of Overtraining (and How to Avoid It)',
      fr: "5 Signes de Surentraînement (et Comment l'Éviter)",
    },
    description: {
      en: 'Classic list: mood, sleep, performance. Solution: Continuous monitoring via OpenAthlete as a safeguard.',
      fr: 'Liste classique : humeur, sommeil, performance. Solution : Surveillance continue via OpenAthlete comme sauvegarde.',
    },
    excerpt: {
      en: 'Learn the 5 key signs of overtraining: mood changes, sleep disruption, performance decline, elevated RPE, and persistent fatigue. Discover how continuous monitoring prevents it.',
      fr: "Apprenez les 5 signes clés du surentraînement : changements d'humeur, perturbation du sommeil, déclin de performance, RPE élevé et fatigue persistante. Découvrez comment la surveillance continue le prévient.",
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-05-05',
    tags: [
      'Overtraining Symptoms',
      'Chronic Fatigue Sport',
      'Recovery',
      'Training Load',
    ],
    readingTime: 8,
    image:
      'https://images.unsplash.com/photo-1615934679271-1810698dfdfb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHxvdmVydHJhaW5pbmclMjBmYXRpZ3VlJTIwZXhoYXVzdGlvbiUyMHJlY292ZXJ5JTIwcmVzdCUyMGF0aGxldGUlMjB0aXJlZHxlbnwwfDB8fHwxNzY1Mjg3Mzc5fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn: () => {
    return (
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p>
          <strong>
            You're training hard. You're pushing your limits. You're making
            progress. Then, suddenly, you're not. Performance drops. Mood sours.
            Sleep suffers. You're overtrained, and you didn't see it coming.
          </strong>
        </p>

        <p>
          Overtraining is insidious. It creeps up gradually, then hits suddenly.
          By the time you recognize it, you've already lost weeks of progress.
          But it's preventable—if you know what to look for.
        </p>

        <h2>The 5 Key Signs</h2>
        <p>
          <strong>1. Mood Changes</strong>
        </p>
        <p>Overtraining affects your central nervous system, leading to:</p>
        <ul>
          <li>Irritability</li>
          <li>Depression</li>
          <li>Loss of motivation</li>
          <li>Anxiety</li>
        </ul>

        <p>
          <strong>2. Sleep Disruption</strong>
        </p>
        <p>Overtraining disrupts sleep patterns:</p>
        <ul>
          <li>Difficulty falling asleep</li>
          <li>Frequent waking</li>
          <li>Poor sleep quality</li>
          <li>Feeling unrested despite sleep</li>
        </ul>

        <p>
          <strong>3. Performance Decline</strong>
        </p>
        <p>Despite training hard, performance decreases:</p>
        <ul>
          <li>Can't hit target paces</li>
          <li>Power output drops</li>
          <li>Heart rate doesn't respond normally</li>
          <li>Recovery between sessions slows</li>
        </ul>

        <p>
          <strong>4. Elevated RPE</strong>
        </p>
        <p>Sessions feel harder than they should:</p>
        <ul>
          <li>Same pace feels much harder</li>
          <li>RPE consistently 2-3 points higher</li>
          <li>Heavy legs from the start</li>
          <li>Struggling with easy sessions</li>
        </ul>

        <p>
          <strong>5. Persistent Fatigue</strong>
        </p>
        <p>Fatigue that doesn't resolve with rest:</p>
        <ul>
          <li>Feeling tired all the time</li>
          <li>Not recovering between sessions</li>
          <li>Needing more rest days</li>
          <li>General lack of energy</li>
        </ul>

        <h2>How to Prevent Overtraining</h2>
        <p>
          Prevention is better than cure. OpenAthlete prevents overtraining
          through:
        </p>
        <ul>
          <li>
            <strong>ACWR monitoring:</strong> Alerts when load spikes
          </li>
          <li>
            <strong>RPE tracking:</strong> Detects elevated effort patterns
          </li>
          <li>
            <strong>Recovery analysis:</strong> Monitors sleep and stress
          </li>
          <li>
            <strong>Automatic adjustments:</strong> Reduces load when risks
            detected
          </li>
          <li>
            <strong>Proactive alerts:</strong> Warns before problems occur
          </li>
        </ul>

        <h2>The Bottom Line</h2>
        <p>
          Overtraining is preventable. Know the signs. Monitor your data. Use AI
          to detect patterns early. Don't wait until it's too late.
        </p>

        <p>
          <strong>Stop guessing, start training with AI today.</strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Sign up for OpenAthlete
          </a>{' '}
          and let continuous monitoring prevent overtraining before it derails
          your progress.
        </p>
      </div>
    );
  },
  ContentFr: () => {
    return (
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p>
          <strong>
            Vous vous entraînez dur. Vous poussez vos limites. Vous progressez.
            Puis, soudainement, vous ne progressez plus. Les performances
            chutent. L'humeur s'assombrit. Le sommeil souffre. Vous êtes en
            surentraînement, et vous ne l'avez pas vu venir.
          </strong>
        </p>

        <p>
          Le surentraînement est insidieux. Il s'infiltre progressivement, puis
          frappe soudainement. Au moment où vous le reconnaissez, vous avez déjà
          perdu des semaines de progrès. Mais c'est évitable—si vous savez quoi
          chercher.
        </p>

        <h2>Les 5 Signes Clés</h2>
        <p>
          <strong>1. Changements d'Humeur</strong>
        </p>
        <p>
          Le surentraînement affecte votre système nerveux central, conduisant à
          :
        </p>
        <ul>
          <li>Irritabilité</li>
          <li>Dépression</li>
          <li>Perte de motivation</li>
          <li>Anxiété</li>
        </ul>

        <p>
          <strong>2. Perturbation du Sommeil</strong>
        </p>
        <p>Le surentraînement perturbe les modèles de sommeil :</p>
        <ul>
          <li>Difficulté à s'endormir</li>
          <li>Réveils fréquents</li>
          <li>Mauvaise qualité de sommeil</li>
          <li>Se sentir non reposé malgré le sommeil</li>
        </ul>

        <p>
          <strong>3. Déclin de Performance</strong>
        </p>
        <p>Malgré l'entraînement dur, les performances diminuent :</p>
        <ul>
          <li>Ne peut pas atteindre les allures cibles</li>
          <li>Puissance de sortie chute</li>
          <li>Fréquence cardiaque ne répond pas normalement</li>
          <li>Récupération entre séances ralentit</li>
        </ul>

        <p>
          <strong>4. RPE Élevé</strong>
        </p>
        <p>Les séances semblent plus dures qu'elles ne devraient :</p>
        <ul>
          <li>Même allure semble beaucoup plus dure</li>
          <li>RPE constamment 2-3 points plus élevé</li>
          <li>Jambes lourdes dès le départ</li>
          <li>Lutte avec les séances faciles</li>
        </ul>

        <p>
          <strong>5. Fatigue Persistante</strong>
        </p>
        <p>Fatigue qui ne se résout pas avec le repos :</p>
        <ul>
          <li>Se sentir fatigué tout le temps</li>
          <li>Ne pas récupérer entre séances</li>
          <li>Avoir besoin de plus de jours de repos</li>
          <li>Manque général d'énergie</li>
        </ul>

        <h2>Comment Prévenir le Surentraînement</h2>
        <p>
          La prévention est meilleure que la guérison. OpenAthlete prévient le
          surentraînement à travers :
        </p>
        <ul>
          <li>
            <strong>Surveillance ACWR :</strong> Alertes quand la charge
            augmente
          </li>
          <li>
            <strong>Suivi RPE :</strong> Détecte les modèles d'effort élevé
          </li>
          <li>
            <strong>Analyse de récupération :</strong> Surveille sommeil et
            stress
          </li>
          <li>
            <strong>Ajustements automatiques :</strong> Réduit la charge quand
            risques détectés
          </li>
          <li>
            <strong>Alertes proactives :</strong> Avertit avant que les
            problèmes ne surviennent
          </li>
        </ul>

        <h2>En Résumé</h2>
        <p>
          Le surentraînement est évitable. Connaissez les signes. Surveillez vos
          données. Utilisez l'IA pour détecter les modèles tôt. N'attendez pas
          qu'il soit trop tard.
        </p>

        <p>
          <strong>
            Arrêtez de deviner, commencez à vous entraîner avec l'IA dès
            aujourd'hui.
          </strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Inscrivez-vous sur OpenAthlete
          </a>{' '}
          et laissez la surveillance continue prévenir le surentraînement avant
          qu'il ne fasse dérailler vos progrès.
        </p>
      </div>
    );
  },
};
