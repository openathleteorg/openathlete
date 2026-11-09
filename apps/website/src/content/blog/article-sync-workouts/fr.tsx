import { DISCORD_URL } from '@/config';
import Link from 'next/link';

export function ContentFr() {
  return (
    <div>
      <p>
        Une séance structurée sur la montre rend trois services&nbsp;: elle vous
        dit quand chaque bloc commence et finit, elle montre si vous êtes dans
        la plage cible, et elle compte les répétitions à votre place. Sur une
        séance comme 15' footing, 5 × 4' au seuil récup 2' trot, 10' retour au
        calme, c'est la différence entre courir la séance et faire du calcul
        mental en la courant.
      </p>
      <p>
        Faire passer la séance d'un plan d'entraînement au poignet dépend de la
        marque. Ce guide couvre les trois marques qui acceptent des séances
        venues d'autres applications (Garmin, COROS et Suunto), explique quoi
        faire avec une Polar, et se termine par une liste de vérifications pour
        le jour où une séance n'apparaît pas.
      </p>

      <h2>Quelles montres peuvent recevoir des séances</h2>
      <p>
        Toutes les marques permettent de créer une séance dans leur propre
        application. Moins nombreuses sont celles qui laissent une plateforme
        extérieure en envoyer une.
      </p>
      <ul>
        <li>
          <strong>Garmin</strong> accepte les séances de partenaires agréés.
          Elles arrivent dans votre calendrier Garmin Connect, puis sur la
          montre à la synchronisation suivante.
        </li>
        <li>
          <strong>Suunto</strong> les accepte sous forme de guides&nbsp;: c'est
          le nom que Suunto donne à une séance structurée que l'on choisit au
          lancement d'une activité.
        </li>
        <li>
          <strong>COROS</strong> accepte les séances structurées de course,
          trail et vélo, qui apparaissent dans le calendrier de l'application
          COROS puis sur la montre.
        </li>
        <li>
          L'API publique de <strong>Polar</strong> permet de lire vos activités
          et votre sommeil, pas d'écrire dans votre compte&nbsp;: OpenAthlete ne
          peut donc pas y envoyer de séances. Vous pouvez toujours les créer à
          la main dans Polar Flow.
        </li>
        <li>
          <strong>Strava</strong> n'a pas de séances structurées&nbsp;: il n'y a
          rien à recevoir.
        </li>
      </ul>

      <h2>Ce qui rend une séance «&nbsp;structurée&nbsp;»</h2>
      <p>
        Une montre ne peut vous guider qu'à travers des blocs. Chaque bloc a
        besoin d'une longueur (durée ou distance) et, idéalement, d'une
        cible&nbsp;: plage d'allure, de fréquence cardiaque ou de puissance. Les
        répétitions regroupent des blocs&nbsp;: «&nbsp;5 × (4' à 4:10–4:20/km,
        2' trot)&nbsp;» est un bloc de répétition contenant deux étapes.
      </p>
      <p>
        Une séance réduite à «&nbsp;60 minutes footing&nbsp;», sans étapes,
        n'envoie rien&nbsp;: la montre n'a rien à guider. Si vous la voulez au
        poignet, faites-en une seule étape de 60 minutes avec un plafond
        cardiaque.
      </p>
      <p>
        Un mot sur les cibles exprimées en zones. Vos zones dans une plateforme
        d'entraînement et celles de votre montre sont rarement les mêmes. Quand
        une étape vise une de vos zones, OpenAthlete envoie les valeurs réelles
        (par exemple 148–158 bpm ou 4:35–4:45/km) plutôt que «&nbsp;zone
        3&nbsp;», pour que la cible au poignet corresponde au plan, quelles que
        soient les zones réglées dans la montre. Même chose pour les
        pourcentages de FCmax ou de puissance au seuil, à condition que ces
        valeurs soient renseignées dans vos métriques.
      </p>

      <h2>Garmin</h2>
      <p>
        Une fois Garmin connecté avec l'export des séances activé, chaque séance
        structurée part dans votre calendrier Garmin Connect. La montre la
        récupère à sa prochaine synchronisation avec l'application. Sur la
        plupart des Forerunner, Fenix et Venu récentes, la séance prévue du jour
        est proposée au lancement de l'activité correspondante&nbsp;; sinon,
        cherchez dans le menu entraînement, sous entraînements ou calendrier.
        Les intitulés varient selon les modèles&nbsp;: le manuel de votre montre
        fait foi.
      </p>
      <p>
        Déplacez ou modifiez la séance dans OpenAthlete, et la copie Garmin
        suit. Les séances de course, vélo, natation en piscine, renforcement,
        cardio, yoga et pilates sont envoyées. En piscine, Garmin n'accepte que
        l'allure comme cible&nbsp;: les cibles cardiaques des étapes de natation
        sont donc ignorées. Garmin limite aussi une séance à 100 étapes,
        répétitions comprises, ce qui ne gêne que si vous écrivez de très
        longues séances sur piste étape par étape.
      </p>
      <p>
        Les détails de configuration sont sur la{' '}
        <Link href="/fr/connect/garmin">page de connexion Garmin</Link>.
      </p>

      <h2>COROS</h2>
      <p>
        Les séances de course, trail et vélo partent vers COROS. Elles
        apparaissent dans le calendrier de l'application COROS et arrivent sur
        la montre à la synchronisation. La natation et le renforcement ne sont
        pas envoyés.
      </p>
      <p>
        COROS a une particularité à connaître avant la semaine de course&nbsp;:
        une application ne peut pas y supprimer une séance planifiée. Si vous
        déplacez ou supprimez une séance dans OpenAthlete, l'ancienne reste sur
        le calendrier COROS marquée comme annulée, et c'est à vous de la
        supprimer dans l'application COROS. À la connexion, choisissez la région
        où vous avez créé votre compte COROS (Europe, États-Unis et autres
        régions, ou Chine continentale)&nbsp;: COROS garde chaque compte sur un
        seul serveur régional.
      </p>
      <p>
        Le connecteur COROS est le plus récent, en service depuis novembre 2026.
        Détails et limites connues sur la{' '}
        <Link href="/fr/connect/coros">page de connexion COROS</Link>.
      </p>

      <h2>Suunto</h2>
      <p>
        Les séances de course, trail, vélo et natation arrivent dans votre
        compte Suunto sous forme de guides. Sur la montre, choisissez le guide
        au lancement de l'activité, comme n'importe quel guide Suunto. Le
        renforcement reste dans OpenAthlete. La{' '}
        <Link href="/fr/connect/suunto">page de connexion Suunto</Link> détaille
        la configuration.
      </p>

      <h2>
        Polar&nbsp;: les activités arrivent, les séances se font à la main
      </h2>
      <p>
        Avec une Polar, vos activités, votre sommeil et votre VFC nocturne
        peuvent quand même arriver automatiquement dans OpenAthlete. Pour la
        séance elle-même, deux options&nbsp;: la créer dans Polar Flow comme
        objectif d'entraînement par phases et synchroniser la montre, ou la
        suivre depuis l'application OpenAthlete sur votre téléphone. Aucune des
        deux ne vaut une synchronisation directe, et c'est bon à savoir avant
        d'acheter une montre si les séances structurées comptent pour vous.
      </p>

      <h2>Quand c'est votre entraîneur qui planifie</h2>
      <p>
        Les séances partent par la connexion de l'athlète, pas par celle de
        l'entraîneur. Votre entraîneur peut planifier sur votre calendrier avec
        n'importe quelle montre, ou sans montre&nbsp;; tant que vous avez
        connecté Garmin, COROS ou Suunto avec l'export activé, ses séances
        arrivent à votre poignet comme celles que vous planifiez vous-même. Un
        entraîneur peut suivre des athlètes sur les trois marques sans rien
        faire de différent pour chacun.
      </p>

      <h2>
        La séance n'est pas sur ma montre&nbsp;: la liste de vérifications
      </h2>
      <p>
        Dans l'ordre. Les deux premiers points expliquent la plupart des cas.
      </p>
      <ul>
        <li>
          <strong>
            La séance est-elle dans les sept prochains jours&nbsp;?
          </strong>{' '}
          OpenAthlete envoie la semaine à venir, pas tout le plan. Une séance
          dans trois semaines partira toute seule quand elle entrera dans les
          sept jours. Les séances passées ne sont pas envoyées.
        </li>
        <li>
          <strong>La montre s'est-elle synchronisée depuis&nbsp;?</strong> La
          séance arrive d'abord dans Garmin Connect, l'application COROS ou
          l'application Suunto. Ouvrez l'application de la marque et laissez la
          montre se synchroniser.
        </li>
        <li>
          <strong>L'export est-il activé&nbsp;?</strong> Dans Paramètres,
          Connecteurs, vérifiez que l'export des séances est activé pour cette
          marque.
        </li>
        <li>
          <strong>La séance a-t-elle des étapes&nbsp;?</strong> Une durée sans
          étapes n'envoie rien.
        </li>
        <li>
          <strong>
            Le sport est-il pris en charge par cette marque&nbsp;?
          </strong>{' '}
          Le renforcement ne part ni vers COROS ni vers Suunto&nbsp;; la
          natation ne part pas vers COROS.
        </li>
        <li>
          <strong>
            Votre modèle sait-il suivre une séance structurée&nbsp;?
          </strong>{' '}
          La plupart des montres de course récentes, oui&nbsp;; certains modèles
          d'entrée de gamme ou anciens, non.
        </li>
        <li>
          <strong>COROS uniquement&nbsp;:</strong> une séance déplacée peut
          apparaître deux fois, dont une marquée comme annulée. Supprimez
          celle-ci dans l'application COROS.
        </li>
        <li>
          <strong>Toujours rien&nbsp;?</strong> Déconnectez puis reconnectez la
          marque dans Réglages, Connecteurs, puis écrivez-nous sur{' '}
          <a href={DISCORD_URL}>Discord</a>
          avec la date de la séance.
        </li>
      </ul>

      <h2>Le faire à la main</h2>
      <p>
        Aucune plateforme n'est nécessaire pour mettre une séance sur une
        montre. Garmin Connect, l'application COROS et Polar Flow ont tous un
        éditeur de séances&nbsp;: vous créez les étapes, vous enregistrez, vous
        synchronisez. Pour une séance clé par semaine, c'est dix minutes, et ça
        marche très bien. Ça devient pénible quand le plan bouge souvent, quand
        un entraîneur écrit pour plusieurs athlètes, ou quand les allures
        doivent suivre des zones mises à jour. C'est là qu'une plateforme qui
        envoie les séances se justifie.
      </p>
      <p>
        OpenAthlete envoie les séances vers Garmin, COROS et Suunto avec l'offre
        gratuite, et importe les activités de ces trois marques ainsi que de
        Polar et Strava. La{' '}
        <Link href="/fr/features/watch-sync">page sur la synchronisation</Link>{' '}
        détaille tout, marque par marque.
      </p>
    </div>
  );
}
