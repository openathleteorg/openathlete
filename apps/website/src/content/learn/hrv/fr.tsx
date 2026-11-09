import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentFr() {
  return (
    <div>
      <p>
        Votre cœur ne bat pas comme un métronome. À 50 bpm, l’intervalle moyen
        entre deux battements est de 1,2 seconde, mais l’un peut durer
        1&nbsp;150 ms et le suivant 1&nbsp;240 ms. La variabilité de la
        fréquence cardiaque (VFC, ou HRV en anglais) mesure cet écart.
        L’essentiel de la variation rapide, d’un battement à l’autre, vient du
        nerf vague, le «&nbsp;frein&nbsp;» parasympathique du cœur. La VFC offre
        donc une fenêtre, étroite et bruitée, sur la façon dont votre système
        nerveux autonome encaisse l’entraînement, le sommeil, la maladie et le
        stress.
      </p>

      <h2>Comment se calcule la VFC</h2>
      <p>
        Il existe des dizaines d’indices de VFC (l’article de référence de la
        Task Force de 1996 en recense l’essentiel). Les sportifs et leurs
        montres utilisent surtout le rMSSD, la racine carrée de la moyenne des
        carrés des différences successives entre intervalles RR&nbsp;:
      </p>
      <Formula
        where={[
          'RRi = le temps entre deux battements consécutifs, en millisecondes',
          'N = le nombre d’intervalles de l’enregistrement',
        ]}
      >
        rMSSD = √( Σ (RRi+1 − RRi)² / (N − 1) )
      </Formula>
      <p>
        Le rMSSD reflète bien l’activité vagale et reste fiable sur des
        enregistrements courts&nbsp;: quelques minutes allongé au réveil, ou les
        phases de sommeil profond que la montre sélectionne la nuit. Comme les
        valeurs quotidiennes sont asymétriques (quelques nuits très hautes
        tirent la moyenne vers le haut), les études sur l’entraînement prennent
        en général le logarithme népérien, ln rMSSD, avant de faire des
        moyennes.
      </p>

      <h2>Un exemple chiffré</h2>
      <p>
        Prenons cinq intervalles RR consécutifs&nbsp;: 1&nbsp;000, 1&nbsp;050,
        980, 1&nbsp;020 et 990 ms.
      </p>
      <ul>
        <li>Différences successives&nbsp;: +50, −70, +40, −30 ms</li>
        <li>
          Carrés&nbsp;: 2&nbsp;500 + 4&nbsp;900 + 1&nbsp;600 + 900 = 9&nbsp;900
        </li>
        <li>
          Moyenne sur les 4 différences&nbsp;: 9&nbsp;900 / 4 = 2&nbsp;475
        </li>
        <li>rMSSD = √2&nbsp;475 = 49,7 ms, soit ln rMSSD = 3,91</li>
      </ul>
      <p>
        Un vrai enregistrement compte des centaines d’intervalles, mais le
        calcul est le même. Passons à une semaine de mesures nocturnes&nbsp;:
        62, 58, 65, 48, 60, 63 et 59 ms. La moyenne de leurs logarithmes vaut
        4,08, soit 59 ms une fois reconvertie. La nuit à 48 ms, après la sortie
        longue du dimanche, inquiète prise isolément et ne bouge presque pas le
        chiffre de la semaine. Si la semaine suivante donne 52, 49, 55, 50, 47,
        51 et 48 ms, la moyenne sur 7 jours tombe à 3,92 (50 ms). Là, il s’agit
        d’un décalage durable, qui mérite qu’on s’y arrête.
      </p>

      <h2>Comment s’en servir à l’entraînement</h2>
      <p>
        La valeur d’un seul matin ne dit pas grand-chose. Plews et ses collègues
        (2013) ont montré que chez des athlètes d’endurance de haut niveau, la
        moyenne glissante sur 7 jours du ln rMSSD, et l’ampleur de ses
        fluctuations, suivent l’adaptation bien mieux que les mesures isolées.
        Une routine simple&nbsp;:
      </p>
      <ul>
        <li>
          Mesurez toujours de la même façon&nbsp;: la nuit avec la même montre,
          ou au réveil, allongé, avant le café.
        </li>
        <li>
          Construisez une référence sur au moins trois ou quatre semaines
          d’entraînement normal, et définissez votre fourchette habituelle
          autour.
        </li>
        <li>
          Lisez la moyenne sur 7 jours par rapport à cette fourchette, avec la
          fréquence cardiaque de repos, le sommeil et le ressenti des séances.
        </li>
      </ul>
      <p>
        Kiviniemi et ses collègues (2007) sont allés plus loin&nbsp;: un groupe
        d’hommes moyennement entraînés ne faisait ses séances dures que les
        jours où la VFC n’avait pas baissé, et de l’endurance facile sinon. Ils
        ont davantage progressé en vitesse maximale de course qu’un groupe
        suivant un plan fixe. L’idée est intéressante, mais il s’agit d’une
        étude sur de petits groupes, pas d’une règle. Pour la plupart des
        sportifs, la VFC sert surtout à regarder une semaine de plus près&nbsp;:
        si la moyenne sur 7 jours reste sous votre fourchette depuis une
        semaine, que la fréquence de repos monte et que le 5 × 4' au seuil a
        ressemblé à une course, prenez le jour facile.
      </p>
      <p>
        OpenAthlete importe la VFC nocturne depuis Garmin, Polar, Suunto et
        COROS (vous pouvez aussi la saisir à la main), affiche la valeur de la
        nuit dans la ligne bien-être de chaque jour du calendrier, et trace la
        moyenne glissante sur 7 jours du ln rMSSD dans les statistiques de
        récupération. Il montre la tendance, sans la transformer en score de
        forme du jour.
      </p>

      <h2>Limites</h2>
      <p>
        Les valeurs absolues sont personnelles&nbsp;: chez des personnes en
        bonne santé et entraînées, elles vont de moins de 30 à plus de 100 ms,
        et se comparer à un partenaire d’entraînement n’a aucun sens. Les
        appareils diffèrent aussi&nbsp;: certains donnent le rMSSD de toute la
        nuit, d’autres celui d’une fenêtre de 5 minutes, d’autres un score
        maison. Changer de montre remet votre référence à zéro. L’alcool, un
        dîner tardif, la chaleur, un voyage ou le cycle menstruel font bouger la
        VFC sans aucun lien avec l’entraînement. Et plus haut ne veut pas
        toujours dire mieux&nbsp;: Buchheit (2014) rappelle que chez des
        athlètes très entraînés, la VFC peut plafonner, voire baisser, pendant
        une période chargée alors qu’ils s’adaptent bien, et qu’une forte hausse
        peut accompagner une fatigue profonde. La VFC est un signal parmi
        d’autres&nbsp;: lisez-la avec{' '}
        <Link href="/fr/learn/session-rpe">le ressenti des séances</Link> et{' '}
        <Link href="/fr/learn/ctl-atl-tsb">vos courbes de charge</Link>, jamais
        seule.
      </p>
    </div>
  );
}
