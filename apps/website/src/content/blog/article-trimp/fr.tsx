import Link from 'next/link';

export function ContentFr() {
  return (
    <div>
      <p>
        Le TRIMP, pour <em>training impulse</em>, est la plus ancienne tentative
        sérieuse de résumer une séance en un seul chiffre. Eric Banister et ses
        collègues l'ont proposé dans les années 1970 comme donnée d'entrée de
        leur modèle forme-fatigue, et cinquante ans plus tard il se cache
        encore, sous une forme ou une autre, derrière la plupart des courbes de
        charge calculées à partir de la fréquence cardiaque. Il se calcule à la
        main, et c'est la meilleure façon de comprendre ce qu'il mesure bien et
        là où il vous induit en erreur.
      </p>

      <h2>La formule</h2>
      <p>
        Le TRIMP de Banister multiplie la durée de la séance par la part de
        votre fréquence cardiaque de réserve utilisée, puis pondère cette
        intensité de façon exponentielle, pour que les minutes difficiles pèsent
        plus que les minutes faciles&nbsp;:
      </p>
      <p>
        <code>TRIMP = durée (min) × FCr × 0,64 × e^(1,92 × FCr)</code>
      </p>
      <p>
        avec <code>FCr = (FCmoy − FCrepos) / (FCmax − FCrepos)</code>, la
        fraction de la réserve cardiaque utilisée pendant la séance. Pour les
        femmes, les coefficients deviennent 0,86 et 1,67&nbsp;:{' '}
        <code>TRIMP = durée × FCr × 0,86 × e^(1,67 × FCr)</code>.
      </p>
      <p>
        Tout l'intérêt est dans la pondération exponentielle. Elle a été ajustée
        sur la façon dont la lactatémie monte avec la fréquence cardiaque&nbsp;:
        presque plate en endurance fondamentale, très raide à l'approche du
        seuil (Morton, Fitz-Clarke et Banister, 1990). Les coefficients hommes
        et femmes viennent du même travail et décrivent des moyennes de groupe,
        pas vous. Personne n'a montré qu'ils collaient bien à un athlète
        donné&nbsp;: mieux vaut ne pas considérer un TRIMP de 112 comme plus
        précis qu'un TRIMP de 105.
      </p>

      <h2>Un exemple chiffré</h2>
      <p>
        Prenons un coureur avec une fréquence cardiaque de repos de 50 et une
        FCmax de 190, soit une réserve de 140 battements. Il fait une heure de
        footing tranquille à 140 bpm de moyenne.
      </p>
      <ul>
        <li>FCr = (140 − 50) / (190 − 50) = 90 / 140 = 0,643</li>
        <li>Pondération = 0,64 × e^(1,92 × 0,643) = 0,64 × 3,44 = 2,20</li>
        <li>TRIMP = 60 × 0,643 × 2,20 = 85</li>
      </ul>
      <p>
        Avec les coefficients féminins, la même heure donne 97. Même cœur, même
        sortie, 14 % d'écart dû au seul choix du coefficient&nbsp;: cela dit
        beaucoup sur la part d'hypothèse dans le chiffre absolu.
      </p>
      <p>
        Passons à une séance au seuil pour le même coureur&nbsp;: 20 minutes
        d'échauffement à 135 bpm, 5 × 4' à 175 bpm avec 3' de récupération
        trottinée à 140, puis 8 minutes de retour au calme à 130. Soixante
        minutes, là encore. Calculé bloc par bloc, le TRIMP vaut 114. Calculé à
        partir de la fréquence moyenne de la séance (149 bpm), il vaut 105.
      </p>
      <p>
        Cet écart, c'est l'exponentielle&nbsp;: quatre minutes à 175 coûtent
        bien plus que ce que suggère la moyenne, donc moyenner une séance qui
        mélange allure facile et fractionné la sous-estime toujours. La méthode
        d'origine utilisait la moyenne parce que c'est tout ce que donnaient les
        cardiofréquencemètres de l'époque. Aujourd'hui, une montre enregistre la
        fréquence cardiaque chaque seconde, et l'intégrer seconde par seconde
        est le meilleur choix. Plus la séance est longue et variée, plus la
        différence compte.
      </p>
      <p>
        Pour donner un ordre de grandeur, une sortie longue de 2 h 30 à 135 bpm
        vaut environ 187, et 20 minutes à 185 bpm (presque à bloc pour ce
        coureur) environ 79. La formule dit donc qu'un effort court et très
        intense peut coûter autant qu'une heure facile. Que vos jambes soient
        d'accord est une autre histoire.
      </p>

      <h2>Ce qu'il faut bien régler</h2>
      <p>
        Le TRIMP ne vaut que ce que valent ses deux valeurs de référence. Une
        FCmax trop haute de 10 battements rend toutes les séances plus faciles
        en apparence&nbsp;; trop basse, elle gonfle tout. Prenez la valeur la
        plus haute observée en course ou dans une côte à fond, pas 220 moins
        votre âge, souvent faux de 10 bpm ou plus dans un sens ou dans l'autre.
        La fréquence de repos se mesure couché au réveil, en moyenne sur
        quelques matins. Si vous ne connaissez pas vos valeurs, notre{' '}
        <Link href="/fr/tools/heart-rate-zones">outil de zones cardiaques</Link>{' '}
        explique comment les estimer.
      </p>
      <p>
        Reste le capteur. Les capteurs optiques au poignet sont corrects sur un
        footing régulier et souvent faux dans les premières minutes, par temps
        froid et sur le fractionné court. Une ceinture cardiaque supprime
        l'essentiel de ce bruit. Un poignet qui s'accroche à la cadence et
        affiche 170 bpm sur un footing vous donnera un TRIMP sans rapport avec
        la sortie.
      </p>

      <h2>Là où le TRIMP se trompe</h2>
      <p>
        La fréquence cardiaque mesure ce que fait votre système
        cardiovasculaire, pas ce que paient vos muscles. Les conséquences sont
        prévisibles.
      </p>
      <p>
        La descente est le cas d'école. Un trail avec 1 500 m de D− peut vous
        laisser les quadriceps en miettes pendant quatre jours alors que le
        cardio reste modéré dans les descentes&nbsp;: le TRIMP la sous-estime.
        Le renforcement, la pliométrie et les sprints en côte posent le même
        problème.
      </p>
      <p>
        Le fractionné court en est un autre. Le cœur met une à deux minutes à
        rattraper l'effort, donc sur un 30/30 il n'atteint jamais le niveau que
        mérite le travail, et le TRIMP sort bas.
      </p>
      <p>
        La chaleur joue dans l'autre sens. Par forte chaleur, la dérive
        cardiaque peut faire monter la fréquence de dix battements ou plus à
        allure égale sur une heure. Le TRIMP compte une séance plus dure.
        Physiologiquement, elle l'était, donc ce n'est pas tout à fait faux,
        mais une semaine d'août paraît plus lourde que la même semaine en mars.
      </p>
      <p>
        Enfin, la fréquence cardiaque ne se compare pas d'un sport à l'autre. La
        plupart des gens montent moins haut à vélo qu'en course à pied, et
        encore moins dans l'eau&nbsp;: un TRIMP vélo et un TRIMP course de même
        valeur ne représentent pas le même stress. C'est pourquoi certains
        entraîneurs utilisent une FCmax par sport.
      </p>

      <h2>Les autres versions, et le RPE de séance</h2>
      <p>
        Plusieurs variantes corrigent une partie de ces défauts. Le TRIMP
        d'Edwards (1993) multiplie les minutes passées dans chacune de cinq
        zones cardiaques par un coefficient de 1 à 5. Celui de Lucía (Lucía et
        al., 2003) utilise trois zones bornées par les seuils ventilatoires,
        pondérées 1, 2 et 3. Le TRIMP individualisé de Manzi (Manzi et al.,
        2009) remplace la courbe moyenne de Banister par le profil lactique de
        l'athlète&nbsp;: plus juste, mais il faut un test en laboratoire.
      </p>
      <p>
        L'alternative la plus simple se passe du cardio. Le RPE de séance de
        Foster (Foster et al., 2001) multiplie la durée en minutes par la
        difficulté ressentie sur une échelle de 0 à 10&nbsp;: 50 minutes à RPE 6
        font 300. Il voit les dégâts musculaires, la chaleur, une mauvaise nuit
        et une journée de travail pénible, parce que vous les voyez. Les études
        qui ont comparé les deux méthodes les trouvent bien corrélées mais loin
        d'être identiques (Impellizzeri et al., 2004), et c'est justement
        utile&nbsp;: quand TRIMP et RPE de séance ne disent pas la même chose,
        il se passe quelque chose. Une séance au seuil ressentie à 8 avec un
        TRIMP banal mérite qu'on s'y arrête.
      </p>

      <h2>D'une séance à la forme et à la fatigue</h2>
      <p>
        Un TRIMP isolé ne dit pas grand-chose. Il sert de donnée quotidienne au
        modèle de Banister, qui tient deux moyennes exponentielles de votre
        charge&nbsp;: une lente pour la forme de fond, en général avec une
        constante de 42 jours (la CTL), et une rapide pour la fatigue, sur 7
        jours (l'ATL). La fraîcheur, ou TSB, est la différence entre les deux.
        Pendant un bloc, elle reste sous zéro&nbsp;; pendant l'affûtage, la
        fatigue baisse plus vite que la forme et la fraîcheur remonte. Le modèle
        décrit, il ne prédit pas tout, et les 42 et 7 jours sont des conventions
        plutôt que des valeurs mesurées sur vous, mais la tendance sur plusieurs
        semaines est utile.
      </p>
      <p>
        Deux règles pratiques en découlent. Comparez votre charge à elle-même,
        pas à celle d'un autre, ni d'un système à l'autre&nbsp;: un TRIMP de 100
        et un TSS de 100 sur TrainingPeaks ne sont pas la même unité. Et lisez
        la courbe sur des semaines&nbsp;; un jour isolé ne veut pas dire
        grand-chose.
      </p>

      <h2>Comment OpenAthlete l'utilise</h2>
      <p>
        OpenAthlete calcule le TRIMP de Banister de chaque activité avec
        fréquence cardiaque, seconde par seconde quand l'enregistrement est
        complet, avec les coefficients 0,64/1,92 et 0,86/1,67 et les FCmax et FC
        de repos de vos métriques. Quand vous notez l'effort d'une activité, le
        RPE de séance s'affiche à côté, pour repérer les désaccords. Forme,
        fatigue et fraîcheur sont ensuite projetées sur les séances planifiées.
        La{' '}
        <Link href="/fr/features/training-load">
          page sur la charge d'entraînement
        </Link>{' '}
        propose un petit calculateur de TRIMP et renvoie vers les formules dans
        le code source.
      </p>

      <h2>Sources</h2>
      <ul>
        <li>
          Banister EW, Calvert TW, Savage MV, Bach T. A systems model of
          training for athletic performance. Australian Journal of Sports
          Medicine, 1975;7:57–61.
        </li>
        <li>
          Morton RH, Fitz-Clarke JR, Banister EW. Modeling human performance in
          running. Journal of Applied Physiology, 1990;69(3):1171–1177.{' '}
          <a href="https://doi.org/10.1152/jappl.1990.69.3.1171">
            doi:10.1152/jappl.1990.69.3.1171
          </a>
        </li>
        <li>
          Banister EW. Modeling elite athletic performance. Dans&nbsp;:
          MacDougall JD, Wenger HA, Green HJ (dir.), Physiological Testing of
          the High-Performance Athlete. Human Kinetics, 1991.
        </li>
        <li>Edwards S. The Heart Rate Monitor Book. Polar Electro, 1993.</li>
        <li>
          Foster C, Florhaug JA, Franklin J, et al. A new approach to monitoring
          exercise training. Journal of Strength and Conditioning Research,
          2001;15(1):109–115.
        </li>
        <li>
          Lucía A, Hoyos J, Santalla A, Earnest C, Chicharro JL. Tour de France
          versus Vuelta a España: which is harder? Medicine and Science in
          Sports and Exercise, 2003;35(5):872–878.
        </li>
        <li>
          Impellizzeri FM, Rampinini E, Coutts AJ, Sassi A, Marcora SM. Use of
          RPE-based training load in soccer. Medicine and Science in Sports and
          Exercise, 2004;36(6):1042–1047.
        </li>
        <li>
          Manzi V, Iellamo F, Impellizzeri F, D'Ottavio S, Castagna C. Relation
          between individualized training impulses and performance in distance
          runners. Medicine and Science in Sports and Exercise,
          2009;41(11):2090–2096.
        </li>
      </ul>
    </div>
  );
}
