import type { BlogPost } from './types';

export const articleSyncWorkouts: BlogPost = {
  metadata: {
    slug: 'how-to-sync-workouts-to-garmin-coros-polar',
    title: {
      en: 'How to Sync Workouts to Garmin, Coros, and Polar',
      fr: 'Comment Synchroniser les Entraînements vers Garmin, Coros et Polar',
    },
    description: {
      en: 'Tutorial: "Gateway" article. Show how to sync manually, then show how OpenAthlete does it automatically.',
      fr: 'Tutoriel : Article "passerelle". Montrez comment synchroniser manuellement, puis montrez comment OpenAthlete le fait automatiquement.',
    },
    excerpt: {
      en: 'Learn how to send workouts to your watch manually, then discover how OpenAthlete automates this process for seamless training execution.',
      fr: "Apprenez comment envoyer des entraînements à votre montre manuellement, puis découvrez comment OpenAthlete automatise ce processus pour une exécution d'entraînement transparente.",
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-04-15',
    tags: [
      'Send Workout to Garmin',
      'Coros Sync',
      'Polar API',
      'Watch Integration',
    ],
    readingTime: 6,
    image:
      'https://images.unsplash.com/photo-1635863898961-e91351fc1741?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHxzbWFydHdhdGNoJTIwc3luYyUyMHdvcmtvdXQlMjB0cmFuc2ZlciUyMGRldmljZSUyMHRlY2hub2xvZ3l8ZW58MHwwfHx8MTc2NTI4NzM4MHww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn: () => {
    return (
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p>
          <strong>
            You have a training plan. You want it on your watch. But how? Manual
            entry? Garmin Connect? Third-party apps? The process is confusing,
            time-consuming, and error-prone.
          </strong>
        </p>

        <p>
          This guide shows you how to sync workouts to your watch—both manually
          and automatically. Whether you use Garmin, Coros, or Polar, we'll
          cover the options.
        </p>

        <h2>Manual Sync Methods</h2>
        <p>
          <strong>Garmin:</strong>
        </p>
        <ol>
          <li>Create workout in Garmin Connect</li>
          <li>Send to device via Bluetooth</li>
          <li>Sync watch</li>
        </ol>

        <p>
          <strong>Coros:</strong>
        </p>
        <ol>
          <li>Use Coros Training Hub</li>
          <li>Create workout plan</li>
          <li>Sync via app</li>
        </ol>

        <p>
          <strong>Polar:</strong>
        </p>
        <ol>
          <li>Use Polar Flow</li>
          <li>Create training target</li>
          <li>Sync to watch</li>
        </ol>

        <p>
          <strong>Problems with manual sync:</strong>
        </p>
        <ul>
          <li>Time-consuming (5-10 minutes per workout)</li>
          <li>Error-prone (wrong paces, missed intervals)</li>
          <li>No automatic updates when plans change</li>
          <li>Requires multiple apps/platforms</li>
        </ul>

        <h2>The Automatic Solution</h2>
        <p>OpenAthlete automates this entire process:</p>
        <ul>
          <li>
            <strong>One-click sync:</strong> Plans appear on your watch
            instantly
          </li>
          <li>
            <strong>Automatic updates:</strong> When plans change, watch updates
            automatically
          </li>
          <li>
            <strong>Error-free:</strong> No manual entry mistakes
          </li>
          <li>
            <strong>Multi-device:</strong> Works with Garmin, Coros, Polar, and
            more
          </li>
        </ul>

        <p>
          <strong>How it works:</strong>
        </p>
        <ol>
          <li>Coach creates plan in OpenAthlete</li>
          <li>Plan syncs to athlete's watch automatically</li>
          <li>Athlete sees workout on watch, ready to execute</li>
          <li>When plan updates, watch updates automatically</li>
        </ol>

        <h2>The Bottom Line</h2>
        <p>
          Manual sync works, but it's tedious. Automatic sync saves time,
          prevents errors, and ensures your watch always has the latest plan.
          OpenAthlete makes this seamless.
        </p>

        <p>
          <strong>Stop guessing, start training with AI today.</strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Sign up for OpenAthlete
          </a>{' '}
          and experience automatic workout sync to your watch.
        </p>
      </div>
    );
  },
  ContentFr: () => {
    return (
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p>
          <strong>
            Vous avez un plan d'entraînement. Vous le voulez sur votre montre.
            Mais comment ? Saisie manuelle ? Garmin Connect ? Apps tierces ? Le
            processus est confus, chronophage et sujet aux erreurs.
          </strong>
        </p>

        <p>
          Ce guide vous montre comment synchroniser les entraînements sur votre
          montre—à la fois manuellement et automatiquement. Que vous utilisiez
          Garmin, Coros ou Polar, nous couvrirons les options.
        </p>

        <h2>Méthodes de Synchronisation Manuelle</h2>
        <p>
          <strong>Garmin :</strong>
        </p>
        <ol>
          <li>Créer entraînement dans Garmin Connect</li>
          <li>Envoyer à l'appareil via Bluetooth</li>
          <li>Synchroniser la montre</li>
        </ol>

        <p>
          <strong>Coros :</strong>
        </p>
        <ol>
          <li>Utiliser Coros Training Hub</li>
          <li>Créer plan d'entraînement</li>
          <li>Synchroniser via app</li>
        </ol>

        <p>
          <strong>Polar :</strong>
        </p>
        <ol>
          <li>Utiliser Polar Flow</li>
          <li>Créer cible d'entraînement</li>
          <li>Synchroniser sur montre</li>
        </ol>

        <p>
          <strong>Problèmes avec synchronisation manuelle :</strong>
        </p>
        <ul>
          <li>Chronophage (5-10 minutes par entraînement)</li>
          <li>Sujet aux erreurs (mauvaises allures, intervalles manqués)</li>
          <li>Pas de mises à jour automatiques quand les plans changent</li>
          <li>Nécessite plusieurs apps/plateformes</li>
        </ul>

        <h2>La Solution Automatique</h2>
        <p>OpenAthlete automatise tout ce processus :</p>
        <ul>
          <li>
            <strong>Synchronisation en un clic :</strong> Les plans apparaissent
            sur votre montre instantanément
          </li>
          <li>
            <strong>Mises à jour automatiques :</strong> Quand les plans
            changent, la montre se met à jour automatiquement
          </li>
          <li>
            <strong>Sans erreur :</strong> Pas d'erreurs de saisie manuelle
          </li>
          <li>
            <strong>Multi-appareil :</strong> Fonctionne avec Garmin, Coros,
            Polar et plus
          </li>
        </ul>

        <p>
          <strong>Comment ça fonctionne :</strong>
        </p>
        <ol>
          <li>Le coach crée le plan dans OpenAthlete</li>
          <li>
            Le plan se synchronise sur la montre de l'athlète automatiquement
          </li>
          <li>L'athlète voit l'entraînement sur la montre, prêt à exécuter</li>
          <li>
            Quand le plan se met à jour, la montre se met à jour automatiquement
          </li>
        </ol>

        <h2>En Résumé</h2>
        <p>
          La synchronisation manuelle fonctionne, mais c'est fastidieux. La
          synchronisation automatique économise du temps, prévient les erreurs
          et assure que votre montre a toujours le dernier plan. OpenAthlete
          rend cela transparent.
        </p>

        <p>
          <strong>
            Arrêtez de deviner, commencez à vous entraîner avec l'IA dès
            aujourd'hui.
          </strong>{' '}
          <a href="https://app.openathlete.org/auth/create-account">
            Inscrivez-vous sur OpenAthlete
          </a>{' '}
          et découvrez la synchronisation automatique des entraînements sur
          votre montre.
        </p>
      </div>
    );
  },
};
