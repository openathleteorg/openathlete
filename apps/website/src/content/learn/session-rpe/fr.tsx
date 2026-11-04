import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentFr() {
  return (
    <div>
      <p>
        La RPE de séance est la mesure de charge la plus simple qui tienne la
        route dans la littérature&nbsp;: vous notez la difficulté de la séance
        entière de 0 à 10, vous multipliez par sa durée en minutes, et vous
        obtenez une charge en unités arbitraires. Carl Foster et ses collègues
        l’ont décrite à la fin des années 1990 puis comparée aux méthodes
        cardiaques en 2001. Elle ne demande aucun capteur, fonctionne dans tous
        les sports, renforcement et séances techniques compris, et capte ce que
        le cardio ne voit pas, comme les cuisses détruites par une descente ou
        le coût mental d’une course.
      </p>

      <h2>Comment se calcule la RPE de séance</h2>
      <Formula
        where={[
          'RPE\u00a0: effort perçu sur l’ensemble de la séance, sur l’échelle CR-10 de 0 à 10',
          'minutes\u00a0: durée totale, échauffement et retour au calme compris',
          'résultat en unités arbitraires (UA)',
        ]}
      >
        charge de séance = RPE × minutes
      </Formula>
      <p>
        L’échelle est une version de la CR-10 de Borg&nbsp;: 0 correspond au
        repos, 1 à très facile, 3 à modéré, 5 à difficile, 7 à très difficile,
        10 au maximum. La question porte sur la séance dans son ensemble, pas
        sur la répétition la plus dure ni sur votre état du moment. Le protocole
        de Foster demande la note environ 30 minutes après la fin, quand le
        dernier effort ne domine plus la réponse. En pratique, noter au moment
        où l’activité arrive, le jour même, suffit si vous restez constant.
      </p>

      <h2>Un exemple chiffré</h2>
      <p>La semaine d’un coureur, notée séance par séance&nbsp;:</p>
      <ul>
        <li>
          mardi, 60&nbsp;min dont 5 × 4' au seuil, RPE 7&nbsp;: 420&nbsp;UA
        </li>
        <li>
          mercredi, 45&nbsp;min d’endurance fondamentale, RPE 3&nbsp;:
          135&nbsp;UA
        </li>
        <li>jeudi, 50&nbsp;min d’endurance active, RPE 4&nbsp;: 200&nbsp;UA</li>
        <li>samedi, sortie longue de 100&nbsp;min, RPE 5&nbsp;: 500&nbsp;UA</li>
        <li>
          dimanche, footing de récupération de 40&nbsp;min, RPE 2&nbsp;:
          80&nbsp;UA
        </li>
      </ul>
      <p>
        La charge hebdomadaire est de 1&nbsp;335&nbsp;UA. La séance au seuil
        représente 15&nbsp;% du temps d’entraînement mais près d’un tiers de la
        charge, ce qui correspond au ressenti de la plupart des coureurs. Foster
        (1998) a aussi tiré deux indicateurs hebdomadaires des valeurs
        quotidiennes. La monotonie est la charge quotidienne moyenne divisée par
        son écart-type&nbsp;: ici 191 / 184 ≈ 1,0, avec deux jours de repos et
        un vrai contraste entre jours durs et jours faciles. La contrainte (
        <em>strain</em>) vaut charge hebdomadaire × monotonie, environ
        1&nbsp;390. S’entraîner tous les jours à la même dose modérée fait
        grimper la monotonie, et dans les données de Foster, les maladies
        suivaient plutôt les semaines de forte contrainte.
      </p>

      <h2>Comment s’en servir à l’entraînement</h2>
      <p>
        Notez toutes les séances, footings et renforcement compris. Les trous
        rendent le total hebdomadaire inutilisable. Regardez ensuite les
        tendances&nbsp;: une semaine 30&nbsp;% au-dessus des précédentes est un
        saut, quel que soit le chiffre absolu. Comparer l’effort prévu et
        l’effort noté en dit souvent plus que la charge elle-même. Un footing
        noté 5 au lieu de 3, ou une séance au seuil vécue comme un 9, signale
        fatigue, chaleur ou maladie avant n’importe quelle courbe.
      </p>
      <p>
        La RPE de séance donne le meilleur d’elle-même à côté d’une mesure
        objective. Quand le <Link href="/fr/learn/trimp">TRIMP</Link> reste
        stable alors que la RPE grimpe pour les mêmes séances, le corps paie
        plus cher le même travail. Les entraîneurs utilisent précisément cet
        écart pour ajuster les jours suivants.
      </p>
      <p>
        Dans OpenAthlete, chaque activité porte une RPE de 0 à 10, et un
        entraîneur peut l’exiger pour qu’une séance soit validée. La vue de
        charge affiche la RPE de séance (RPE × minutes) à côté du TRIMP
        cardiaque. Si les fonctions d’IA sont activées, quelques questions
        courtes après une activité peuvent renseigner la RPE à partir de la
        réponse de l’athlète. Plus de détails sur la{' '}
        <Link href="/fr/features/training-load">
          page consacrée à la charge d’entraînement
        </Link>
        .
      </p>

      <h2>Limites</h2>
      <p>
        Elle est subjective, et c’est à la fois son intérêt et sa faiblesse. Les
        notes varient avec l’humeur, la motivation et l’expérience&nbsp;; les
        débutants ont tendance à tout tasser entre 4 et 7. Les unités
        arbitraires ne se convertissent pas en TRIMP ni en TSS&nbsp;: on ne peut
        pas mélanger les chiffres dans une même courbe sans les remettre à
        l’échelle. La durée pèse de façon linéaire&nbsp;: trois heures de vélo
        tranquille à RPE 3 (540&nbsp;UA) dépassent une séance de fractionné de
        40 minutes à RPE 8 (320&nbsp;UA), ce qui est juste pour la charge totale
        et faux pour le stress spécifique de l’intensité. Et une note ne dit
        rien de la raison pour laquelle la séance a été dure. La revue de Haddad
        et ses collègues (2017) conclut que la RPE de séance est valide dans de
        nombreux sports, avec des corrélations aux méthodes cardiaques
        généralement bonnes mais loin d’être parfaites. Voyez-la comme un second
        avis toujours disponible, pas comme le seul chiffre.
      </p>
    </div>
  );
}
