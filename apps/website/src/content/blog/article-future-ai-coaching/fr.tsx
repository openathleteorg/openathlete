import Link from 'next/link';

import { Sources } from './sources';

export function ContentFr() {
  return (
    <div>
      <p>
        Il y a deux ans, le «&nbsp;coaching par IA&nbsp;» désignait surtout un
        chatbot qui écrivait un plan générique de douze semaines et vous
        oubliait dès l'onglet fermé. Ce qui a changé depuis, ce n'est pas que
        les modèles de langage comprennent soudain mieux l'entraînement. C'est
        qu'ils peuvent désormais agir&nbsp;: ouvrir votre calendrier, lire les
        activités du mois dernier et écrire des séances dans le plan que votre
        montre téléchargera demain matin. C'est ce qu'on appelle des agents, et
        cela mérite qu'on réfléchisse calmement à ce que cela change pour les
        coachs, et à ce que cela ne change pas.
      </p>

      <h2>Le MCP, en deux mots</h2>
      <p>
        Le Model Context Protocol est un standard ouvert, présenté par Anthropic
        en novembre 2024, qui permet à un client d'IA comme Claude ou ChatGPT
        d'appeler des outils exposés par une autre application. Une plateforme
        d'entraînement peut exposer des outils comme «&nbsp;lire le calendrier
        de ces semaines&nbsp;», «&nbsp;obtenir la charge d'entraînement&nbsp;»,
        «&nbsp;planifier ces séances&nbsp;» ou «&nbsp;déplacer cette séance à
        jeudi&nbsp;». Le modèle choisit quels outils appeler et dans quel ordre.
        L'application décide de ce que le modèle a le droit de toucher et
        vérifie chaque demande comme elle vérifierait un clic de l'utilisateur.
      </p>
      <p>
        Cette séparation compte. Le modèle apporte le langage et le
        raisonnement&nbsp;; la plateforme garde les données, les droits d'accès
        et les règles. Un modèle qui vous comprend mal peut proposer une bêtise,
        mais il ne peut atteindre rien que la plateforme n'expose pas.
      </p>

      <h2>Un lundi réaliste</h2>
      <p>
        Prenons un coach qui suit quinze athlètes. Lundi matin, l'une d'elles, à
        neuf semaines d'un marathon, écrit qu'elle a la grippe depuis samedi et
        ne compte pas reprendre avant jeudi au mieux. Le travail habituel&nbsp;:
        ouvrir son calendrier, supprimer ou déplacer cinq ou six séances,
        réécrire la fin de semaine, raccourcir la sortie longue et vérifier que
        la semaine suivante tient toujours. Dix ou quinze minutes, et c'est le
        troisième message de ce genre de la journée.
      </p>
      <p>
        Avec un agent connecté à la plateforme, le coach peut écrire&nbsp;:
        «&nbsp;Anna est malade depuis samedi, sans doute jusqu'à jeudi. Note-le,
        garde tout en endurance facile jusqu'à dimanche, décale le 3 × 15
        minutes allure marathon de samedi à mardi prochain, et ramène la sortie
        longue de dimanche à 1 h 15 facile.&nbsp;» L'agent enregistre la
        maladie, lit le calendrier, fait les modifications et rend compte. Le
        coach regarde la semaine dans le calendrier, corrige un détail et passe
        à la suite.
      </p>
      <p>
        Remarquez qui a pris les décisions. Chaque choix de cette consigne
        (combien de temps rester en facile, quelle séance mérite d'être
        déplacée, quelle durée pour la sortie longue) vient du coach. L'agent a
        fait les clics. C'est la version honnête de ce que les agents apportent
        au coaching aujourd'hui&nbsp;: la moitié administrative du métier coûte
        beaucoup moins cher, et la moitié qui relève du jugement reste où elle
        était.
      </p>

      <h2>Ce que les agents font encore mal</h2>
      <p>
        <strong>Savoir ce qu'ils ignorent.</strong> Un agent planifiera un bloc
        même quand les données sont maigres&nbsp;: pas de fréquence cardiaque
        sur la moitié des sorties, aucun RPE, une semaine de déplacement dont
        personne n'a parlé. Impellizzeri et ses collègues soutiennent depuis des
        années que c'est la charge interne, ce que l'entraînement a coûté à cet
        athlète-là, qui pilote l'adaptation, et c'est justement la partie qui
        manque le plus souvent dans les données. Un coach remarque le trou. Un
        modèle a tendance à le combler par des suppositions.
      </p>
      <p>
        <strong>Le jugement à long terme.</strong> Ajouter une troisième séance
        de qualité, quand commencer l'affûtage, si cet athlète a besoin d'une
        semaine allégée maintenant ou peut encore encaisser&nbsp;: tout cela
        dépend d'années d'historique, de son travail et de sa famille, de sa
        façon de réagir à la fatigue. Quand Düking et ses collègues (2024) ont
        fait évaluer des plans de course écrits par ChatGPT par des entraîneurs
        experts, les plans s'amélioraient nettement avec davantage
        d'informations, sans être jugés optimaux pour autant, et les auteurs
        recommandent la relecture d'un entraîneur.
      </p>
      <p>
        <strong>Les erreurs commises avec aplomb.</strong> Une zone mal lue
        transforme un footing de récupération en séance au seuil. Une date
        décalée d'un jour place la sortie longue la veille d'une course. Les
        modèles de langage commettent ces erreurs dans un texte fluide et
        raisonnable, et c'est ce qui les rend faciles à laisser passer.
      </p>
      <p>
        <strong>La responsabilité.</strong> Quand un plan contribue à une
        blessure, quelqu'un doit assumer cette décision et en parler avec
        l'athlète. Un modèle ne le peut pas.
      </p>

      <h2>Garder le coach dans la boucle, concrètement</h2>
      <p>
        «&nbsp;Garder l'humain dans la boucle&nbsp;» se dit facilement. Dans un
        outil de coaching, cela se traduit par quelques choix de conception
        précis&nbsp;:
      </p>
      <ul>
        <li>
          L'agent écrit dans le même calendrier que celui du coach et de
          l'athlète. Rien ne se passe dans une couche cachée, donc une mauvaise
          modification se voit tout de suite.
        </li>
        <li>
          Il a pour consigne de déplacer et de modifier les séances plutôt que
          de les supprimer pour les recréer&nbsp;: un changement reste un
          changement.
        </li>
        <li>
          Les séances réalisées et les activités enregistrées font partie de
          l'historique. L'agent ne peut pas les réécrire.
        </li>
        <li>
          L'IA ne fonctionne qu'après un consentement explicite, que l'on peut
          retirer.
        </li>
        <li>
          Les données vont au fournisseur de modèle que vous avez choisi, avec
          votre clé. Sur une instance auto-hébergée avec un modèle local, elles
          ne quittent pas votre serveur.
        </li>
      </ul>

      <h2>Une hypothèse prudente pour les prochaines années</h2>
      <p>
        Le coût administratif du coaching va continuer à baisser. Un coach qui
        passe son dimanche soir à réécrire les semaines de vingt athlètes y
        passera beaucoup moins de temps. Cela peut aller dans deux
        directions&nbsp;: plus d'athlètes par coach, ou plus d'attention par
        athlète. La seconde est le meilleur usage, et les athlètes verront bien
        laquelle leur coach a choisie.
      </p>
      <p>
        Les athlètes qui s'entraînent seuls avec un agent s'en sortiront bien
        s'ils savent déjà à quoi ressemble un bon entraînement et se servent de
        l'agent pour l'exécuter. C'est plus risqué pour les débutants, les moins
        à même de repérer un mauvais plan et les plus enclins à le suivre. Nous
        ne nous attendons pas à une prédiction fiable des blessures de
        sitôt&nbsp;: la recherche sur le dépistage et l'apprentissage
        automatique donne peu de raisons d'y croire. Et la part du coaching qui
        consiste à entendre que le «&nbsp;ça va&nbsp;» d'un athlète ne veut pas
        dire que ça va n'est pas près de disparaître.
      </p>

      <h2>Essayer</h2>
      <p>
        OpenAthlete propose un{' '}
        <Link href="/fr/features/mcp-server">serveur MCP</Link> compatible avec
        Claude, ChatGPT et d'autres clients. Il peut lire le contexte d'un
        athlète, son calendrier, ses activités et sa charge d'entraînement,
        enregistrer une maladie ou un déplacement, et planifier jusqu'à 60
        séances d'un coup&nbsp;; les séances apparaissent ensuite dans le
        calendrier et partent vers les montres Garmin, Suunto et COROS. C'est
        gratuit, et un coach peut l'utiliser pour tous les athlètes qu'il suit.
      </p>

      <h2>Sources</h2>
      <Sources />
    </div>
  );
}
