import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentFr() {
  return (
    <div>
      <p>
        Courez 1&nbsp;h&nbsp;30 à allure facile et régulière, et votre fréquence
        cardiaque restera rarement plate. Elle grimpe doucement&nbsp;: quelques
        battements dans la deuxième heure, davantage s’il fait chaud, plus
        encore si les sorties longues sont nouvelles pour vous. Le découplage
        aérobie chiffre cette dérive. Il compare l’allure (ou la puissance)
        obtenue par battement dans la première moitié d’un effort régulier à
        celle de la seconde moitié. Joe Friel l’a popularisé auprès des sportifs
        d’endurance, et TrainingPeaks l’appelle Pa:HR pour l’allure, Pw:HR pour
        la puissance.
      </p>

      <h2>Comment se calcule le découplage</h2>
      <p>
        On coupe la partie régulière de l’effort en deux moitiés de même durée.
        Pour chacune, on calcule le facteur d’efficacité (EF)&nbsp;: production
        moyenne divisée par la fréquence cardiaque moyenne. On exprime ensuite
        la perte d’une moitié à l’autre en pourcentage&nbsp;:
      </p>
      <Formula
        where={[
          'EF = production moyenne / fréquence cardiaque moyenne, pour chaque moitié',
          'Production = vitesse ajustée à la pente en course, puissance à vélo',
        ]}
      >
        Découplage (%) = (EF1 − EF2) / EF1 × 100
      </Formula>
      <p>
        Une valeur positive signifie que vous avez produit moins par battement
        en seconde moitié&nbsp;: le cardio a monté à allure égale, ou l’allure a
        baissé à cardio égal. Sur un parcours vallonné, la vitesse doit être
        ajustée à la pente, sinon une montée en fin de sortie passe pour de la
        fatigue. La lecture habituelle, reprise de Friel&nbsp;: sous 5&nbsp;%,
        l’effort est stable&nbsp;; entre 5 et 10&nbsp;%, il y a une
        dérive&nbsp;; au-delà de 10&nbsp;%, l’effort a dépassé votre endurance
        aérobie.
      </p>

      <h2>Un exemple chiffré</h2>
      <p>
        Un coureur fait 90 minutes sur une boucle plate à 5:20 au kilomètre,
        soit 187,5 mètres par minute.
      </p>
      <ul>
        <li>
          45 premières minutes&nbsp;: 142 bpm de moyenne, donc EF1 = 187,5 / 142
          = 1,320
        </li>
        <li>
          45 dernières minutes&nbsp;: même allure, 150 bpm de moyenne, donc EF2
          = 187,5 / 150 = 1,250
        </li>
        <li>Découplage = (1,320 − 1,250) / 1,320 × 100 = 5,3&nbsp;%</li>
      </ul>
      <p>
        Un peu plus de 5&nbsp;%&nbsp;: une légère dérive. Avec 146 bpm de
        moyenne en seconde moitié, on serait à 2,7&nbsp;%, nettement stable. À
        vélo, le calcul est le même avec les watts&nbsp;: 200&nbsp;W à 135 bpm,
        puis 195&nbsp;W à 140 bpm, donnent des EF de 1,48 et 1,39, soit
        6,0&nbsp;% de découplage. La puissance a baissé et le cardio a monté, et
        les deux jouent contre vous.
      </p>

      <h2>Comment s’en servir à l’entraînement</h2>
      <p>
        Le découplage sert surtout de test d’endurance aérobie reproductible
        pendant une période foncière. Choisissez une séance régulière que vous
        referez&nbsp;: une sortie facile de 1&nbsp;h&nbsp;15 à 2&nbsp;h sur la
        même boucle plate, ou une sortie vélo en bas de votre zone d’endurance.
        Restez à chaque fois dans{' '}
        <Link href="/fr/tools/heart-rate-zones">
          la même zone de fréquence cardiaque ou de puissance
        </Link>{' '}
        et suivez le chiffre sur plusieurs semaines.
      </p>
      <ul>
        <li>
          Si une sortie de 90 minutes dépasse 5&nbsp;%, la durée ou l’allure
          dépasse votre endurance actuelle. Gardez l’allure, ou ralentissez un
          peu, et allongez progressivement.
        </li>
        <li>
          Quand vous restez sous 5&nbsp;%, allongez la sortie, ou terminez par
          un bloc à allure marathon pour voir s’il tient.
        </li>
        <li>
          Avant un marathon ou un trail long, une sortie longue avec des
          portions à allure marathon qui reste sous 5&nbsp;% est un bon signe.
          Une forte dérive invite à revoir l’allure visée, ou le ravitaillement.
        </li>
      </ul>
      <p>
        OpenAthlete calcule le découplage et le facteur d’efficacité sur chaque
        sortie de course à pied, avec la vitesse ajustée à la pente et la
        fréquence cardiaque, et sur les sorties vélo avec capteur de puissance.
        Sur la page de l’activité, un curseur permet d’exclure l’échauffement,
        ou de sélectionner une portion de l’effort, et la carte affiche les deux
        moitiés et un statut&nbsp;: stable, légère dérive ou dérive marquée.
        Sous 20 minutes, elle signale que l’effort est trop court pour juger
        l’endurance.
      </p>

      <h2>Limites</h2>
      <p>
        Le découplage n’a de sens que sur un effort régulier. Le fractionné, les
        arrêts aux feux ou une fin de sortie accélérée faussent la comparaison.
        La chaleur est le principal facteur de confusion&nbsp;: Coyle et
        González-Alonso (2001) décrivent comment la hausse de la température
        corporelle fait monter la fréquence cardiaque pendant que le volume
        éjecté à chaque battement diminue, et la déshydratation s’ajoute. Un
        découplage de 7&nbsp;% un après-midi à 30&nbsp;°C et de 3&nbsp;% par un
        matin frais peuvent décrire le même niveau. Un capteur optique au
        poignet qui s’accroche à la cadence, une ceinture aux électrodes sèches
        ou un GPS qui dérive sous les arbres faussent une moitié. Enfin, le
        découplage ne dit rien de la vitesse&nbsp;: on peut être parfaitement
        couplé à une allure trop lente pour son objectif. Lisez-le avec votre
        allure, votre <Link href="/fr/learn/trimp">charge d’entraînement</Link>{' '}
        et les conditions du jour.
      </p>
    </div>
  );
}
