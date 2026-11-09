import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentFr() {
  return (
    <div>
      <p>
        La FTP, pour <em>functional threshold power</em>, est la puissance la
        plus élevée que vous pouvez tenir de façon à peu près stable pendant
        environ une heure, en watts. Andrew Coggan l’a définie comme un
        substitut de terrain aux seuils de laboratoire, et le livre de Hunter
        Allen et Coggan, <em>Training and Racing with a Power Meter</em>, en a
        fait la référence de l’entraînement cycliste&nbsp;: zones, séances et
        scores de charge s’expriment en pourcentage de la FTP. Les capteurs de
        puissance pour la course à pied ont depuis importé la même logique.
      </p>
      <p>
        La FTP est une valeur de terrain, mesurée avec un capteur et un effort à
        fond, pas une frontière physiologique mesurée en laboratoire. Sa cousine
        la plus proche en physiologie est la puissance critique, qu’il vaut la
        peine de comprendre en parallèle&nbsp;: les deux tombent souvent à
        quelques watts l’une de l’autre sans être la même chose.
      </p>

      <h2>Estimer sa FTP</h2>
      <p>
        La définition d’origine, c’est la puissance moyenne d’un
        contre-la-montre d’une heure. Peu de gens ont envie d’en faire souvent,
        d’où le test courant&nbsp;: 20 minutes à fond, en général précédées d’un
        effort de 5 minutes appuyé pour entamer la réserve anaérobie, avec un
        résultat réduit de 5&nbsp;%&nbsp;:
      </p>
      <Formula
        where={[
          'P20 = puissance moyenne d’un effort de 20 minutes à fond, en watts',
        ]}
      >
        FTP ≈ 0,95 × P20
      </Formula>
      <p>
        Le facteur 0,95 corrige en moyenne le fait qu’on pousse plus fort sur 20
        minutes que sur 60. Il convient bien à certains cyclistes et mal à
        d’autres, comme le montrent les limites plus bas.
      </p>

      <h2>La puissance critique</h2>
      <p>
        La puissance critique vient de Monod et Scherrer (1965). Placez vos
        meilleurs efforts sur un graphique travail total / durée&nbsp;: entre 2
        et 20 minutes environ, les points s’alignent sur une droite. Sa pente
        est la puissance critique (PC, ou CP en anglais)&nbsp;; son ordonnée à
        l’origine, W′ («&nbsp;W prime&nbsp;»), est une quantité fixe de travail
        réalisable au-dessus de la PC avant de devoir ralentir&nbsp;:
      </p>
      <Formula
        where={[
          'PC = puissance critique, en watts',
          'W′ = capacité de travail au-dessus de la PC, en joules',
          't = durée de l’effort, en secondes',
        ]}
      >
        P(t) = PC + W′ / t
      </Formula>
      <p>
        Côté physiologie, la PC sépare le domaine «&nbsp;lourd&nbsp;», où
        consommation d’oxygène et lactatémie se stabilisent, du domaine
        «&nbsp;sévère&nbsp;», où elles montent jusqu’à l’arrêt (Poole et al.,
        2016). Au-dessus de la PC, chaque seconde puise dans W′&nbsp;; en
        dessous, W′ se recharge lentement. L’équivalent en course à pied, avec
        la vitesse à la place de la puissance, est la{' '}
        <Link href="/fr/learn/critical-speed">vitesse critique</Link>.
      </p>

      <h2>Un exemple chiffré</h2>
      <p>
        Une cycliste tient 262 W de moyenne sur un test de 20 minutes. Ses
        meilleurs efforts récents&nbsp;: 340 W sur 3 minutes, 310 W sur 5, 275 W
        sur 12 et ces 262 W sur 20.
      </p>
      <ul>
        <li>FTP ≈ 0,95 × 262 = 249 W</li>
        <li>
          Une régression du travail sur la durée pour les quatre efforts (61,2,
          93,0, 198,0 et 314,4 kJ) donne PC = 248 W et W′ = 18,0 kJ
        </li>
        <li>
          Puissance prévue sur 10 minutes&nbsp;: 248 + 17&nbsp;965 / 600 = 278
          W, cohérent avec les records sur 5 et 12 minutes qui l’encadrent
        </li>
        <li>
          Une attaque à 400 W consomme 400 − 248 = 152 joules de W′ par seconde,
          soit 17&nbsp;965 / 152 ≈ 118 secondes avant que la réserve soit vide
        </li>
      </ul>
      <p>
        Ici, FTP et PC s’accordent au watt près. C’est fréquent en moyenne et
        peu fiable individuellement&nbsp;: sur 17 cyclistes entraînés, Karsten
        et al. (2021) trouvent une PC moyenne de 256 W pour une FTP de 249 W,
        mais l’écart pour un coureur donné va d’environ 19 W dans un sens à 33 W
        dans l’autre.
      </p>

      <h2>Utiliser la FTP à l’entraînement</h2>
      <p>
        Les zones de puissance classiques de Coggan sont des pourcentages de la
        FTP. Avec 249 W&nbsp;: endurance (56–75&nbsp;%) de 139 à 187 W, tempo
        (76–90&nbsp;%) de 189 à 224 W, seuil (91–105&nbsp;%) de 227 à 261 W et
        PMA (106–120&nbsp;%) de 264 à 299 W. Les séances types en
        découlent&nbsp;:
      </p>
      <ul>
        <li>
          2 × 20 minutes à 95–100&nbsp;% de la FTP (237 à 249 W), 5 minutes de
          récupération
        </li>
        <li>3 × 12 minutes à 100–105&nbsp;% avec 4 minutes de récupération</li>
        <li>
          5 × 4 minutes à 110–120&nbsp;% (274 à 299 W), récupération égale
        </li>
        <li>Sorties longues de 2 à 4 heures sous 75&nbsp;%</li>
      </ul>
      <p>
        PC et W′ apportent ce que la FTP ne dit pas&nbsp;: combien de temps vous
        pouvez rester au-dessus du seuil. C’est utile pour doser une montée, un
        contre-la-montre court ou une course faite de relances. Refaites un test
        toutes les six à huit semaines, ou plus tôt si les séances au seuil
        deviennent trop faciles ou impossibles.
      </p>
      <p>
        Dans OpenAthlete, la FTP (vélo et course à pied) est une métrique que
        vous saisissez ou synchronisez&nbsp;; l’application ne fait pas passer
        de test. Les étapes du{' '}
        <Link href="/fr/features/workout-builder">créateur de séances</Link>{' '}
        peuvent viser un pourcentage de la FTP ou de la puissance critique. La
        vue Capacités des statistiques calcule la puissance critique à partir de
        vos records de puissance à vélo entre 2 et 20 minutes, avec un
        intervalle à 95&nbsp;%&nbsp;: ces records viennent de l’entraînement,
        pas de tests maximaux, donc le résultat vaut au plus ce qu’ils montrent.
      </p>

      <h2>Limites</h2>
      <p>
        L’heure de la définition est approximative. Quand Borszcz et al. (2018)
        ont fait rouler 23 cyclistes entraînés à leur FTP sur 20 minutes jusqu’à
        épuisement, ils ont tenu 50,9 minutes en moyenne, avec un écart-type de
        près de 16 minutes&nbsp;: certains ont largement dépassé l’heure,
        d’autres se sont arrêtés vers la moitié. Les profils à grosse capacité
        anaérobie obtiennent une FTP gonflée par le test de 20 minutes&nbsp;;
        les diesels, une FTP trop basse.
      </p>
      <p>
        Les conditions du test font aussi bouger la valeur&nbsp;: chaleur sur
        home trainer sans ventilation suffisante, départ trop rapide, fatigue,
        motivation. La puissance critique a ses propres faiblesses. Elle dépend
        des durées retenues, ne tient plus en dehors de 2 à 20 minutes environ,
        et les efforts tirés de sorties ordinaires sont rarement à fond. Aucune
        des deux ne dit rien de l’endurance de la puissance, de ce qu’il reste
        après trois heures de selle. Pour l’intensité côté cardio, voyez la{' '}
        <Link href="/fr/learn/heart-rate-reserve">
          fréquence cardiaque de réserve
        </Link>
        . Pour les seuils de laboratoire que la FTP cherche à approcher, voyez
        le <Link href="/fr/learn/lactate-threshold">seuil lactique</Link>.
      </p>
    </div>
  );
}
