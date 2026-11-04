import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentFr() {
  return (
    <div>
      <p>
        Le TRIMP, pour <em>training impulse</em>, résume une séance en un seul
        chiffre à partir de deux données que votre montre enregistre déjà&nbsp;:
        la durée et la fréquence cardiaque. Eric Banister l’a proposé dans les
        années 1970 pour alimenter son modèle forme-fatigue, et la plupart des
        courbes de charge basées sur le cardio en utilisent encore une variante.
        Il se calcule à la main, et c’est la meilleure façon de comprendre ce
        qu’il mesure et ce qui lui échappe.
      </p>

      <h2>Comment se calcule le TRIMP</h2>
      <p>
        Le TRIMP de Banister prend la part de votre fréquence cardiaque de
        réserve utilisée, la multiplie par la durée, puis applique une
        pondération exponentielle&nbsp;: une minute au seuil coûte bien plus
        qu’une minute de footing.
      </p>
      <Formula
        where={[
          'FCr = (FC − FCrepos) / (FCmax − FCrepos), la fraction de fréquence cardiaque de réserve',
          'y = 0,64 et k = 1,92 pour les hommes\u00a0; y = 0,86 et k = 1,67 pour les femmes',
        ]}
      >
        TRIMP = minutes × FCr × y × e^(k × FCr)
      </Formula>
      <p>
        La pondération a été calée sur la montée de la lactatémie avec la
        fréquence cardiaque&nbsp;: presque plate aux allures faciles, raide près
        du seuil (Morton, Fitz-Clarke et Banister, 1990). Les deux jeux de
        coefficients sont des moyennes tirées des hommes et des femmes de ces
        études. Personne n’a montré qu’ils collent à un athlète en
        particulier&nbsp;: un TRIMP de 112 n’est donc pas vraiment plus précis
        qu’un TRIMP de 105.
      </p>
      <p>
        On peut appliquer la formule une seule fois à la fréquence moyenne de la
        séance, ou minute par minute (seconde par seconde avec un enregistrement
        complet) et additionner. La seconde méthode est meilleure, et l’exemple
        ci-dessous montre pourquoi.
      </p>

      <h2>Un exemple chiffré</h2>
      <p>
        Un coureur a une fréquence de repos de 48 et une fréquence maximale de
        188, soit 140 battements de réserve. Il court 45 minutes à 150 bpm de
        moyenne&nbsp;:
      </p>
      <ul>
        <li>FCr = (150 − 48) / 140 = 0,729</li>
        <li>Pondération = 0,64 × e^(1,92 × 0,729) = 0,64 × 4,05 = 2,59</li>
        <li>TRIMP = 45 × 0,729 × 2,59 = 85</li>
      </ul>
      <p>
        Avec les coefficients femmes, la même sortie vaut 95. Même cœur, même
        séance, 12&nbsp;% d’écart dû au seul choix des coefficients.
      </p>
      <p>
        Répartissons maintenant 20 minutes de même moyenne autrement&nbsp;: 10
        minutes à 175 bpm et 10 minutes à 125 bpm. Calculé sur la moyenne (150
        bpm pendant 20 minutes), le TRIMP vaut 38. Calculé bloc par bloc, il
        vaut 33 + 10 = 43, environ 15&nbsp;% de plus. La pondération étant
        exponentielle, les minutes dures ajoutent plus que les minutes faciles
        ne retirent, et la moyenne écrase justement ce qui fatigue. C’est
        pourquoi le fractionné est sous-estimé quand on ne garde que la
        fréquence moyenne.
      </p>

      <h2>Comment s’en servir à l’entraînement</h2>
      <p>
        Le score d’une séance isolée sert peu. Le TRIMP prend son intérêt quand
        on l’additionne&nbsp;: un total hebdomadaire pour comparer les blocs, et
        une série quotidienne qui alimente les{' '}
        <Link href="/fr/learn/ctl-atl-tsb">
          courbes de forme, de fatigue et de fraîcheur
        </Link>{' '}
        (CTL, ATL, TSB). Quelques habitudes aident&nbsp;:
      </p>
      <ul>
        <li>
          Tenez à jour vos fréquences de repos et maximale. Une FCmax surestimée
          de 10 battements réduit chaque FCr et fait baisser tous les scores.
        </li>
        <li>
          Comparez-vous à vous-même. Un total de 600 par semaine ne veut rien
          dire dans l’absolu&nbsp;; passer de 450 à 650 en deux semaines, si.
        </li>
        <li>
          Lisez le TRIMP avec votre ressenti. Quand un footing habituel affiche
          20&nbsp;% de plus que d’ordinaire, la chaleur, une mauvaise nuit ou un
          rhume qui couve sont des explications plus probables qu’un changement
          soudain de niveau.
        </li>
      </ul>
      <p>
        OpenAthlete calcule le TRIMP de Banister à partir de la fréquence
        cardiaque seconde par seconde de chaque activité (à partir de la moyenne
        quand l’enregistrement manque), avec les coefficients ci-dessus, et
        affiche la <Link href="/fr/learn/session-rpe">RPE de séance</Link> à
        côté. La{' '}
        <Link href="/fr/features/training-load">
          page sur la charge d’entraînement
        </Link>{' '}
        propose un calculateur et renvoie vers le code source.
      </p>

      <h2>Limites</h2>
      <p>
        La fréquence cardiaque est une mesure interne, et elle réagit avec
        retard. Sur des sprints de 30 secondes ou des côtes courtes, elle n’a
        pas le temps de monter&nbsp;: le TRIMP sous-estime le travail anaérobie
        et neuromusculaire. Le renforcement, la descente et les dégâts
        musculaires d’un trail apparaissent à peine. Chaleur, déshydratation,
        caféine et altitude font grimper le cardio pour un même travail, et la{' '}
        <Link href="/fr/learn/aerobic-decoupling">dérive cardiaque</Link> gonfle
        la seconde moitié des efforts longs. Enfin, la formule ignore le
        sport&nbsp;: une heure à 140 bpm à vélo et une heure à 140 bpm en course
        donnent le même score, alors que la course laisse en général plus de
        traces. Associez le TRIMP à une mesure subjective, et lisez-le comme une
        tendance, pas comme un verdict.
      </p>
    </div>
  );
}
