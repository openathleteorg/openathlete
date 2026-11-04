import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentFr() {
  return (
    <div>
      <p>
        L’allure ajustée à la pente, ou GAP (<em>grade-adjusted pace</em>),
        traduit ce que vous avez couru en côte ou en descente en allure
        équivalente sur le plat, à dépense d’énergie égale. Un kilomètre en 7:30
        sur une route à 8&nbsp;% paraît lent sur la montre&nbsp;; corrigé de la
        pente, il vaut un peu moins de 5:00 sur le plat. Dès que le terrain
        s’incline, l’allure brute ne dit plus grand-chose, et en trail le
        terrain s’incline presque tout le temps.
      </p>
      <p>
        Il existe plusieurs modèles. Celui utilisé ici, comme dans OpenAthlete,
        vient d’Alberto Minetti et de ses collègues, qui ont mesuré la
        consommation d’oxygène de coureurs sur un tapis incliné de −45&nbsp;% à
        +45&nbsp;%, puis ajusté une courbe sur les résultats (Minetti et al.,
        2002).
      </p>

      <h2>Comment se calcule l’allure ajustée à la pente</h2>
      <p>
        La courbe de Minetti donne le coût énergétique d’un mètre de course
        selon la pente, par kilo de masse corporelle. Sur le plat, il vaut 3,6
        J/kg/m. La GAP applique à votre allure le rapport entre le coût sur le
        plat et le coût dans la pente&nbsp;:
      </p>
      <Formula
        where={[
          'C(i) = 155,4i⁵ − 30,4i⁴ − 43,3i³ + 46,3i² + 19,5i + 3,6, en J/kg/m',
          'i = pente en fraction\u00a0: 0,08 pour 8\u00a0%, −0,10 pour −10\u00a0%',
          'C(0) = 3,6 sur le plat',
        ]}
      >
        GAP = allure dans la pente × 3,6 / C(i)
      </Formula>
      <p>
        Le même rapport fonctionne dans l’autre sens&nbsp;: l’allure à tenir
        dans une pente pour un effort donné sur le plat vaut{' '}
        <code>allure plat × C(i) / 3,6</code>. Sur une sortie entière, le calcul
        se fait point par point à partir de l’altitude enregistrée, puis se
        moyenne&nbsp;: une sortie vallonnée affiche ainsi une GAP à côté de son
        allure moyenne brute.
      </p>

      <h2>Exemple chiffré</h2>
      <ul>
        <li>
          En montée&nbsp;: 7:30/km sur une pente à 8&nbsp;%. C(0,08) = 5,43,
          soit 1,51 fois le coût sur le plat. 7:30 (450 s) / 1,51 = 298 s, donc
          environ 4:58/km sur le plat.
        </li>
        <li>
          Dans l’autre sens&nbsp;: un coureur dont l’endurance fondamentale est
          à 5:30/km veut garder le même effort dans une côte à 6&nbsp;%. C(0,06)
          = 4,93, soit 1,37 fois le coût du plat, donc 5:30 × 1,37 = 7:32/km. À
          15&nbsp;%, le rapport monte à 2,06 et l’allure à 11:20/km&nbsp;: la
          plupart des traileurs marchent, et ils ont raison.
        </li>
        <li>
          En descente&nbsp;: 4:30/km à −10&nbsp;%. C(−0,10) = 2,15, à peine 0,6
          fois le coût du plat, d’où un équivalent plat de 7:32/km. La facture
          énergétique est faible, celle des quadriceps beaucoup moins.
        </li>
      </ul>
      <p>
        Le{' '}
        <Link href="/fr/tools/grade-adjusted-pace">
          calculateur d’allure ajustée à la pente
        </Link>{' '}
        refait ces calculs pour n’importe quelle allure et n’importe quelle
        pente.
      </p>

      <h2>L’utiliser à l’entraînement</h2>
      <p>
        La GAP sert surtout à comparer des sorties faites sur des terrains
        différents. Une boucle de 14 km avec 500 m de D+ courue à 6:10/km de
        moyenne et 14 km sur le plat à 5:20/km ont pu représenter la même séance
        pour votre cœur. Mettre la GAP en regard de la fréquence cardiaque
        permet de savoir si une journée lente venait du relief ou de vous.
      </p>
      <p>
        Elle aide aussi à fixer des repères sur parcours vallonné. Si votre
        footing doit rester à un effort de 5:30 sur le plat, une côte à 6&nbsp;%
        montée en 7:30 est dans les clous, la même côte en 6:30 est une séance
        de seuil qui ne dit pas son nom. Sur des côtes du type 8 × 2' en montée,
        la GAP vérifie que la dernière répétition valait la première, même si
        l’allure affichée a glissé.
      </p>
      <p>
        Le jour de la course, prudence. La GAP dit ce qu’une montée coûte en
        énergie, pas combien de temps durera un trail en montagne&nbsp;; pour
        cette question, le <Link href="/fr/learn/km-effort">km-effort</Link> et
        l’
        <Link href="/fr/tools/trail-time-estimator">
          estimateur de temps en trail
        </Link>{' '}
        sont plus adaptés.
      </p>
      <p>
        OpenAthlete applique la courbe de Minetti à chaque sortie de course à
        pied et de trail synchronisée. La pente est lue sur l’altitude par
        fenêtres de 10 m et plafonnée à ±30&nbsp;%&nbsp;: au-delà, il s’agit le
        plus souvent de bruit du GPS ou du baromètre, pas du terrain.
      </p>

      <h2>Limites</h2>
      <p>
        Les sujets de Minetti couraient sur un tapis lisse. Cailloux, racines,
        boue et lacets ajoutent un coût que la courbe ignore&nbsp;: sur terrain
        technique, votre effort réel était plus élevé que ce qu’indique la GAP.
      </p>
      <p>
        La descente est le point faible. Sur le papier, le coût continue de
        baisser jusqu’à un minimum vers −18 à −20&nbsp;%, où un mètre coûte
        moitié moins que sur le plat. En pratique, au-delà de −10&nbsp;%
        environ, ce sont le freinage, les appuis et le travail excentrique des
        quadriceps qui limitent la vitesse, bien avant l’énergie. Une descente
        rapide affiche une GAP tranquille, mais c’est souvent elle qui vous
        laisse des courbatures pendant trois jours.
      </p>
      <p>
        Les données d’altitude sont bruitées. Une montre barométrique fait mieux
        que l’altitude GPS, mais les deux créent de petites fausses montées sur
        le plat qui décalent la GAP. Les rampes courtes et raides, 20 m de mur
        par exemple, sont lissées par la fenêtre de calcul.
      </p>
      <p>
        Enfin, d’autres plateformes utilisent d’autres modèles. Strava indique
        avoir construit sa GAP à partir des données cardiaques de ses
        utilisateurs plutôt que de mesures en laboratoire, et accorde moins de
        crédit aux descentes. Les chiffres diffèrent d’un outil à l’autre&nbsp;:
        comparez vos sorties dans un même outil, pas entre deux.
      </p>
    </div>
  );
}
