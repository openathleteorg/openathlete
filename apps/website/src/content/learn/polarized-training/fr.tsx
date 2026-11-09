import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentFr() {
  return (
    <div>
      <p>
        L’entraînement polarisé décrit une façon de répartir l’intensité&nbsp;:
        l’essentiel du volume nettement facile, une part plus petite mais réelle
        nettement difficile, et très peu entre les deux. L’idée n’est pas née
        d’un protocole de laboratoire, mais de l’observation de ce que font
        vraiment les athlètes d’endurance de haut niveau. En reprenant les
        études descriptives, Stephen Seiler constate que les athlètes de niveau
        national et international qui s’entraînent 10 à 13 fois par semaine
        convergent vers environ 80&nbsp;% de séances à basse intensité et
        20&nbsp;% dominées par un travail dur, comme du fractionné autour de
        90&nbsp;% de la VO2max (Seiler, 2010).
      </p>
      <p>
        On résume souvent ce schéma par «&nbsp;80/20&nbsp;». Le raccourci cache
        deux détails qui comptent&nbsp;: quelles zones on compte, et si l’on
        compte des séances ou des minutes.
      </p>

      <h2>Les trois zones</h2>
      <p>
        L’entraînement polarisé s’appuie sur un modèle à trois zones, bâti sur
        deux seuils physiologiques. La zone&nbsp;1 se situe sous le premier
        seuil ventilatoire ou{' '}
        <Link href="/fr/learn/lactate-threshold">seuil lactique</Link>{' '}
        (lactatémie autour de 2&nbsp;mmol/L)&nbsp;: l’endurance fondamentale, où
        l’on peut parler en phrases complètes. La zone&nbsp;2 s’étend entre les
        deux seuils. La zone&nbsp;3 commence au-dessus du second seuil (autour
        de 4&nbsp;mmol/L, proche de la{' '}
        <Link href="/fr/learn/critical-speed">vitesse critique</Link>), là où se
        joue le fractionné.
      </p>
      <p>
        Attention au conflit de noms. Dans les systèmes à cinq zones de la
        plupart des montres, la «&nbsp;
        <Link href="/fr/learn/zone-2">zone&nbsp;2</Link>&nbsp;» désigne
        l’endurance fondamentale, qui tombe dans la zone&nbsp;1 du modèle à
        trois zones. L’entraînement polarisé ne vous demande pas d’éviter ces
        sorties faciles&nbsp;; il vous demande de passer peu de temps entre les
        deux seuils.
      </p>

      <h2>Mettre un chiffre dessus</h2>
      <p>
        Treff et ses collègues (2019) ont proposé un indice de polarisation qui
        distingue une répartition polarisée des autres, à partir de la part du
        temps (ou de la distance) d’entraînement passée dans chacune des trois
        zones&nbsp;:
      </p>
      <Formula
        where={[
          'Z1, Z2, Z3 = part du temps total dans chaque zone (0,80 pour 80 %), Z1 + Z2 + Z3 = 1',
          'Valable si Z1 > Z3 > Z2. Si Z3 = 0, PI = 0. Si Z2 = 0, prendre 0,01 pour Z2 et Z3 − 0,01 pour Z3',
          'PI > 2,00 : polarisé. PI ≤ 2,00 : non polarisé',
        ]}
      >
        PI = log10(Z1 / Z2 × Z3 × 100)
      </Formula>

      <h2>Un exemple chiffré</h2>
      <p>
        Une coureuse s’entraîne 8&nbsp;heures par semaine. Sur un mois, son
        temps passé par zone s’établit à 80&nbsp;% en zone&nbsp;1, 5&nbsp;% en
        zone&nbsp;2 et 15&nbsp;% en zone&nbsp;3.
      </p>
      <ul>
        <li>Z1 / Z2 = 0,80 / 0,05 = 16</li>
        <li>16 × 0,15 × 100 = 240</li>
        <li>PI = log10(240) = 2,38, au-dessus de 2,00&nbsp;: polarisé</li>
      </ul>
      <p>
        Passez à 75&nbsp;% / 20&nbsp;% / 5&nbsp;%, une pyramide avec beaucoup de
        tempo et peu de fractionné&nbsp;: PI = log10(0,75 / 0,20 × 0,05 × 100) =
        log10(18,75) = 1,27. Un bloc centré sur le seuil, à 60&nbsp;% /
        35&nbsp;% / 5&nbsp;%, donne 0,93. Même volume horaire, trois semaines
        très différentes.
      </p>

      <h2>Des séances ou des minutes&nbsp;?</h2>
      <p>
        Le 80/20 de Seiler compte des séances. Le temps par zone donne une autre
        image, car une séance dure se compose surtout d’échauffement, de
        récupérations et de retour au calme. Une séance de 70&nbsp;minutes avec
        5 × 4' à allure 3&nbsp;000 – 5&nbsp;000&nbsp;m ne contient que
        20&nbsp;minutes de travail, et comme le cœur réagit avec retard, la
        montre en enregistre encore moins en zone&nbsp;3. Seiler et Kjerland
        (2006) ont mesuré les deux chez onze jeunes fondeurs pendant
        32&nbsp;jours&nbsp;: à la fréquence cardiaque, leurs séances d’endurance
        se répartissaient en 75&nbsp;% / 8&nbsp;% / 17&nbsp;% sur les trois
        zones, et la RPE de séance donnait presque le même résultat. Quatre
        footings d’une heure plus cette séance de fractionné font une semaine à
        80/20 en séances, mais seulement 20 de ses 310&nbsp;minutes, soit
        environ 6&nbsp;%, sont dures. Aucune des deux lectures n’est fausse,
        mais comparez ce qui est comparable.
      </p>

      <h2>Comment l’appliquer</h2>
      <p>
        Pour un coureur à cinq ou six séances par semaine, une semaine polarisée
        peut ressembler à ceci&nbsp;: trois ou quatre footings et une sortie
        longue, tous sous le premier seuil, plus une ou deux séances dures comme
        5 × 4' ou 6 × 3' à allure 3&nbsp;000 – 5&nbsp;000&nbsp;m avec
        récupération trottinée de même durée. Les jours faciles doivent rester
        faciles, ce qui veut dire pour la plupart d’entre nous plus lentement
        qu’on ne le voudrait&nbsp;; fixez le plafond avec le{' '}
        <Link href="/fr/tools/heart-rate-zones">
          calculateur de zones cardiaques
        </Link>{' '}
        ou le test de la parole. Les statistiques d’OpenAthlete affichent la
        part de l’entraînement sous vos seuils, entre eux et au-dessus, ce qui
        suffit pour vérifier quel type de semaine vous avez vraiment couru.
      </p>

      <h2>Limites</h2>
      <p>
        Le meilleur appui expérimental vient de Stöggl et Sperlich (2014)&nbsp;:
        48 coureurs, cyclistes, triathlètes et fondeurs bien entraînés ont suivi
        pendant neuf semaines l’un de quatre programmes, et le groupe polarisé a
        amélioré sa VO2pic de 11,7&nbsp;% et son temps jusqu’à épuisement de
        17,4&nbsp;%, davantage que les groupes volume, seuil ou fractionné. Neuf
        semaines et 48 athlètes répartis en quatre groupes, c’est une étude
        courte et petite, sur des sujets déjà en forme. Seiler (2010) présente
        lui-même le 80/20 comme descriptif&nbsp;: c’est ce vers quoi convergent
        les athlètes qui réussissent, pas la preuve qu’il convient à tout le
        monde. Un coureur qui dispose de quatre heures par semaine gagnera
        peut-être plus à un peu de travail au seuil qu’à une polarisation
        stricte&nbsp;; la question reste ouverte. Enfin, les zones dépendent de
        seuils qu’il faut tester ou estimer, et une erreur de 10&nbsp;battements
        fait glisser des minutes d’une zone à l’autre.
      </p>
    </div>
  );
}
