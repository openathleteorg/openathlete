import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentFr() {
  return (
    <div>
      <p>
        CTL, ATL et TSB sont trois courbes tirées de la même charge
        d’entraînement quotidienne. La CTL (<em>chronic training load</em>)
        représente la forme, l’ATL (<em>acute training load</em>) la fatigue, et
        la TSB (<em>training stress balance</em>) la fraîcheur. Elles viennent
        du modèle impulsion-réponse publié par Eric Banister en 1975&nbsp;:
        chaque séance augmente à la fois votre forme et votre fatigue, la
        fatigue se dissipe en quelques jours, la forme en quelques semaines, et
        la performance se situe dans l’écart entre les deux. Les sigles anglais
        ont été popularisés plus tard par les logiciels de cyclisme, mais les
        calculs restent ceux de Banister.
      </p>

      <h2>Comment on les calcule</h2>
      <p>
        On part d’une charge par jour, par exemple la somme des{' '}
        <Link href="/fr/learn/trimp">TRIMP</Link> des séances de la journée (0
        un jour de repos). Forme et fatigue sont des moyennes pondérées
        exponentiellement de cette série, avec des constantes de temps
        différentes&nbsp;:
      </p>
      <Formula
        where={[
          'CTL\u00a0: τ = 42 jours, chaque jour pèse 1 − e^(−1/42) ≈ 0,0235',
          'ATL\u00a0: τ = 7 jours, chaque jour pèse 1 − e^(−1/7) ≈ 0,133',
          'TSB = CTL − ATL',
        ]}
      >
        aujourd’hui = hier + (1 − e^(−1/τ)) × (charge − hier)
      </Formula>
      <p>
        Avec τ = 42 jours, l’effet d’une séance sur la CTL est divisé par deux
        en 29 jours environ&nbsp;; sur l’ATL, en moins de 5 jours. Certains
        outils prennent le raccourci des moyennes mobiles, 2 / (N + 1), comme
        poids quotidien. Ce n’est pas le même modèle&nbsp;: avec N = 42, on
        obtient 0,047, soit le double de 0,0235, ce qui revient à diviser par
        deux les deux constantes de temps et rend les courbes bien plus
        nerveuses (Clarke et Skiba, 2013, détaillent la démonstration).
      </p>
      <p>
        Les outils divergent aussi sur le jour retenu pour la TSB. OpenAthlete
        soustrait les valeurs du jour même, une fois la charge du jour
        comptée&nbsp;; d’autres prennent celles de la veille, pour décrire votre
        fraîcheur au moment de commencer la séance. Sur les mêmes données,
        l’écart peut atteindre quelques points&nbsp;: ne comparez pas les
        chiffres d’une application à l’autre.
      </p>

      <h2>Un exemple chiffré</h2>
      <p>
        Une coureuse encaisse en moyenne 60 de TRIMP par jour depuis des
        mois&nbsp;: CTL et ATL valent 60, la TSB 0. Elle attaque une semaine
        chargée à 90 par jour. Après le premier jour&nbsp;:
      </p>
      <ul>
        <li>CTL = 60 + 0,0235 × (90 − 60) = 60,7</li>
        <li>ATL = 60 + 0,133 × (90 − 60) = 64,0</li>
        <li>TSB = 60,7 − 64,0 = −3,3</li>
      </ul>
      <p>
        Après sept jours à 90, la CTL n’a gagné que quelques points (64,6) alors
        que l’ATL a bondi à 79,0&nbsp;: la TSB est à −14,4. Elle est un peu plus
        en forme, et nettement fatiguée. Elle redescend ensuite à 40 par jour
        pendant une semaine. L’ATL chute vite à 54,3, la CTL ne recule qu’à
        60,8, et la TSB repasse en positif à +6,5. Cette asymétrie, la fatigue
        qui s’en va plus vite que la forme, est tout le principe de l’
        <Link href="/fr/learn/taper">affûtage</Link>.
      </p>

      <h2>Comment s’en servir</h2>
      <p>
        La CTL indique la quantité d’entraînement que vous avez absorbée sur les
        un à deux derniers mois. Une hausse régulière de quelques points par
        semaine pendant un bloc de développement est le schéma classique&nbsp;;
        un bond brutal mérite qu’on s’interroge, un long plateau aussi si vous
        attendiez des progrès. L’ATL suit chaque semaine et explique surtout
        pourquoi vous avez les jambes lourdes. La TSB est celle qu’on regarde
        avant une course&nbsp;: la plupart des athlètes courent bien entre une
        valeur légèrement négative et nettement positive, mais le bon chiffre
        est personnel, et on ne l’apprend qu’en notant sa TSB avant les courses
        réussies et ratées.
      </p>
      <p>
        Les courbes deviennent plus utiles quand elles se prolongent dans le
        futur. Si vos séances prévues portent une estimation de charge, le
        modèle peut projeter CTL, ATL et TSB jusqu’au jour J et montrer si les
        deux dernières semaines vous amènent vraiment frais au départ.
        OpenAthlete le fait&nbsp;: il calcule les courbes à partir de vos
        activités et les projette sur les séances de votre calendrier. Il
        signale une TSB sous −20 ou au-dessus de +25&nbsp;; ces seuils sont des
        conventions pour lire la courbe, pas des limites validées. La{' '}
        <Link href="/fr/features/training-load">
          page sur la charge d’entraînement
        </Link>{' '}
        détaille le calcul et renvoie vers le code.
      </p>

      <h2>Limites</h2>
      <p>
        Le modèle ne vaut que la charge quotidienne qu’on lui donne. Le TRIMP
        cardiaque sous-estime les sprints, le renforcement et la descente&nbsp;:
        les courbes ratent une partie de ce que fait un traileur ou un
        triathlète en salle. Les trous de données faussent aussi tout&nbsp;: une
        semaine de sorties sans ceinture cardio ressemble à une semaine de
        repos.
      </p>
      <p>
        Les constantes de temps sont des conventions. Banister les ajustait
        athlète par athlète, et les valeurs obtenues varient beaucoup&nbsp;; 42
        et 7 jours sont des valeurs par défaut raisonnables, pas votre
        physiologie. Hellard et ses collègues (2006) ont montré à quel point les
        paramètres ajustés sont instables, même avec de bonnes données de
        nageurs de haut niveau. Enfin, le modèle ignore le sommeil, la maladie
        et le stress hors sport. Une TSB négative ne diagnostique pas un
        surentraînement, et une TSB élevée ne garantit pas que vous êtes prêt.
        Lisez les courbes avec la{' '}
        <Link href="/fr/learn/session-rpe">RPE de séance</Link>, la{' '}
        <Link href="/fr/learn/hrv">VFC</Link> et vos sensations.
      </p>
    </div>
  );
}
