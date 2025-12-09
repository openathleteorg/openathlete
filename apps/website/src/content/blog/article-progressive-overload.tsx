import type { BlogPost } from './types';

export const articleProgressiveOverload: BlogPost = {
  metadata: {
    slug: 'progressive-overload-increasing-intensity-without-breaking',
    title: {
      en: 'Progressive Overload: Increasing Intensity Without Breaking',
      fr: "Surcharge Progressive : Augmenter l'Intensité Sans Casser",
    },
    description: {
      en: 'Educational guide on mesocycles and microcycles. Learn how AI smooths load increases to keep you in the progress zone, not the red zone.',
      fr: "Guide éducatif sur les mésocycles et microcycles. Découvrez comment l'IA lisse les augmentations de charge pour vous garder dans la zone de progrès, pas la zone rouge.",
    },
    excerpt: {
      en: 'Progressive overload is essential for improvement, but increasing too fast causes injury. Learn how AI manages mesocycles and microcycles to optimize progress safely.',
      fr: "La surcharge progressive est essentielle pour l'amélioration, mais augmenter trop vite cause des blessures. Découvrez comment l'IA gère les mésocycles et microcycles pour optimiser le progrès en sécurité.",
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-03-20',
    tags: [
      'Progressive Overload Principle',
      'Periodization',
      'Increasing Running Volume',
      'Training Science',
    ],
    readingTime: 8,
    image:
      'https://images.unsplash.com/photo-1638536534847-2cb61af9efe3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHxwcm9ncmVzc2l2ZSUyMHRyYWluaW5nJTIwd2VpZ2h0cyUyMGR1bWJiZWxscyUyMGdyYWR1YWwlMjBpbmNyZWFzZXxlbnwwfDB8fHwxNzY1Mjg3MzgwfDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn: () => {
    return (
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p>
          <strong>
            You want to get faster. So you train harder. Week 1: 40km. Week 2:
            50km. Week 3: 60km. Week 4: You're injured. What went wrong?
          </strong>
        </p>

        <p>
          The answer: you increased load too quickly. Progressive overload is
          essential for improvement, but there's a right way and a wrong way to
          do it. The right way involves understanding mesocycles, microcycles,
          and the delicate balance between progress and injury risk.
        </p>

        <h2>What is Progressive Overload?</h2>
        <p>
          Progressive overload is the fundamental principle of training: to
          improve, you must gradually increase stress. Your body adapts to
          stress by getting stronger, but only if you increase that stress
          intelligently.
        </p>

        <p>
          The challenge? Increase too slowly, and you don't progress. Increase
          too quickly, and you get injured. The sweet spot is in
          between—progressive enough to drive adaptation, but controlled enough
          to prevent breakdown.
        </p>

        <h2>Understanding Mesocycles and Microcycles</h2>
        <p>Training is organized into cycles:</p>

        <p>
          <strong>Microcycle (1 week):</strong> The basic training unit.
          Typically includes:
        </p>
        <ul>
          <li>2-3 hard sessions</li>
          <li>2-3 easy/recovery sessions</li>
          <li>1-2 rest days</li>
        </ul>

        <p>
          <strong>Mesocycle (3-6 weeks):</strong> A block of training with a
          specific focus:
        </p>
        <ul>
          <li>Base building (high volume, low intensity)</li>
          <li>Build phase (increasing intensity)</li>
          <li>Peak phase (race-specific training)</li>
          <li>Recovery phase (reduced load)</li>
        </ul>

        <p>
          Progressive overload happens within mesocycles. Each microcycle builds
          slightly on the last, but mesocycles include recovery weeks to allow
          adaptation.
        </p>

        <h2>The Traditional Problem</h2>
        <p>
          Most athletes (and many coaches) struggle with progressive overload
          because:
        </p>
        <ul>
          <li>
            <strong>They increase too quickly:</strong> Jumping from 40km to
            60km in 3 weeks
          </li>
          <li>
            <strong>They don't plan recovery:</strong> No deload weeks
          </li>
          <li>
            <strong>They ignore signals:</strong> Pushing through fatigue
          </li>
          <li>
            <strong>They don't track load:</strong> No ACWR monitoring
          </li>
        </ul>

        <p>The result? Injuries, burnout, and stalled progress.</p>

        <h2>How AI Manages Progressive Overload</h2>
        <p>OpenAthlete's AI solves this by:</p>

        <p>
          <strong>1. Calculating Optimal Load Increases</strong>
        </p>
        <p>
          Based on your current fitness, goals, and history, AI determines safe
          load increases. Typically 5-10% per week, with deload weeks every 3-4
          weeks.
        </p>

        <p>
          <strong>2. Monitoring ACWR</strong>
        </p>
        <p>
          AI tracks your Acute:Chronic Workload Ratio continuously. When ACWR
          approaches 1.5 (danger zone), it reduces load automatically. This
          prevents the spikes that cause injuries.
        </p>

        <p>
          <strong>3. Planning Mesocycles</strong>
        </p>
        <p>AI structures training into mesocycles with clear phases:</p>
        <ul>
          <li>Weeks 1-3: Build phase (increasing load)</li>
          <li>Week 4: Deload week (reduced load for adaptation)</li>
          <li>Weeks 5-7: Build phase (resume progression)</li>
          <li>Week 8: Deload week</li>
        </ul>

        <p>
          This pattern repeats, ensuring consistent progress without overload.
        </p>

        <p>
          <strong>4. Adjusting Based on RPE</strong>
        </p>
        <p>
          If your RPE is consistently elevated, AI reduces load even if volume
          looks "safe" on paper. This prevents overreaching before it becomes
          overtraining.
        </p>

        <h2>The Progress Zone vs. Red Zone</h2>
        <p>
          <strong>Progress Zone (ACWR 0.8-1.3):</strong>
        </p>
        <ul>
          <li>Optimal adaptation</li>
          <li>Low injury risk</li>
          <li>Consistent improvement</li>
          <li>Sustainable long-term</li>
        </ul>

        <p>
          <strong>Red Zone (ACWR {'>'} 1.5):</strong>
        </p>
        <ul>
          <li>High injury risk</li>
          <li>Fatigue accumulation</li>
          <li>Diminished returns</li>
          <li>Unsustainable</li>
        </ul>

        <p>
          AI keeps you in the progress zone. When you drift toward the red zone,
          it intervenes—reducing load, adding recovery, preventing problems
          before they occur.
        </p>

        <h2>Real-World Example</h2>
        <p>
          Sarah wanted to increase her weekly volume from 40km to 60km over 8
          weeks. Without AI:
        </p>
        <ul>
          <li>Week 1: 40km</li>
          <li>Week 2: 50km (25% increase—too much)</li>
          <li>Week 3: 55km</li>
          <li>Week 4: 60km (ACWR = 1.6—red zone)</li>
          <li>Week 5: Injured</li>
        </ul>

        <p>With OpenAthlete's AI:</p>
        <ul>
          <li>Week 1: 40km</li>
          <li>Week 2: 42km (5% increase)</li>
          <li>Week 3: 44km (5% increase)</li>
          <li>Week 4: 35km (deload week)</li>
          <li>Week 5: 46km (resume progression)</li>
          <li>Week 6: 48km</li>
          <li>Week 7: 50km</li>
          <li>Week 8: 40km (deload week)</li>
          <li>Week 9: 52km (continue building)</li>
        </ul>

        <p>
          Result: Sarah reached 60km/week safely over 12 weeks instead of 4,
          with no injuries and consistent progress.
        </p>

        <h2>The Bottom Line</h2>
        <p>
          Progressive overload is essential, but it must be managed
          intelligently. Too fast = injury. Too slow = stagnation. The sweet
          spot requires:
        </p>
        <ul>
          <li>Gradual increases (5-10% per week)</li>
          <li>Regular deload weeks</li>
          <li>ACWR monitoring</li>
          <li>RPE tracking</li>
          <li>Mesocycle structure</li>
        </ul>

        <p>
          AI manages all of this automatically. You don't have to calculate load
          increases, plan deload weeks, or monitor ACWR manually. The system
          does it for you, keeping you in the progress zone and out of the red
          zone.
        </p>

        <p>
          <strong>Stop guessing, start training with AI today.</strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Sign up for OpenAthlete
          </a>{' '}
          and let AI manage your progressive overload, ensuring you improve
          consistently without breaking down.
        </p>
      </div>
    );
  },
  ContentFr: () => {
    return (
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p>
          <strong>
            Vous voulez devenir plus rapide. Donc vous vous entraînez plus dur.
            Semaine 1 : 40km. Semaine 2 : 50km. Semaine 3 : 60km. Semaine 4 :
            Vous êtes blessé. Qu'est-ce qui n'a pas fonctionné ?
          </strong>
        </p>

        <p>
          La réponse : vous avez augmenté la charge trop rapidement. La
          surcharge progressive est essentielle pour l'amélioration, mais il y a
          une bonne et une mauvaise façon de le faire. La bonne façon implique
          de comprendre les mésocycles, microcycles et l'équilibre délicat entre
          progrès et risque de blessure.
        </p>

        <h2>Qu'est-ce que la Surcharge Progressive ?</h2>
        <p>
          La surcharge progressive est le principe fondamental de l'entraînement
          : pour s'améliorer, vous devez augmenter progressivement le stress.
          Votre corps s'adapte au stress en devenant plus fort, mais seulement
          si vous augmentez ce stress intelligemment.
        </p>

        <p>
          Le défi ? Augmentez trop lentement, et vous ne progressez pas.
          Augmentez trop rapidement, et vous vous blessez. La zone idéale est
          entre les deux—assez progressive pour conduire l'adaptation, mais
          assez contrôlée pour prévenir la rupture.
        </p>

        <h2>Comprendre les Mésocycles et Microcycles</h2>
        <p>L'entraînement est organisé en cycles :</p>

        <p>
          <strong>Microcycle (1 semaine) :</strong> L'unité d'entraînement de
          base. Inclut typiquement :
        </p>
        <ul>
          <li>2-3 séances dures</li>
          <li>2-3 séances faciles/récupération</li>
          <li>1-2 jours de repos</li>
        </ul>

        <p>
          <strong>Mésocycle (3-6 semaines) :</strong> Un bloc d'entraînement
          avec un focus spécifique :
        </p>
        <ul>
          <li>Construction de base (volume élevé, faible intensité)</li>
          <li>Phase de construction (augmentation d'intensité)</li>
          <li>Phase de pic (entraînement spécifique à la course)</li>
          <li>Phase de récupération (charge réduite)</li>
        </ul>

        <p>
          La surcharge progressive se produit dans les mésocycles. Chaque
          microcycle construit légèrement sur le précédent, mais les mésocycles
          incluent des semaines de récupération pour permettre l'adaptation.
        </p>

        <h2>Le Problème Traditionnel</h2>
        <p>
          La plupart des athlètes (et beaucoup de coachs) luttent avec la
          surcharge progressive parce que :
        </p>
        <ul>
          <li>
            <strong>Ils augmentent trop rapidement :</strong> Passer de 40km à
            60km en 3 semaines
          </li>
          <li>
            <strong>Ils ne planifient pas la récupération :</strong> Pas de
            semaines de décharge
          </li>
          <li>
            <strong>Ils ignorent les signaux :</strong> Pousser à travers la
            fatigue
          </li>
          <li>
            <strong>Ils ne suivent pas la charge :</strong> Pas de surveillance
            ACWR
          </li>
        </ul>

        <p>Le résultat ? Blessures, épuisement et progrès bloqués.</p>

        <h2>Comment l'IA Gère la Surcharge Progressive</h2>
        <p>L'IA d'OpenAthlete résout cela en :</p>

        <p>
          <strong>1. Calculant les Augmentations de Charge Optimales</strong>
        </p>
        <p>
          Basé sur votre forme actuelle, objectifs et historique, l'IA détermine
          des augmentations de charge sûres. Typiquement 5-10% par semaine, avec
          des semaines de décharge toutes les 3-4 semaines.
        </p>

        <p>
          <strong>2. Surveillant l'ACWR</strong>
        </p>
        <p>
          L'IA suit votre Ratio Charge Aiguë:Chronique en continu. Quand l'ACWR
          approche 1,5 (zone de danger), elle réduit la charge automatiquement.
          Cela prévient les pics qui causent des blessures.
        </p>

        <p>
          <strong>3. Planifiant les Mésocycles</strong>
        </p>
        <p>
          L'IA structure l'entraînement en mésocycles avec des phases claires :
        </p>
        <ul>
          <li>Semaines 1-3 : Phase de construction (augmentation de charge)</li>
          <li>
            Semaine 4 : Semaine de décharge (charge réduite pour adaptation)
          </li>
          <li>Semaines 5-7 : Phase de construction (reprendre progression)</li>
          <li>Semaine 8 : Semaine de décharge</li>
        </ul>

        <p>
          Ce modèle se répète, assurant une progression constante sans
          surcharge.
        </p>

        <p>
          <strong>4. Ajustant Basé sur le RPE</strong>
        </p>
        <p>
          Si votre RPE est constamment élevé, l'IA réduit la charge même si le
          volume semble "sûr" sur papier. Cela prévient le surentraînement avant
          qu'il ne devienne du surentraînement.
        </p>

        <h2>La Zone de Progrès vs Zone Rouge</h2>
        <p>
          <strong>Zone de Progrès (ACWR 0,8-1,3) :</strong>
        </p>
        <ul>
          <li>Adaptation optimale</li>
          <li>Faible risque de blessure</li>
          <li>Amélioration constante</li>
          <li>Durable à long terme</li>
        </ul>

        <p>
          <strong>Zone Rouge (ACWR {'>'} 1,5) :</strong>
        </p>
        <ul>
          <li>Risque élevé de blessure</li>
          <li>Accumulation de fatigue</li>
          <li>Rendements diminués</li>
          <li>Non durable</li>
        </ul>

        <p>
          L'IA vous garde dans la zone de progrès. Quand vous dérivez vers la
          zone rouge, elle intervient—réduisant la charge, ajoutant de la
          récupération, prévenant les problèmes avant qu'ils ne surviennent.
        </p>

        <h2>Exemple Concret</h2>
        <p>
          Sarah voulait augmenter son volume hebdomadaire de 40km à 60km sur 8
          semaines. Sans IA :
        </p>
        <ul>
          <li>Semaine 1 : 40km</li>
          <li>Semaine 2 : 50km (25% d'augmentation—trop)</li>
          <li>Semaine 3 : 55km</li>
          <li>Semaine 4 : 60km (ACWR = 1,6—zone rouge)</li>
          <li>Semaine 5 : Blessée</li>
        </ul>

        <p>Avec l'IA d'OpenAthlete :</p>
        <ul>
          <li>Semaine 1 : 40km</li>
          <li>Semaine 2 : 42km (5% d'augmentation)</li>
          <li>Semaine 3 : 44km (5% d'augmentation)</li>
          <li>Semaine 4 : 35km (semaine de décharge)</li>
          <li>Semaine 5 : 46km (reprendre progression)</li>
          <li>Semaine 6 : 48km</li>
          <li>Semaine 7 : 50km</li>
          <li>Semaine 8 : 40km (semaine de décharge)</li>
          <li>Semaine 9 : 52km (continuer construction)</li>
        </ul>

        <p>
          Résultat : Sarah a atteint 60km/semaine en sécurité sur 12 semaines au
          lieu de 4, sans blessures et avec une progression constante.
        </p>

        <h2>En Résumé</h2>
        <p>
          La surcharge progressive est essentielle, mais elle doit être gérée
          intelligemment. Trop rapide = blessure. Trop lent = stagnation. La
          zone idéale nécessite :
        </p>
        <ul>
          <li>Augmentations graduelles (5-10% par semaine)</li>
          <li>Semaines de décharge régulières</li>
          <li>Surveillance ACWR</li>
          <li>Suivi RPE</li>
          <li>Structure de mésocycle</li>
        </ul>

        <p>
          L'IA gère tout cela automatiquement. Vous n'avez pas à calculer les
          augmentations de charge, planifier les semaines de décharge ou
          surveiller l'ACWR manuellement. Le système le fait pour vous, vous
          gardant dans la zone de progrès et hors de la zone rouge.
        </p>

        <p>
          <strong>
            Arrêtez de deviner, commencez à vous entraîner avec l'IA dès
            aujourd'hui.
          </strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Inscrivez-vous sur OpenAthlete
          </a>{' '}
          et laissez l'IA gérer votre surcharge progressive, assurant que vous
          vous améliorez constamment sans vous casser.
        </p>
      </div>
    );
  },
};
